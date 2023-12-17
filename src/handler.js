const fs = require('fs');
const tf = require('@tensorflow/tfjs');
const csv = require('csv-parser');
const { performance } = require('perf_hooks'); 

const getprediksi = async (req, res) => {
  try {
    const { id_account } = req.params;
    const waktuAwal = performance.now(); // Catat waktu awal
    const apiUrl = `https://backend-moneo-pyy3zhb4pa-et.a.run.app/${id_account}/detaillaporan`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Gagal mengambil data');
    }
    const data = await response.json();
    const { totalIncome } = data.summary;
    const nilaiTukarIDRtoINR = 49; // Asumsikan nilai tukar saat ini
    const totalPemasukanIDR = parseInt(totalIncome.replace(/[^\d]/g, ''), 10);
    const totalPemasukanINR = totalPemasukanIDR * nilaiTukarIDRtoINR;
    const hasilPrediksi = await processDataForComparison(totalPemasukanINR);
    const waktuAkhir = performance.now(); // Catat waktu setelah mendapatkan hasil prediksi
    const totalWaktuLoading = (waktuAkhir - waktuAwal) / 1000; // Total waktu loading dalam detik
    const tanggalPrediksi = new Date().toLocaleDateString(); // Tanggal saat ini sebagai tanggal prediksi
    const perbandingan = {
      totalPemasukanIDR,
      totalPemasukanINR,
      hasilPrediksi,
      totalWaktuLoading: totalWaktuLoading.toFixed(2), // Ubah menjadi dua angka di belakang koma
      tanggalPrediksi
    };

    res.json({ perbandingan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function processDataForComparison(totalIncome) {
  return new Promise((resolve, reject) => {
    const data = [];

    const stream = fs.createReadStream('./src/data_training/Training Data.csv')
      .pipe(csv())
      .on('data', (row) => {
        const income = parseFloat(row.Income);
        const risk = parseInt(row.Risk_Flag);
        if (!isNaN(income) && !isNaN(risk)) {
          data.push({ income, risk });
        }
      })
      .on('end', () => {
        trainModel(data, totalIncome)
          .then((hasilPrediksi) => resolve(hasilPrediksi))
          .catch((err) => reject(err));
      });
    stream.on('error', (err) => {
      reject(err);
    });
  });
}

async function trainModel(data, input) {
  return new Promise((resolve, reject) => {
    try {
      const inputData = tf.tensor1d(data.map(d => d.income));
      const outputData = tf.tensor1d(data.map(d => d.risk));

      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

      model.fit(inputData, outputData, { epochs: 10 })
        .then(() => {
          const prediction = model.predict(tf.tensor1d([input]));

          prediction.data()
            .then((predData) => {
              const predictedValue = predData[0];
              const accuracy = calculateAccuracy(predictedValue, outputData.dataSync());
              const predictedRisk = predictedValue > 0.5 ? 1 : 0;
              const hasilPrediksi = {
                prediction: predictedValue,
                accuracy: accuracy.toFixed(2),
                risk: predictedRisk
              };
              resolve(hasilPrediksi);
            })
            .catch((err) => reject(err));
        })
        .catch((err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
}


function calculateAccuracy(prediction, actual) {
  const threshold = 0.5;
  const predictedRisk = prediction > threshold ? 1 : 0;
  const correctPredictions = actual.filter((val) => val === predictedRisk);
  const accuracy = (correctPredictions.length / actual.length) * 100;
  return accuracy;
}

module.exports = { getprediksi };
