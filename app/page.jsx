'use client';
import { useState, useEffect, useRef } from 'react';
import TransactionForm from './components/transactionForm';
import TransactionTimeline from './components/transactionTimeline';
import { apiService } from './services/api';
import { webSocketService } from './services/websocket';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [userId] = useState('usuario-123');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasConnected = useRef(false);

  // ✅ Cargar transacciones históricas al iniciar
  useEffect(() => {
    const loadExistingTransactions = async () => {
      try {
        console.log('📦 Cargando transacciones existentes...');
        const response = await fetch('http://localhost:3001/transactions');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const transactions = await response.json();
        console.log(`✅ ${transactions.length} transacciones cargadas`);
        
        // Convertir transacciones a eventos del timeline
        const historicalEvents = transactions.flatMap(transaction => 
          generateTimelineEventsFromTransaction(transaction)
        );
        
        setEvents(historicalEvents);
        
      } catch (error) {
        console.error('❌ Error cargando transacciones:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingTransactions();
  }, []);

  useEffect(() => {
    // ✅ Conectar WebSocket UNA sola vez
    if (!hasConnected.current) {
      webSocketService.connect(userId);
      setIsConnected(true);
      hasConnected.current = true;
    }

    // ✅ Suscribirse a eventos
    const unsubscribe = webSocketService.onEvent((event) => {
      console.log('📩 Event received in page.jsx:', event.type);
      setEvents(prev => [...prev, event]);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // ✅ FUNCIÓN: Generar eventos desde transacción
  const generateTimelineEventsFromTransaction = (transaction) => {
    const events = [
      {
        id: `${transaction.transactionId}-initiated`,
        type: 'TransactionInitiated',
        transactionId: transaction.transactionId,
        ts: transaction.createdAt,
        payload: {
          fromAccount: transaction.fromAccount,
          toAccount: transaction.toAccount,
          amount: transaction.amount,
          currency: transaction.currency,
          description: transaction.description
        }
      },
      {
        id: `${transaction.transactionId}-reserved`,
        type: 'FundsReserved',
        transactionId: transaction.transactionId,
        ts: new Date(new Date(transaction.createdAt).getTime() + 1000),
        payload: {
          amount: transaction.amount,
          currency: transaction.currency
        }
      },
      {
        id: `${transaction.transactionId}-fraud`,
        type: 'FraudChecked',
        transactionId: transaction.transactionId,
        ts: new Date(new Date(transaction.createdAt).getTime() + 2000),
        payload: {
          fraudScore: transaction.fraudScore,
          risk: transaction.fraudScore > 70 ? 'HIGH' : 'LOW'
        }
      }
    ];

    // Agregar evento final basado en el status
    if (transaction.status === 'COMPLETED' || transaction.status === 'completed') {
      events.push({
        id: `${transaction.transactionId}-completed`,
        type: 'Committed',
        transactionId: transaction.transactionId,
        ts: transaction.updatedAt,
        payload: { status: 'completed' }
      });
      events.push({
        id: `${transaction.transactionId}-notified`,
        type: 'Notified',
        transactionId: transaction.transactionId,
        ts: new Date(new Date(transaction.updatedAt).getTime() + 1000),
        payload: { method: 'email' }
      });
    } else if (transaction.status === 'REVERSED' || transaction.status === 'reversed') {
      events.push({
        id: `${transaction.transactionId}-reversed`,
        type: 'Reversed',
        transactionId: transaction.transactionId,
        ts: transaction.updatedAt,
        payload: {
          reason: 'Fraud detected',
          fraudScore: transaction.fraudScore
        }
      });
    }

    return events;
  };

  const handleSubmit = async (transactionData) => {
    try {
      const result = await apiService.createTransaction(transactionData);
      console.log('Transacción iniciada:', result);
    } catch (error) {
      console.error('Error creando transacción:', error);
      alert('Error al crear la transacción. Por favor intenta nuevamente.');
    }
  };

  const clearTimeline = () => {
    console.log('🧹 Limpiando timeline (eventos:', events.length, ')');
    setEvents([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">₿</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Sistema Bancario de Eventos
                </h1>
                <p className="text-gray-400 text-sm">
                  Procesamiento de transacciones en tiempo real con Kafka
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-sm">{isConnected ? 'Conectado' : 'Desconectado'}</span>
              </div>
              
              <button
                onClick={clearTimeline}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
              >
                Limpiar Timeline
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Panel - Form */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">+</span>
                </div>
                <h2 className="text-xl font-semibold text-white">Nueva Transacción</h2>
              </div>
              <TransactionForm onSubmit={handleSubmit} />
            </div>

            {/* Stats Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 shadow-2xl">
              <h3 className="text-lg font-semibold mb-4 text-white">Estado del Sistema</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">{events.length}</div>
                  <div className="text-gray-400 text-sm">Total de Eventos</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">
                    {events.filter(e => e.type === 'Committed').length}
                  </div>
                  <div className="text-gray-400 text-sm">Completadas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Timeline */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">⏱</span>
                </div>
                <h2 className="text-xl font-semibold text-white">Línea de Tiempo</h2>
              </div>
              <div className="text-sm text-gray-400">
                {events.length} eventos
              </div>
            </div>
            <TransactionTimeline events={events} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-400 text-sm">
            Sistema Bancario en Tiempo Real • Desarrollado con Kafka & Next.js
          </div>
        </div>
      </footer>
    </div>
  );
}