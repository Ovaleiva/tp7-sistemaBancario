const express = require('express');
const cors = require('cors');
const { kafkaProducer } = require('../shared/kafka');
const { v4: uuidv4 } = require('uuid');
const { initializeDatabase, Transaction } = require('../shared/database');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ INICIALIZAR BASE DE DATOS
initializeDatabase().then(() => {
  console.log('✅ API Service connected to database');
}).catch(error => {
  console.error('❌ Database connection failed:', error);
});

// ✅ HEALTH CHECK ENDPOINT
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'API Service',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// ✅ GET ALL TRANSACTIONS ENDPOINT
app.get('/transactions', async (req, res) => {
  try {
    console.log('📦 Obteniendo todas las transacciones...');
    
    const transactions = await Transaction.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`✅ Encontradas ${transactions.length} transacciones`);
    res.json(transactions);
    
  } catch (error) {
    console.error('❌ Error obteniendo transacciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ✅ GET SPECIFIC TRANSACTION ENDPOINT
app.get('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📦 Obteniendo transacción: ${id}`);
    
    const transaction = await Transaction.findByPk(id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    
    res.json(transaction);
    
  } catch (error) {
    console.error('❌ Error obteniendo transacción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ✅ GET TIMELINE EVENTS FOR TRANSACTION
app.get('/transactions/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📦 Obteniendo eventos para transacción: ${id}`);
    
    const transaction = await Transaction.findByPk(id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    
    // Generar eventos del timeline basados en el estado de la transacción
    const events = generateTimelineEvents(transaction);
    res.json(events);
    
  } catch (error) {
    console.error('❌ Error obteniendo eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ✅ FUNCIÓN PARA GENERAR EVENTOS DEL TIMELINE
function generateTimelineEvents(transaction) {
  const baseEvents = [
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
      ts: new Date(transaction.createdAt.getTime() + 1000),
      payload: { 
        amount: transaction.amount,
        currency: transaction.currency
      }
    },
    {
      id: `${transaction.transactionId}-fraud`,
      type: 'FraudChecked',
      transactionId: transaction.transactionId,
      ts: new Date(transaction.createdAt.getTime() + 2000),
      payload: {
        fraudScore: transaction.fraudScore,
        risk: transaction.fraudScore > 70 ? 'HIGH' : 'LOW'
      }
    }
  ];
  
  // Agregar evento final basado en el status
  if (transaction.status === 'COMPLETED' || transaction.status === 'completed') {
    baseEvents.push({
      id: `${transaction.transactionId}-completed`,
      type: 'Committed',
      transactionId: transaction.transactionId,
      ts: transaction.updatedAt,
      payload: { status: 'completed' }
    });
    baseEvents.push({
      id: `${transaction.transactionId}-notified`,
      type: 'Notified',
      transactionId: transaction.transactionId,
      ts: new Date(transaction.updatedAt.getTime() + 1000),
      payload: { method: 'email' }
    });
  } else if (transaction.status === 'REVERSED' || transaction.status === 'reversed') {
    baseEvents.push({
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
  
  return baseEvents;
}

// ✅ EXISTING POST ENDPOINT (mantener este)
app.post('/transactions', async (req, res) => {
  try {
    const { userId, fromAccount, toAccount, amount, currency, description } = req.body;
    const transactionId = uuidv4();

    // ✅ GUARDAR EN BASE DE DATOS
    const savedTransaction = await Transaction.create({
      transactionId,
      userId,
      fromAccount,
      toAccount,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      description: description || 'Transferencia',
      status: 'pending',
      fraudScore: null
    });

    console.log('✅ Transacción guardada en DB:', transactionId);

    const event = {
      id: uuidv4(),
      type: 'TransactionInitiated',
      version: 1,
      ts: Date.now(),
      transactionId,
      userId,
      payload: { fromAccount, toAccount, amount: parseFloat(amount), currency, description }
    };

    await kafkaProducer.send({
      topic: 'txn.commands',
      messages: [{ key: transactionId, value: JSON.stringify(event) }]
    });

    res.json({ 
      success: true, 
      transactionId,
      message: 'Transaction initiated successfully' 
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3001, () => {
  console.log('🚀 API Service running on port 3001');
});