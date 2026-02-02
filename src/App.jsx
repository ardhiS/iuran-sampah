import { useState, useEffect } from 'react';
import './App.css';

// URL Google Sheets yang dipublikasikan sebagai CSV
// Ganti dengan URL Google Sheets Anda
const GOOGLE_SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT03sZNnKiWPvrih-7YJbrh6Th_azWmTzYKpbZ6_IuymxCWHGv7Fa_7zhgzV3ANjQ/pub?gid=1098928608&single=true&output=csv';

// Nama bulan
const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

// Nominal iuran per bulan
const IURAN_BULANAN = 10000;

// Format currency Indonesia
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Parse CSV to array - improved version for Google Sheets with header rows
const parseCSV = (csv) => {
  const lines = csv.split('\n').filter((line) => line.trim());

  // Find the header row (line that contains 'No' and 'Nama' or 'Warga')
  let headerIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (
      (line.includes('no') && line.includes('nama')) ||
      (line.includes('no') && line.includes('warga')) ||
      (line.includes('no,') && line.includes('januari'))
    ) {
      headerIndex = i;
      break;
    }
  }

  // Parse header - trim whitespace from each header
  const headers = parseCSVLine(lines[headerIndex]).map((h) => h.trim());

  const data = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  console.log('Found header at line:', headerIndex);
  console.log('Headers:', headers);
  console.log('Sample data:', data.slice(0, 3));

  return { headers, data };
};

// Helper function to parse CSV line properly
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  // Push last value
  result.push(current.trim().replace(/^"|"$/g, ''));

  return result;
};

function App() {
  const [residents, setResidents] = useState([]);
  const [summary, setSummary] = useState({
    totalPerBulan: {},
    totalPengeluaran: 0,
    totalPemasukan: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Data demo untuk testing
  const loadDemoData = () => {
    const demoResidents = [
      {
        no: 1,
        nama: 'Ahmad Suryadi (Pak RT)',
        payments: {
          Januari: 10000,
          Februari: 10000,
          Maret: 10000,
          April: 10000,
          Mei: 10000,
          Juni: 10000,
          Juli: 10000,
          Agustus: 10000,
          September: 10000,
          Oktober: 10000,
          November: 10000,
          Desember: 10000,
        },
      },
      {
        no: 2,
        nama: 'Budi Santoso',
        payments: {
          Januari: 10000,
          Februari: 10000,
          Maret: 10000,
          April: 10000,
          Mei: 10000,
          Juni: 10000,
          Juli: 0,
          Agustus: 0,
          September: 0,
          Oktober: 0,
          November: 0,
          Desember: 0,
        },
      },
      {
        no: 3,
        nama: 'Citra Dewi',
        payments: {
          Januari: 10000,
          Februari: 10000,
          Maret: 10000,
          April: 10000,
          Mei: 10000,
          Juni: 10000,
          Juli: 10000,
          Agustus: 10000,
          September: 0,
          Oktober: 0,
          November: 0,
          Desember: 0,
        },
      },
      {
        no: 4,
        nama: 'Dian Pratama',
        payments: {
          Januari: 10000,
          Februari: 10000,
          Maret: 10000,
          April: 0,
          Mei: 0,
          Juni: 0,
          Juli: 0,
          Agustus: 0,
          September: 0,
          Oktober: 0,
          November: 0,
          Desember: 0,
        },
      },
      {
        no: 5,
        nama: 'Eko Wijaya (H. Eko)',
        payments: {
          Januari: 10000,
          Februari: 10000,
          Maret: 10000,
          April: 10000,
          Mei: 10000,
          Juni: 10000,
          Juli: 10000,
          Agustus: 10000,
          September: 10000,
          Oktober: 10000,
          November: 10000,
          Desember: 10000,
        },
      },
      {
        no: 6,
        nama: 'Fitri Handayani',
        payments: {
          Januari: 10000,
          Februari: 10000,
          Maret: 10000,
          April: 10000,
          Mei: 10000,
          Juni: 0,
          Juli: 0,
          Agustus: 0,
          September: 0,
          Oktober: 0,
          November: 0,
          Desember: 0,
        },
      },
      {
        no: 7,
        nama: 'Gunawan Setiawan',
        payments: {
          Januari: 10000,
          Februari: 10000,
          Maret: 10000,
          April: 10000,
          Mei: 10000,
          Juni: 10000,
          Juli: 10000,
          Agustus: 0,
          September: 0,
          Oktober: 0,
          November: 0,
          Desember: 0,
        },
      },
      {
        no: 8,
        nama: 'Hesti Rahayu',
        payments: {
          Januari: 10000,
          Februari: 10000,
          Maret: 10000,
          April: 10000,
          Mei: 10000,
          Juni: 10000,
          Juli: 10000,
          Agustus: 10000,
          September: 10000,
          Oktober: 0,
          November: 0,
          Desember: 0,
        },
      },
      {
        no: 9,
        nama: 'Irfan Hakim',
        payments: {
          Januari: 10000,
          Februari: 0,
          Maret: 0,
          April: 0,
          Mei: 0,
          Juni: 0,
          Juli: 0,
          Agustus: 0,
          September: 0,
          Oktober: 0,
          November: 0,
          Desember: 0,
        },
      },
      {
        no: 10,
        nama: 'Joko Susilo',
        payments: {
          Januari: 10000,
          Februari: 10000,
          Maret: 10000,
          April: 10000,
          Mei: 10000,
          Juni: 10000,
          Juli: 10000,
          Agustus: 10000,
          September: 10000,
          Oktober: 10000,
          November: 0,
          Desember: 0,
        },
      },
    ];

    setResidents(demoResidents);

    // Hitung ringkasan
    const totalPerBulan = {};
    MONTHS.forEach((month) => {
      totalPerBulan[month] = demoResidents.reduce(
        (sum, r) => sum + (r.payments[month] || 0),
        0,
      );
    });

    const totalPemasukan = Object.values(totalPerBulan).reduce(
      (a, b) => a + b,
      0,
    );
    const totalPengeluaran = 0; // Akan diambil dari data Google Sheets jika ada
    const sisaSaldo = totalPemasukan - totalPengeluaran;

    setSummary({ totalPerBulan, totalPengeluaran, totalPemasukan, sisaSaldo });
    setLoading(false);
    setTimeout(() => setIsLoaded(true), 100);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);

        if (!response.ok) {
          throw new Error('Gagal mengambil data');
        }

        const csv = await response.text();
        const { headers, data } = parseCSV(csv);

        console.log('All headers:', headers);

        // Process residents data
        const processedResidents = [];
        const totalPerBulan = {};
        MONTHS.forEach((m) => (totalPerBulan[m] = 0));

        // Find column names dynamically
        const noCol = headers.find(
          (h) => h.toLowerCase() === 'no' || h.toLowerCase() === 'no.',
        );
        const namaCol = headers.find(
          (h) =>
            h.toLowerCase().includes('nama') ||
            h.toLowerCase().includes('warga') ||
            h.toLowerCase().includes('penghuni'),
        );

        console.log('No column:', noCol, 'Nama column:', namaCol);

        // Variables for summary data from spreadsheet
        let totalUangMasuk = 0;
        let totalUangKeluar = 0;
        let sisaSaldo = 0;

        data.forEach((row, index) => {
          // Get nama from detected column or try common variations
          const nama =
            row[namaCol] ||
            row['Nama Warga'] ||
            row['Nama'] ||
            row['NAMA'] ||
            row['nama'] ||
            '';
          const no = row[noCol] || row['No'] || row['NO'] || row['no'] || '';

          // Check for summary rows and extract values
          const namaLower = nama.toLowerCase().trim();
          const noTrimmed = String(no).trim();

          // Extract summary data from special rows
          if (
            namaLower.includes('total uang masuk') ||
            namaLower.includes('total pemasukan')
          ) {
            // Get value from Februari column or any column with value
            const value =
              row['Februari'] ||
              Object.values(row).find((v) => v && String(v).match(/[\d,]+/)) ||
              '';
            totalUangMasuk =
              parseInt(String(value).replace(/[^0-9]/g, '')) || 0;
            console.log('Found Total Uang Masuk:', totalUangMasuk);
            return;
          }

          if (
            namaLower.includes('uang keluar') ||
            namaLower.includes('pengeluaran')
          ) {
            const value =
              row['Februari'] ||
              Object.values(row).find((v) => v && String(v).match(/[\d,]+/)) ||
              '';
            totalUangKeluar =
              parseInt(String(value).replace(/[^0-9]/g, '')) || 0;
            console.log('Found Total Uang Keluar:', totalUangKeluar);
            return;
          }

          if (namaLower.includes('sisa saldo') || namaLower === 'saldo') {
            const value =
              row['Februari'] ||
              Object.values(row).find((v) => v !== undefined && v !== '') ||
              '';
            sisaSaldo = parseInt(String(value).replace(/[^0-9]/g, '')) || 0;
            console.log('Found Sisa Saldo:', sisaSaldo);
            return;
          }

          // Skip if it's a summary row or header-like row
          if (
            namaLower.includes('total') ||
            namaLower.includes('operasional') ||
            namaLower.includes('saldo') ||
            namaLower.includes('jumlah') ||
            namaLower.includes('penagihan') ||
            namaLower.includes('data iuran') ||
            namaLower === 'nama warga' ||
            namaLower === 'nama'
          ) {
            return;
          }

          // Skip empty rows
          if (!nama || nama === '-' || namaLower === '') return;

          // Skip if No is not a valid number
          if (!noTrimmed || isNaN(parseInt(noTrimmed))) return;

          const payments = {};
          MONTHS.forEach((month) => {
            // Try to find the month column (case-insensitive, handle trailing spaces)
            const monthLower = month.toLowerCase().trim();
            const monthKey = Object.keys(row).find((k) => {
              const keyLower = k.toLowerCase().trim();
              return (
                keyLower === monthLower ||
                keyLower.startsWith(monthLower.substring(0, 3))
              );
            });
            const value = monthKey ? row[monthKey] : '';
            // Remove all non-numeric characters (handles "10,000" format)
            const numValue =
              parseInt(String(value).replace(/[^0-9]/g, '')) || 0;
            payments[month] = numValue;
            totalPerBulan[month] += numValue;
          });

          processedResidents.push({
            no: no || index + 1,
            nama: nama.trim(),
            payments,
          });
        });

        console.log(
          'Processed residents:',
          processedResidents.length,
          processedResidents.slice(0, 2),
        );

        // Calculate totalPemasukan from payments if not found in summary
        const calculatedPemasukan = Object.values(totalPerBulan).reduce(
          (a, b) => a + b,
          0,
        );

        // Use values from spreadsheet if available, otherwise use calculated
        const finalTotalPemasukan = totalUangMasuk || calculatedPemasukan;
        const finalTotalPengeluaran = totalUangKeluar;
        const finalSisaSaldo =
          sisaSaldo !== undefined
            ? sisaSaldo
            : finalTotalPemasukan - finalTotalPengeluaran;

        console.log('Final Summary:', {
          finalTotalPemasukan,
          finalTotalPengeluaran,
          finalSisaSaldo,
        });

        setResidents(processedResidents);
        setSummary({
          totalPerBulan,
          totalPengeluaran: finalTotalPengeluaran,
          totalPemasukan: finalTotalPemasukan,
          sisaSaldo: finalSisaSaldo,
        });
        setLoading(false);
        setTimeout(() => setIsLoaded(true), 100);
      } catch (err) {
        console.log('Menggunakan data demo karena:', err.message);
        loadDemoData();
      }
    };

    fetchData();
  }, []);

  // Filter warga berdasarkan pencarian
  const filteredResidents = residents.filter((resident) =>
    resident.nama.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Hitung statistik
  const calculateStats = () => {
    let totalLunas = 0;
    let totalBelumLunas = 0;
    let totalPemasukan = 0;

    residents.forEach((resident) => {
      MONTHS.forEach((month) => {
        if (resident.payments[month] > 0) {
          totalLunas++;
          totalPemasukan += resident.payments[month];
        } else {
          totalBelumLunas++;
        }
      });
    });

    const totalTransaksi = totalLunas + totalBelumLunas;
    const persentaseLunas =
      totalTransaksi > 0 ? (totalLunas / totalTransaksi) * 100 : 0;

    return { totalPemasukan, totalLunas, totalBelumLunas, persentaseLunas };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className='loading-container'>
        <div className='loading-spinner'></div>
        <p>Memuat data iuran sampah...</p>
      </div>
    );
  }

  return (
    <div className={`app ${isLoaded ? 'loaded' : ''}`}>
      {/* Header */}
      <header className='header'>
        <div className='header-content'>
          <div className='header-icon'>🗑️</div>
          <div className='header-text'>
            <h1>Data Iuran Uang Sampah</h1>
            <p className='subtitle'>Warga KP Ciletuh RT 05/01 - Tahun 2026</p>
          </div>
          <div className='header-icon'>♻️</div>
        </div>
      </header>

      <main className='main-content'>
        {/* Statistik Dashboard */}
        <section className='stats-section'>
          <div className='stats-grid'>
            <div
              className='stat-card stat-card-1'
              style={{ animationDelay: '0.1s' }}
            >
              <div className='stat-icon'>💰</div>
              <div className='stat-info'>
                <span className='stat-label'>Total Pemasukan</span>
                <span className='stat-value'>
                  {formatCurrency(stats.totalPemasukan)}
                </span>
              </div>
            </div>

            <div
              className='stat-card stat-card-2'
              style={{ animationDelay: '0.2s' }}
            >
              <div className='stat-icon'>✅</div>
              <div className='stat-info'>
                <span className='stat-label'>Pembayaran Lunas</span>
                <span className='stat-value'>
                  {stats.totalLunas} <small>transaksi</small>
                </span>
              </div>
            </div>

            <div
              className='stat-card stat-card-3'
              style={{ animationDelay: '0.3s' }}
            >
              <div className='stat-icon'>⏳</div>
              <div className='stat-info'>
                <span className='stat-label'>Belum Lunas</span>
                <span className='stat-value'>
                  {stats.totalBelumLunas} <small>transaksi</small>
                </span>
              </div>
            </div>

            <div
              className='stat-card stat-card-4'
              style={{ animationDelay: '0.4s' }}
            >
              <div className='stat-icon'>📊</div>
              <div className='stat-info'>
                <span className='stat-label'>Persentase Lunas</span>
                <span className='stat-value'>
                  {stats.persentaseLunas.toFixed(1)}%
                </span>
                <div className='progress-bar'>
                  <div
                    className='progress-fill'
                    style={{ width: `${stats.persentaseLunas}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Box */}
        <section className='search-section'>
          <div className='search-container'>
            <span className='search-icon'>🔍</span>
            <input
              type='text'
              className='search-input'
              placeholder='Cari nama warga...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className='search-clear'
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
          <span className='search-result'>
            Menampilkan {filteredResidents.length} dari {residents.length} warga
          </span>
        </section>

        {/* Tabel Pembayaran */}
        <section className='table-section'>
          <div className='table-container'>
            <table className='payment-table'>
              <thead>
                <tr>
                  <th className='sticky-col col-no'>No</th>
                  <th className='sticky-col col-nama'>Nama Warga</th>
                  {MONTHS.map((month) => (
                    <th key={month} className='col-month'>
                      <span className='month-full'>{month}</span>
                      <span className='month-short'>
                        {month.substring(0, 3)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredResidents.map((resident, index) => (
                  <tr
                    key={resident.no}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <td className='sticky-col col-no'>{resident.no}</td>
                    <td className='sticky-col col-nama'>{resident.nama}</td>
                    {MONTHS.map((month) => {
                      const isPaid = resident.payments[month] > 0;
                      return (
                        <td
                          key={month}
                          className={`col-payment ${isPaid ? 'paid' : 'unpaid'}`}
                        >
                          {isPaid ? (
                            <span className='payment-badge paid'>
                              <span className='payment-icon'>✓</span>
                              <span className='payment-amount'>
                                {formatCurrency(resident.payments[month])}
                              </span>
                            </span>
                          ) : (
                            <span className='payment-badge unpaid'>-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ringkasan Keuangan */}
        <section className='summary-section'>
          <h2 className='section-title'>📋 Ringkasan Keuangan</h2>
          <div className='summary-grid'>
            <div className='summary-card'>
              <h3>Total Per Bulan</h3>
              <div className='monthly-summary'>
                {MONTHS.map((month) => (
                  <div key={month} className='monthly-item'>
                    <span className='month-name'>{month}</span>
                    <span className='month-total'>
                      {formatCurrency(summary.totalPerBulan[month] || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='summary-card highlight'>
              <div className='summary-item'>
                <span className='summary-label'>💵 Total Pemasukan</span>
                <span className='summary-value big'>
                  {formatCurrency(summary.totalPemasukan || 0)}
                </span>
              </div>
              <div className='summary-item'>
                <span className='summary-label'>� Total Pengeluaran</span>
                <span className='summary-value negative'>
                  - {formatCurrency(summary.totalPengeluaran || 0)}
                </span>
              </div>
              <hr className='summary-divider' />
              <div className='summary-item'>
                <span className='summary-label'>🏦 Sisa Saldo</span>
                <span className='summary-value total'>
                  {formatCurrency(
                    summary.sisaSaldo !== undefined
                      ? summary.sisaSaldo
                      : (summary.totalPemasukan || 0) -
                          (summary.totalPengeluaran || 0),
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='footer'>
        <p>🗑️ Sistem Iuran Uang Sampah - KP Ciletuh RT 05/01</p>
        <p className='footer-sub'>
          Data diperbarui secara berkala dari Google Sheets
        </p>
      </footer>
    </div>
  );
}

export default App;
