const { Pool } = require("pg");


const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "nanda",
  database: "moneo",
  port: 5432, // Port default PostgreSQL
  max: 10, // Jumlah maksimum koneksi dalam pool
  idleTimeoutMillis: 30000, // Waktu (ms) koneksi idle sebelum dihapus dari pool
  connectionTimeoutMillis: 2000, // Waktu (ms) yang diperbolehkan untuk mendapatkan koneksi dari pool
});

module.exports = {
  pool,
};