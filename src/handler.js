const fs = require('fs');
const tf = require('@tensorflow/tfjs');
const { pool } = require("./db/db");
const { performance } = require('perf_hooks'); 

function readCSVFile(filePath) {
  try {
    const dataCSV = fs.readFileSync(filePath, 'utf8');
    const processedData = processDataFromCSV(dataCSV);
    return processedData;
  } catch (error) {
    throw new Error('Gagal membaca atau memproses file CSV: ' + error.message);
  }
}

function processDataFromCSV(csvData) {
  const processedData = csvData.split('\n').slice(1).map(row => {
    const columns = row.split(',');
    return {
      Income: parseFloat(columns[1]),
      Risk_Flag: parseInt(columns[12])
    };
  });
  return processedData;
}

async function trainModel(dataCSV, totalPemasukanINR) {
  try {
    if (Array.isArray(dataCSV)) {
      const inputData = tf.tensor1d(dataCSV.map(d => d.Income));
      const outputData = tf.tensor1d(dataCSV.map(d => d.Risk_Flag));

      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      model.compile({ loss: 'meanSquaredError', optimizer: 'sgd', metrics: ['accuracy'] });

      const history = await model.fit(inputData, outputData, { epochs: 10 });
      const accuracy = history.history.acc[history.history.acc.length - 1] * 100;

      const hasilPrediksi = {
        accuracy: `${accuracy.toFixed(2)}%`,
        risk: cariRisk(totalPemasukanINR) 
      };

      return hasilPrediksi;
    } else {
      throw new Error('Data bukan dalam format yang diharapkan (tidak dalam bentuk array)');
    }
  } catch (error) {
    throw new Error('Gagal melakukan prediksi: ' + error.message);
  }
}

function cariRisk(totalPemasukan) {
  try {
    const dataCSV = fs.readFileSync('./src/data_training/Training Data.csv', 'utf8');
    const rows = dataCSV.split('\n');
    let riskFlag = null; // Mengubah riskFlag menjadi null untuk kasus default
    let dataFound = false; // Mendefinisikan dataFound sebagai false
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',');
      if (values.length >= 2) {
        const incomeFromCSV = parseFloat(values[1].trim());
        const tolerance = incomeFromCSV * 0.05;
        if (Math.abs(totalPemasukan - incomeFromCSV) <= tolerance) {
          riskFlag = parseInt(values[values.length - 1].trim());
          dataFound = true;
          break;
        }
      }
    }

    if (!dataFound) {
      if (totalPemasukan < 10310) {
        riskFlag = 1;
      } else if (totalPemasukan > 9999938) {
        riskFlag = 0;
      }
    }
    return riskFlag;
  } catch (error) {
    console.error('Gagal membaca file CSV:', error);
    return null;
  }
}


const getprediksi = async (req, res) => {
  try {
    const { id_account } = req.params;
    const waktuAwal = performance.now();
    const apiUrl = `https://backend-moneo-pyy3zhb4pa-et.a.run.app/${id_account}/detaillaporan`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Gagal mengambil data');
    }
    const data = await response.json();
    const { difference } = data.summary;
    const nilaiTukarIDRtoINR = 0.42;
    const totalPemasukanIDR = parseInt(difference.replace(/[^\d]/g, ''), 10);
    const totalPemasukanINR = totalPemasukanIDR * nilaiTukarIDRtoINR;
    const waktuAkhir = performance.now();

    const dataCSV = readCSVFile('./src/data_training/Training Data.csv');
    const hasilPrediksi = await trainModel(dataCSV, totalPemasukanINR);

    const totalWaktuLoading = (waktuAkhir - waktuAwal) / 1000;
    const tanggalPrediksi = new Date().toLocaleDateString();

    const perbandingan = {
      totalPemasukanIDR,
      totalPemasukanINR,
      accuracy: hasilPrediksi.accuracy,
      risk: hasilPrediksi.risk,
      totalWaktuLoading: totalWaktuLoading.toFixed(2),
      tanggalPrediksi
    };
    const queryValues = [
      hasilPrediksi.accuracy,
      hasilPrediksi.risk,
      totalWaktuLoading.toFixed(2),
      tanggalPrediksi
    ];
    
    const queryText = `
    INSERT INTO Riwayat_prediksi (accuracy, risk, total_waktu_loading, tanggal_prediksi) 
    VALUES ($1, $2, $3, $4)
  `;
  
  await pool.query(queryText, queryValues);
  res.json({ perbandingan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRiwayat_prediksi = async (req, res) => {
  try {
    // Retrieve all rekenings from the database
    const result = await pool.query("SELECT * FROM Riwayat_prediksi");
    const rows = result.rows;

    if (rows.length === 0) {
      res.status(404).json({ error: "No Riwayat_prediksi" });
    } else {
      res.status(200).json(rows);
    }
  } catch (error) {
    console.error("Error Riwayat_prediksi:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = { getprediksi,getAllRiwayat_prediksi };
