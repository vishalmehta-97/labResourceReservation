const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lab_reservation_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00',
  dateStrings: false,
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('[DB] MySQL connection pool established successfully');
    conn.release();
  })
  .catch(err => {
    console.warn(`[DB] Warning: Could not establish initial connection to MySQL at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}: ${err.message}`);
    console.warn('[DB] Please make sure your MySQL server is running and database "lab_reservation_db" exists.');
  });

module.exports = pool;
