const fetch = require('node-fetch');
const tf = require('@tensorflow/tfjs');
const csv = require('csv-parser');
const fs = require('fs');

const getprediksi = async (req, res) => {
    try {
        const { id_account, pendapatan } = req.params;
        const apiUrl = `https://backend-moneo-pyy3zhb4pa-et.a.run.app/${id_account}/detaillaporan`;
        const response = await fetch(apiUrl);
    
        if (response.ok) {
          const data = await response.json();
          const { totalIncome, totalExpenses } = data.summary;
          const totalPemasukanInt = parseInt(totalIncome.replace(/[^\d]/g, ''), 10);
          const totalPengeluaranInt = parseInt(totalExpenses.replace(/[^\d]/g, ''), 10);
    
          // Baca file CSV dan proses data untuk membandingkan dengan input pengguna
          const hasilPrediksi = await processDataForComparison(totalPemasukanInt, totalPengeluaranInt, pendapatan);
    
          res.json({ hasilPrediksi });
        } else {
          throw new Error('Gagal mengambil data');
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    };

    async function processDataForComparison(totalIncome) {
        return new Promise((resolve, reject) => {
          const data = [];
          fs.createReadStream('./src/data_training/Daily Household Transactions.csv')
            .pipe(csv())
            .on('data', (row) => {
              const pendapatan = parseFloat(row.pendapatan);
              const pengeluaran = parseFloat(row.pengeluaran);
      
              if (!isNaN(pendapatan) && !isNaN(pengeluaran)) {
                data.push({ pendapatan, pengeluaran });
              }
            })
            .on('end', () => {
              const pendapatanTensor = tf.tensor2d(data.map(d => d.pendapatan), [data.length, 1]);
              const pengeluaranTensor = tf.tensor2d(data.map(d => d.pengeluaran), [data.length, 1]);
      
              const model = tf.sequential();
              model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
              model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });
      
              model.fit(pendapatanTensor, pengeluaranTensor, { epochs: 10 })
                .then(() => {
                  const hasilPrediksi = model.predict(tf.tensor2d([[totalIncome]])).dataSync();
                  resolve(hasilPrediksi);
                })
                .catch(err => reject(err));
            });
        });
      }
      


module.exports = {getprediksi}