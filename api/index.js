const express = require('express');
const cors = require('cors');
const { kafkaProducer } = require('../shared/kafka');
const { v4: uuidv4 } = require('uuid');
const { initializeDatabase, Transaction } = require('../shared/database'); // ✅ NUEVO

const app = express();
app.use(cors());
app.use(express.json());

// ✅ INICIALIZAR BASE DE DATOS
initializeDatabase().then(() => {
  console.log('✅ API Service connected to database');
}).catch(error => {
  console.error('❌ Database connection failed:', error);
});

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