// shared/database.js
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'bancodb',
  process.env.DB_USER || 'admin',
  process.env.DB_PASS || 'password',
  {
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    retry: {
      max: 5,
      timeout: 3000,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const Transaction = sequelize.define('Transaction', {
  transactionId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: { type: DataTypes.STRING, allowNull: false },
  fromAccount: { type: DataTypes.STRING, allowNull: false },
  toAccount: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  currency: { type: DataTypes.STRING, defaultValue: 'USD' },
  status: { 
    type: DataTypes.ENUM('pending', 'funds_reserved', 'completed', 'failed', 'fraud_detected'),
    defaultValue: 'pending'
  },
  description: { type: DataTypes.TEXT },
  fraudScore: { type: DataTypes.INTEGER }
}, {
  tableName: 'transactions'
});

// ✅ FUNCIÓN CORRECTAMENTE DEFINIDA
const initializeDatabase = async (retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Conexión a PostgreSQL establecida correctamente');
      
      await sequelize.sync({ force: false });
      console.log('✅ Tablas sincronizadas correctamente');
      
      return true;
    } catch (error) {
      console.error(`❌ Intento ${i + 1}/${retries} - Error conectando:`, error.message);
      
      if (i < retries - 1) {
        console.log(`⏳ Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ Todos los intentos de conexión fallaron');
        return false;
      }
    }
  }
};

// ✅ EXPORTACIÓN CORRECTA
module.exports = {
  sequelize,
  Transaction,
  initializeDatabase
};