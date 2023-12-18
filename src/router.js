const{getprediksi,getAllRiwayat_prediksi} = require("./handler.js")

const routes = [
    {
        method: "GET",
        path: "/:id_account/prediksi",
        handler: getprediksi,
      },
      {
        method: "GET",
        path: "/:id_account/riwayatprediksi",
        handler: getAllRiwayat_prediksi,
      },
      
]
module.exports = {routes};