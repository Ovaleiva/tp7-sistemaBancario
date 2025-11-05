const { Kafka, Partitioners } = require('kafkajs');

// En Docker usa 'kafka:9092', localmente 'localhost:9092'
const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'banking-system', // ← Usa la variable de entorno
  brokers: [kafkaBrokers], // ← Usa la variable kafkaBrokers aquí
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

// Conectar producer con manejo de errores
producer.connect()
  .then(() => console.log('✅ Kafka Producer connected to', kafkaBrokers))
  .catch(err => console.log('⚠️ Producer connection failed:', err.message));

const kafkaProducer = producer;
const kafkaConsumer = (groupId) => kafka.consumer({ 
  groupId,
  retry: {
    initialRetryTime: 1000,
    retries: 10
  }
});

module.exports = { kafkaProducer, kafkaConsumer };