'use client';

/**
 * Login Page Component - SIP-ANGGARAN v1.3.0
 * Next.js App Router Authentication & Budget Cycle Selection Page
 */

import React, { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState('Murni 2027');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const cycles = [
    { id: 'c-2027-murni', label: 'Murni 2027', type: 'murni', desc: 'Rancangan Awal RKPD & Pagu Indikatif 2027' },
    { id: 'c-2027-perubahan', label: 'Perubahan 2027', type: 'perubahan', desc: 'Penyesuaian Kapasitas Fiskal Kas & Alokasi Perubahan' },
    { id: 'c-2028-murni', label: 'Murni 2028', type: 'murni', desc: 'Perencanaan Kerangka Pendanaan Jangka Menengah 2028' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Harap isi username dan password.');
      return;
    }

    let role = 'OPD';
    let fullName = 'User';

    if (username === 'superuser') {
      role = 'SUPERUSER';
      fullName = 'Administrator Utama System';
    } else if (username === 'admin.tapd') {
      role = 'TAPD';
      fullName = 'Tim Anggaran Pemerintah Daerah (TAPD)';
    } else if (username === 'bappeda') {
      role = 'BAPPEDA';
      fullName = 'Tim Bappeda (Perencana Pengampu)';
    } else if (username.startsWith('opd.')) {
      role = 'OPD';
      fullName = username.toUpperCase().replace('OPD.', 'OPD ');
    } else {
      role = 'OPD';
      fullName = username;
    }

    setLoggedInUser({ username, role, fullName, cycle: selectedCycle });
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-xl shadow-indigo-900/50 border border-indigo-400/30">
              <i className="fas fa-user-shield text-3xl text-white"></i>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
            SIP<span className="text-indigo-400">-ANGGARAN</span>
          </h1>
          <p className="text-slate-400 text-xs font-medium">Portal Otentikasi Keamanan Akses Sidang Anggaran</p>
          <p className="text-slate-500 text-[10px] mt-0.5">Sistem Informasi Pembahasan Usulan Pagu, Hibah &amp; Bansos Daerah</p>
        </div>

        {!isLoggedIn ? (
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-7 shadow-2xl relative border border-slate-700/60">
            <div className="flex items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <i className="fas fa-lock text-amber-400 text-sm"></i>
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Otentikasi Pengguna</h2>
              </div>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded font-mono">v1.3.0 Next.js</span>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-rose-400 flex-shrink-0"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Pilih Siklus Anggaran</label>
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.label}>
                      {c.label} - {c.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <i className="fas fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 text-xs uppercase tracking-wider mt-5"
              >
                <i className="fas fa-sign-in-alt"></i> Masuk Sistem
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-7 shadow-2xl border border-emerald-700/60 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-950 text-emerald-400 border border-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2 className="text-lg font-bold text-white">Sesi Login Aktif</h2>
            <div className="bg-slate-950 p-4 rounded-xl text-xs space-y-1 font-mono text-slate-300 text-left">
              <p><strong className="text-slate-400">Nama Pengguna:</strong> {loggedInUser.fullName}</p>
              <p><strong className="text-slate-400">Username:</strong> {loggedInUser.username}</p>
              <p><strong className="text-slate-400">Peran Access (RBAC):</strong> <span className="text-indigo-400 font-bold">{loggedInUser.role}</span></p>
              <p><strong className="text-slate-400">Siklus Anggaran:</strong> <span className="text-amber-400 font-bold">{loggedInUser.cycle}</span></p>
            </div>
            <button
              type="button"
              onClick={() => setIsLoggedIn(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Keluar Sesi / Ganti Akun
            </button>
          </div>
        )}

        <p className="text-center text-[11px] text-slate-600 mt-4">
          SIP-ANGGARAN Security Subsystem &bull; Role-Based Access Control
        </p>
      </div>
    </div>
  );
}
