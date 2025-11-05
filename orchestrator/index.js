const { kafkaConsumer, kafkaProducer } = require('../shared/kafka');
const { v4: uuidv4 } = require('uuid');

// IMPORTACIÓN TEMPORAL MÁS SEGURA
let Transaction;
let initializeDatabase;

try {
  const database = require('../shared/database');
  Transaction = database.Transaction;
  initializeDatabase = database.initializeDatabase;
  console.log('🔍 Database module loaded successfully in Orchestrator');
} catch (error) {
  console.error('❌ Error loading database module in Orchestrator:', error);
  process.exit(1);
}

// VERIFICAR QUE LAS FUNCIONES EXISTAN
console.log('🔍 Orchestrator - initializeDatabase type:', typeof initializeDatabase);
console.log('🔍 Orchestrator - Transaction type:', typeof Transaction);

// ✅ INICIALIZAR BASE DE DATOS
if (typeof initializeDatabase === 'function') {
  initializeDatabase().then(() => {
    console.log('✅ Orchestrator connected to database');
  }).catch(error => {
    console.error('❌ Orchestrator database connection failed:', error);
  });
} else {
  console.error('❌ Orchestrator - initializeDatabase is not a function!');
}

async function startOrchestrator() {
  const consumer = kafkaConsumer('orchestrator-group');
  await consumer.connect();
  await consumer.subscribe({ topic: 'txn.commands', fromBeginning: true });

  console.log('🔄 Orchestrator consuming from txn.commands...');

  await consumer.run({
    eachMessage: async ({ message }) => {
      const command = JSON.parse(message.value.toString());
      
      try {
        await processTransactionFlow(command);
      } catch (error) {
        console.error('❌ Error inesperado:', error);
        await sendToDLQ(command, error);
      }
    }
  });
}

async function processTransactionFlow(command) {
  const { transactionId, userId, payload, correlationId } = command;

  console.log(`🔄 Processing transaction: ${transactionId}`);

  // 1. EMITIR FundsReserved
  const fundsEvent = {
    id: uuidv4(),
    type: 'FundsReserved',
    version: 1,
    ts: Date.now(),
    transactionId,
    userId,
    correlationId: command.id,
    payload: {
      ok: true,
      holdId: uuidv4(),
      amount: payload.amount
    }
  };
  await emitEvent(fundsEvent);

  // ✅ ACTUALIZAR ESTADO EN DB
  if (Transaction) {
    await Transaction.update(
      { status: 'funds_reserved' },
      { where: { transactionId } }
    );
  }

  // 2. CHEQUEO DE FRAUDE SIMULADO
  await new Promise(resolve => setTimeout(resolve, 1000));
  const risk = Math.random() > 0.3 ? 'LOW' : 'HIGH'; // 70% LOW, 30% HIGH
  const fraudScore = risk === 'HIGH' ? 85 : 25;

  // 3. EMITIR FraudChecked
  const fraudEvent = {
    id: uuidv4(),
    type: 'FraudChecked',
    version: 1,
    ts: Date.now(),
    transactionId,
    userId,
    correlationId: command.id,
    payload: {
      risk: risk
    }
  };
  await emitEvent(fraudEvent);

  // ✅ ACTUALIZAR SCORE DE FRAUDE EN DB
  if (Transaction) {
    await Transaction.update(
      { fraudScore },
      { where: { transactionId } }
    );
  }

  // 4. DECISIÓN BASADA EN RIESGO
  if (risk === 'LOW') {
    // EMITIR Committed
    const commitEvent = {
      id: uuidv4(),
      type: 'Committed',
      version: 1,
      ts: Date.now(),
      transactionId,
      userId,
      correlationId: command.id,
      payload: {
        ledgerTxId: uuidv4()
      }
    };
    await emitEvent(commitEvent);

    // ✅ ACTUALIZAR ESTADO A COMPLETADO
    if (Transaction) {
      await Transaction.update(
        { status: 'completed' },
        { where: { transactionId } }
      );
    }

    // EMITIR Notified
    const notifyEvent = {
      id: uuidv4(),
      type: 'Notified',
      version: 1,
      ts: Date.now(),
      transactionId,
      userId,
      correlationId: command.id,
      payload: {
        channels: ['email', 'push']
      }
    };
    await emitEvent(notifyEvent);

  } else {
    // EMITIR Reversed (por riesgo HIGH)
    const reverseEvent = {
      id: uuidv4(),
      type: 'Reversed',
      version: 1,
      ts: Date.now(),
      transactionId,
      userId,
      correlationId: command.id,
      payload: {
        reason: 'High fraud risk detected'
      }
    };
    await emitEvent(reverseEvent);

    // ✅ ACTUALIZAR ESTADO A FRAUDE DETECTADO
    if (Transaction) {
      await Transaction.update(
        { status: 'fraud_detected' },
        { where: { transactionId } }
      );
    }
  }
}

async function emitEvent(event) {
  await kafkaProducer.send({
    topic: 'txn.events',
    messages: [{ key: event.transactionId, value: JSON.stringify(event) }]
  });
  console.log(`📤 Emitted: ${event.type} for ${event.transactionId}`);
}

async function sendToDLQ(command, error) {
  const dlqEvent = {
    ...command,
    error: error.message,
    dlqTimestamp: new Date().toISOString()
  };

  await kafkaProducer.send({
    topic: 'txn.dlq',
    messages: [{ key: command.transactionId, value: JSON.stringify(dlqEvent) }]
  });
  
  // ✅ ACTUALIZAR ESTADO A FALLIDO
  if (Transaction) {
    await Transaction.update(
      { status: 'failed' },
      { where: { transactionId: command.transactionId } }
    );
  }
  
  console.log(`🚨 Sent to DLQ: ${command.transactionId}`);
}

startOrchestrator().catch(console.error);