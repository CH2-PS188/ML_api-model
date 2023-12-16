const{getprediksi} = require("./handler.js")

const routes = [
    {
        method: "GET",
        path: "/:id_account/prediksi",
        handler: getprediksi,
      },
]
module.exports = {routes};