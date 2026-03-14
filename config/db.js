// backend/config/db.js
// MySQL connection pool via mysql2

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  port:     process.env.DB_PORT     || 3306,
  database: process.env.DB_NAME     || "educore",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASS     || "",
  waitForConnections: true,
  connectionLimit:    10,
});

// Convenience: returns [rows, fields]
const query = (sql, params) => pool.execute(sql, params);

module.exports = { pool, query };
