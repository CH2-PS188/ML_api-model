// Import modul yang diperlukan
const express = require('express');
const cors = require('cors')
const {routes} = require("./router")
// Inisialisasi aplikasi Express
const app = express();
// Add this line to enable JSON body parsing
app.use(express.json());
// Use the cors middleware to enable Cross-Origin Resource Sharing
app.use(cors());
//routers
routes.forEach((route) => {
  const { method, path, handler } = route;
  app[method.toLowerCase()](path, handler);
});
// Jalankan server pada port tertentu (misalnya, port 3000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan pada port ${PORT}`);
});
