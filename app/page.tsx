'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://jojostore-production.up.railway.app/api';

export default function Dashboard() {
  const [saldo, setSaldo] = useState(0);
  const [qrisBalance, setQrisBalance] = useState(0);
  const [mutasi, setMutasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [qrisAmount, setQrisAmount] = useState('');
  const [qrisBase64, setQrisBase64] = useState('');

  const [wallet, setWallet] = useState('DANA');
  const [phone, setPhone] = useState('');
  const [nominalOrder, setNominalOrder] = useState('');
  
  const [wdAmount, setWdAmount] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resSaldo, resMutasi] = await Promise.all([
        axios.get(`${API_URL}/saldo`),
        axios.get(`${API_URL}/mutasi`)
      ]);
      
      if (resSaldo.data.success) {
        setSaldo(resSaldo.data.balance);
        setQrisBalance(resSaldo.data.qris_balance);
      }
      if (resMutasi.data.success) {
        setMutasi(resMutasi.data.data || []);
      }
    } catch (error) {
      alert("Gagal mengambil data dari server Railway.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleGenerateQris = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.get(`${API_URL}/qris?amount=${qrisAmount}`);
      if (res.data.success) {
        setQrisBase64(res.data.qris_base64);
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      alert("Gagal generate QRIS");
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = wallet === 'BBSD' ? '/topup' : '/order';
      const res = await axios.post(`${API_URL}${endpoint}`, {
        wallet, phone, nominal: nominalOrder
      });
      
      if (res.data.success) {
        alert(`Order Berhasil! ID Trx: ${res.data.idTrx}`);
        fetchDashboardData();
      } else {
        alert(`Gagal: ${res.data.message}`);
      }
    } catch (error) {
      alert("Gagal memproses transaksi");
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/withdraw`, { amount: wdAmount });
      if (res.data.success) {
        alert(res.data.message);
        fetchDashboardData();
        setWdAmount('');
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      alert("Gagal memproses penarikan");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Payment Gateway</h1>
            <p className="text-gray-500 text-sm">Powered by Orderkuota API (Railway Backend)</p>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-500 font-semibold uppercase">Saldo Utama</p>
              <p className="text-2xl font-bold text-blue-700">Rp {saldo.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <p className="text-xs text-green-500 font-semibold uppercase">Saldo QRIS</p>
              <p className="text-2xl font-bold text-green-700">Rp {qrisBalance.toLocaleString('id-ID')}</p>
            </div>
            <button 
              onClick={fetchDashboardData} 
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm font-semibold transition self-stretch md:self-auto"
            >
              {loading ? 'Memuat...' : '🔄 Refresh'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-4">Buat QRIS</h2>
            <form onSubmit={handleGenerateQris} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nominal (Rp)</label>
                <input 
                  type="number" 
                  value={qrisAmount} 
                  onChange={(e) => setQrisAmount(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: 15000" required
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition">
                Generate QRIS
              </button>
            </form>
            
            {qrisBase64 && (
              <div className="mt-6 text-center">
                <p className="text-sm font-semibold mb-2">Scan QRIS Berikut:</p>
                <img src={`data:image/png;base64,${qrisBase64}`} alt="QRIS" className="mx-auto w-48 h-48 border rounded-xl" />
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-4">Topup E-Wallet</h2>
            <form onSubmit={handleTopup} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Pilih Produk</label>
                <select 
                  value={wallet} 
                  onChange={(e) => setWallet(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="DANA">DANA</option>
                  <option value="OVO">OVO</option>
                  <option value="GOPAY">GOPAY</option>
                  <option value="SHOPEEPAY">SHOPEEPAY</option>
                  <option value="BBSD">DANA (Bebas Nominal BBSD)</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nomor HP</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="08123456789" required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nominal / Kode Pelanggan</label>
                <input 
                  type="text" 
                  value={nominalOrder} 
                  onChange={(e) => setNominalOrder(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Jika BBSD masukkan nominal" required
                />
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold transition">
                Proses Order
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-4">Pindahkan Saldo QRIS</h2>
            <p className="text-sm text-gray-500 mb-4">Pindahkan saldo dari QRIS ke Saldo Utama (Min. Rp 1.000)</p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nominal Withdraw (Rp)</label>
                <input 
                  type="number" 
                  value={wdAmount} 
                  onChange={(e) => setWdAmount(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: 50000" required
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold transition">
                Tarik Saldo
              </button>
            </form>
          </div>

        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold mb-4">Riwayat Mutasi QRIS</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-sm">
                  <th className="p-3 font-semibold text-gray-600">Tanggal</th>
                  <th className="p-3 font-semibold text-gray-600">Keterangan</th>
                  <th className="p-3 font-semibold text-gray-600">Nominal</th>
                  <th className="p-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {mutasi.length > 0 ? (
                  mutasi.map((item: any, index: number) => (
                    <tr key={index} className="border-b text-sm hover:bg-gray-50">
                      <td className="p-3">{item.created_at || '-'}</td>
                      <td className="p-3 text-gray-600">{item.keterangan || '-'}</td>
                      <td className="p-3 font-semibold text-green-600">
                        + Rp {item.kredit_clean?.toLocaleString('id-ID') || '0'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {item.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">Belum ada data mutasi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}