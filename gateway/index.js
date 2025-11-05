const { WebSocketServer } = require('ws');
const { kafkaConsumer } = require('../shared/kafka');

const wss = new WebSocketServer({ port: 3002 });
const clients = new Map(); // userId -> [websockets]

// ✅ CONSUME txn.events
async function startGateway() {
  const consumer = kafkaConsumer('gateway-group');
  await consumer.connect();
  await consumer.subscribe({ topic: 'txn.events', fromBeginning: false });

  console.log('🌐 Gateway consuming from txn.events...');

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      
      // ✅ FILTRA por userId/transactionId
      broadcastToClients(event);
    }
  });
}

// ✅ PUSH WebSocket a clientes
function broadcastToClients(event) {
  const { userId, transactionId } = event;
  
  if (clients.has(userId)) {
    clients.get(userId).forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify(event));
      }
    });
  }
  
  console.log(`📨 Gateway forwarded: ${event.type} to user ${userId}`);
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const { type, userId, transactionId } = JSON.parse(data);
      if (type === 'subscribe') {
        if (!clients.has(userId)) clients.set(userId, new Set());
        clients.get(userId).add(ws);
        ws.userId = userId;
        console.log(`👤 User ${userId} subscribed to WebSocket`);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    if (ws.userId && clients.has(ws.userId)) {
      clients.get(ws.userId).delete(ws);
    }
  });
});

startGateway();