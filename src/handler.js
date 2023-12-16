const tf = require('@tensorflow/tfjs');
const fetch = require('node-fetch');

const getprediksi = async (req, res) => {
    try {
        const { id_account } = req.params;
        const apiUrl = `https://backend-moneo-pyy3zhb4pa-et.a.run.app/${id_account}/detaillaporan`;
        // Mengambil data dari API menggunakan fetch atau axios
        const response = await fetch(apiUrl);
        // Jika menggunakan axios: const response = await axios.get(apiUrl);
        if (response.ok) {
          const data = await response.json();
          // Ambil hanya informasi total pemasukan dan pengeluaran
            const { totalIncome, totalExpenses } = data.summary;
            const totalPemasukanInt = parseInt(totalIncome.replace(/[^\d]/g, ''), 10);
            // Mengubah total pengeluaran ke integer dan menghapus tanda + atau -
            const totalPengeluaranInt = parseInt(totalExpenses.replace(/[^\d]/g, ''), 10);
            res.json({totalPemasukanInt, totalPengeluaranInt});

            //CODE DARI TEAM ML

        } else {
          throw new Error('Gagal mengambil data');
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
}

module.exports = {getprediksi}