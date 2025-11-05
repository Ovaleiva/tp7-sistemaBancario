'use client';
import { useEffect, useState } from 'react';

export default function TransactionTimeline({ events = [] }) {
  const [localEvents, setLocalEvents] = useState(events);

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const getEventConfig = (type) => {
    const configs = {
      'TransactionInitiated': {
        color: 'from-blue-500 to-blue-600',
        border: 'border-blue-500/20',
        bg: 'bg-blue-500/10',
        icon: '🔄',
        title: 'Transacción Iniciada'
      },
      'FundsReserved': {
        color: 'from-green-500 to-green-600', 
        border: 'border-green-500/20',
        bg: 'bg-green-500/10',
        icon: '💰',
        title: 'Fondos Reservados'
      },
      'FraudChecked': {
        color: 'from-yellow-500 to-yellow-600',
        border: 'border-yellow-500/20',
        bg: 'bg-yellow-500/10',
        icon: '🛡️',
        title: 'Verificación de Fraude'
      },
      'Committed': {
        color: 'from-purple-500 to-purple-600',
        border: 'border-purple-500/20',
        bg: 'bg-purple-500/10',
        icon: '✅',
        title: 'Transacción Completada'
      },
      'Reversed': {
        color: 'from-red-500 to-red-600',
        border: 'border-red-500/20',
        bg: 'bg-red-500/10',
        icon: '❌',
        title: 'Transacción Revertida'
      },
      'Notified': {
        color: 'from-gray-500 to-gray-600',
        border: 'border-gray-500/20',
        bg: 'bg-gray-500/10',
        icon: '📧',
        title: 'Notificación Enviada'
      }
    };
    return configs[type] || {
      color: 'from-gray-500 to-gray-600',
      border: 'border-gray-500/20',
      bg: 'bg-gray-500/10',
      icon: '⚡',
      title: type
    };
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-AR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {localEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏰</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No hay eventos aún</h3>
          <p className="text-gray-400 text-sm">
            Crea una transacción para ver la línea de tiempo en tiempo real
          </p>
        </div>
      ) : (
        localEvents.map((event, index) => {
          const config = getEventConfig(event.type);
          return (
            <div
              key={event.id || index}
              className={`p-4 rounded-xl border-l-4 ${config.border} ${config.bg} backdrop-blur-sm transform transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className={`w-12 h-12 bg-gradient-to-r ${config.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <span className="text-white text-lg">{config.icon}</span>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {config.title}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Transacción: <span className="font-mono text-blue-300">{event.transactionId}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-300 bg-gray-700 px-2 py-1 rounded-lg">
                        {formatTime(event.ts)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Payload */}
                  {event.payload && (
                    <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {/* Risk indicator for FraudChecked */}
                  {event.type === 'FraudChecked' && event.payload && (
                    <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      event.payload.risk === 'HIGH' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                        : 'bg-green-500/20 text-green-300 border border-green-500/30'
                    }`}>
                      {event.payload.risk === 'HIGH' ? '🔴 Riesgo Alto' : '🟢 Riesgo Bajo'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}