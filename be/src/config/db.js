const mysql = require('mysql2/promise');
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const dbConfig = {
  host: isProd ? process.env.DB_HOST_PROD : process.env.DB_HOST_LOCAL,
  user: isProd ? process.env.DB_USER_PROD : process.env.DB_USER_LOCAL,
  password: isProd ? process.env.DB_PASSWORD_PROD : process.env.DB_PASSWORD_LOCAL,
  database: isProd ? process.env.DB_NAME_PROD : process.env.DB_NAME_LOCAL,
  port: isProd ? Number(process.env.DB_PORT_PROD) : Number(process.env.DB_PORT_LOCAL),
  charset: isProd ? 'utf8mb4' : process.env.DB_CHARSET_LOCAL || 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testConnection
};