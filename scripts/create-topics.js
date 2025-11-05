const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'topic-setup',
  brokers: ['localhost:9092'],
});

const admin = kafka.admin();

async function createTopics() {
  await admin.connect();
  
  const topics = [
    {
      topic: 'txn.commands',
      numPartitions: 1,
      replicationFactor: 1
    },
    {
      topic: 'txn.events', 
      numPartitions: 1,
      replicationFactor: 1
    },
    {
      topic: 'txn.dlq',
      numPartitions: 1,
      replicationFactor: 1
    }
  ];

  try {
    await admin.createTopics({
      topics: topics,
      waitForLeaders: true
    });
    console.log('✅ Topics created successfully');
  } catch (error) {
    console.log('ℹ️ Topics might already exist:', error.message);
  } finally {
    await admin.disconnect();
  }
}

createTopics().catch(console.error);