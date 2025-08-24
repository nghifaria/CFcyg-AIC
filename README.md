# SmartWaste Challenge – Dashboard Pengelolaan Sampah RT

SmartWaste Challenge adalah aplikasi web sederhana untuk mengelola dan memantau sampah di tingkat RT melalui pelaporan harian, leaderboard, dan sistem challenge gamifikasi.

## Struktur proyek
- `frontend/` — static frontend (index.html) yang berkomunikasi ke backend
- `backend/` — Express.js API dengan SQLite + AI classification built-in

## Apa yang sudah dibuat
- **Backend Express + SQLite**: API endpoints lengkap dengan database SQLite
  - Endpoints: `/report`, `/leaderboard`, `/challenges`, `/approve-report`, `/classify`, `/rts`
- **Frontend Modern UI**: glassmorphism design, gradient backgrounds, card layouts, responsive
  - Dashboard: card-based sections, modern buttons dengan hover effects, animated tables
  - Form input sampah dengan validasi real-time
- **AI Classification**: rule-based classifier dengan eco score terintegrasi di backend
- **Gamifikasi**: sistem challenge dan leaderboard untuk mendorong partisipasi

## Cara menjalankan aplikasi
1. **Download/Clone project** ke komputer Anda
2. **Install dependencies dan jalankan backend**:
   ```bash
   cd backend
   npm install
   node index.js
   ```
   Backend akan berjalan di http://localhost:4000

3. **Buka terminal baru, jalankan frontend**:
   ```bash
   cd frontend  
   npx serve -s . -l 3000
   ```
   Frontend akan berjalan di http://localhost:3000

4. **Akses aplikasi**: 
   - Buka browser → http://localhost:3000/index.html
   - Backend API: http://localhost:4000

> **💡 Tips**: Pastikan kedua terminal tetap berjalan (backend di port 4000, frontend di port 3000)

## Persyaratan sistem
- Node.js (versi 14+ recommended)
- Browser modern (Chrome, Firefox, Edge)
- Terminal/Command Prompt

## Quick Start Guide 🚀
1. Download project ini
2. Buka 2 terminal/command prompt
3. **Terminal 1** (Backend):
   ```bash
   cd backend
   npm install
   node index.js
   ```
4. **Terminal 2** (Frontend):
   ```bash
   cd frontend
   npx serve -s . -l 3000
   ```
5. Buka browser → **http://localhost:3000/index.html**

### 🎯 Cara Super Mudah (Windows):
1. **Double-click** `start-backend.bat` 
2. **Double-click** `start-frontend.bat` (buka terminal baru)
3. Buka browser → **http://localhost:3000/index.html**

✅ **Done!** Aplikasi siap digunakan

## Fitur yang tersedia
- 📊 **Dashboard utama** dengan UI modern glassmorphism
- 📝 **Form lapor sampah** harian dengan 4 kategori (organik, plastik, elektronik, lainnya)
- 🏆 **Leaderboard** real-time untuk melihat ranking pengguna
- 🎯 **Challenge system** untuk gamifikasi dan motivasi
- 👨‍💼 **Panel pengurus** untuk approve/reject laporan
- 🤖 **AI classifier** otomatis untuk kategori sampah dan eco scoring

## Checklist fitur yang sudah selesai
- [x] Form input sampah harian — implemented dengan validasi data
- [x] Leaderboard antar pengguna — real-time dengan total points
- [x] Challenge system — gamifikasi untuk motivasi warga
- [x] AI klasifikasi & eco scoring — integrated ke backend Node.js
- [x] **Modern UI Design** — glassmorphism dengan gradient backgrounds
- [x] **Dashboard analytics** — monitoring dan statistik sampah
- [x] **Panel pengurus** — sistem approval untuk laporan

## Teknologi yang digunakan

**🎨 Frontend:**
- HTML5 + CSS3 dengan modern glassmorphism design
- Vanilla JavaScript untuk interaksi
- Responsive design untuk mobile dan desktop
- Gradient backgrounds dan smooth animations

**⚙️ Backend:**
- Node.js + Express.js sebagai web server
- SQLite database dengan better-sqlite3
- CORS support untuk cross-origin requests
- RESTful API endpoints

**�️ Database Structure:**
- `rts` - data RT/RW 
- `users` - data pengguna
- `reports` - laporan sampah harian
- `challenges` - data challenge gamifikasi

## Cara menggunakan aplikasi

1. **Buka dashboard** di http://localhost:3000/index.html
2. **Lapor sampah harian**: 
   - Isi form dengan jumlah sampah per kategori (kg)
   - Sistem akan otomatis classify dan beri eco score
   - Submit untuk simpan ke database
3. **Lihat leaderboard**: 
   - Ranking real-time berdasarkan total points
   - Monitor progress dan kompetisi antar pengguna
4. **Ikuti challenge**:
   - Complete challenge untuk dapat bonus points
   - Challenge otomatis refresh setiap periode
5. **Panel pengurus** (tersedia untuk semua user):
   - Load pending reports untuk review
   - Approve atau reject laporan yang masuk

## Next steps (pengembangan lanjutan)
- Tambah photo upload + AI image classification
- Implementasi notification system (email/WA)
- Add export data untuk laporan pemerintah
- Dashboard analytics yang lebih advanced
- Mobile app version (React Native/Flutter)

**Status: ✅ READY TO USE** 

Aplikasi SmartWaste sudah siap digunakan dengan UI modern dan fitur lengkap untuk pengelolaan sampah tingkat RT! 🚀
