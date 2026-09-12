# monetasens

**Your money, in perspective.** Aplikasi finansial dan trading companion berbasis **React + TypeScript + Vite**, dengan antarmuka mobile-first dan dukungan **Progressive Web App (PWA)**.

## Menjalankan aplikasi

Gunakan Node.js 22.12+ atau Node.js 24 LTS.

```bash
npm install
npm run dev
```

Buka **http://localhost:5173**. Development server juga dapat diakses dari perangkat dalam jaringan yang sama melalui alamat IP komputer.

### Build produksi & preview PWA

```bash
npm run build
npm run preview
```

Buka **http://localhost:4173**. Hasil build berada di `dist/`, siap diunggah ke static hosting seperti Vercel, Netlify, atau Cloudflare Pages. Aplikasi dikonfigurasi untuk deployment di root domain.

Service worker aktif pada build produksi. Untuk instalasi PWA dan offline caching, gunakan **HTTPS** atau **localhost**. Setelah kunjungan awal dan proses caching selesai, halaman, font, ikon, grafik, serta data lokal tersedia offline. Tombol instalasi tersedia di sidebar desktop dan **Profile → Install app** pada mobile. Safari iOS menggunakan **Share → Add to Home Screen**.

## Dasar implementasi

`PRD.txt` pada workspace kosong saat implementasi. Cakupan aplikasi disusun berdasarkan `stitch_trading_terminal_pwa_layout/design.md` dan lima referensi layar HTML yang tersedia. Identitas visual mengikuti latar krem `#EBE9E1`, kartu charcoal `#191919`, aksen coral `#FF4D4D`, font Plus Jakarta Sans, kartu membulat, dan floating navigation pada mobile.

Implementasi saat ini adalah **aplikasi demo interaktif dengan penyimpanan lokal**, bukan koneksi broker atau data pasar real-time. Snapshot awal menggunakan September 2026. Angka performa, alokasi target, health score, margin, indikator, kalender ekonomi, dan grafik ditandai sebagai data ilustrasi. Penambahan transaksi serta realisasi P&L memperbarui saldo akun demo.

## Fitur

| Halaman | Fungsionalitas |
| --- | --- |
| **Overview** | Saldo portofolio, sembunyikan saldo, grafik dengan enam periode dan tooltip, watchlist, aktivitas terkini, portfolio health, serta pintasan deposit/withdrawal. |
| **Markets** | Pilihan empat instrumen, pencarian aset, candlestick demo dengan enam timeframe, toggle demand zone, kalkulator risiko dan risk/reward, pembuatan sinyal. |
| **Portfolio** | Ekuitas dan kas, daftar posisi, konfirmasi penutupan posisi demo, pencatatan realized P&L ke jurnal. |
| **Trading journal** | Navigasi bulan, kalender profit/loss, filter per tanggal/jenis transaksi, statistik yang dihitung dari transaksi bulan terpilih, refleksi tersimpan, ekspor CSV. |
| **Macro intelligence** | Contoh sesi pasar, kalender ekonomi dengan filter dampak, detail forecast/previous, ringkasan sentimen. |
| **Signal studio** | Setup Buy/Sell, validasi entry/stop loss/target, risk/reward, preview pesan, riwayat sinyal lokal, copy teks dan berbagi melalui Telegram. |

Fitur tambahan: pencarian halaman/aset, pengaturan nama profil, notifikasi onboarding, validasi saldo saat withdrawal, status offline, navigasi berbasis hash, dan dialog yang mendukung keyboard/focus management.

**Telegram:** tombol berbagi membuka pemilih penerima Telegram. Tidak ada pengiriman bot otomatis; integrasi broker, autentikasi, sinkronisasi cloud, feed harga, dan Telegram Bot API memerlukan backend tersendiri.

## Struktur folder

```text
monetasense/
├── public/
│   ├── favicon.svg
│   └── icons/                  # Ikon PWA, maskable, dan Apple touch
├── scripts/
│   └── generate-icons.mjs      # Generator ikon PNG dari artwork SVG
├── src/
│   ├── app/
│   │   └── App.tsx            # Shell, navigasi, state akun, dialog global
│   ├── components/
│   │   ├── charts/            # Grafik ekuitas dan sparkline
│   │   ├── layout/            # Brand, sidebar, floating mobile navigation
│   │   ├── transactions/      # Form dan daftar transaksi
│   │   └── ui/                # Dialog dan UI primitives
│   ├── data/
│   │   └── demo.ts            # Snapshot demo terpusat
│   ├── hooks/
│   │   └── useLocalStorage.ts # Persistensi lokal dengan fallback sesi
│   ├── lib/                   # Format mata uang, tanggal, validasi risiko
│   ├── pages/                 # Enam halaman aplikasi
│   ├── styles/                # Design tokens, komponen, responsive layouts
│   ├── types/                 # Tipe domain bersama
│   └── main.tsx               # Entry point dan registrasi service worker
├── tests/e2e/                 # Uji alur pengguna dan offline PWA
├── index.html
├── playwright.config.ts
├── vite.config.ts             # React, bundling, manifest, precache PWA
└── package.json
```

Referensi desain dan PRD asli tetap tersedia di workspace.

## Penyimpanan data

- Transaksi dan posisi disimpan bersama di `monetasens.ledger.v1`, sehingga penutupan posisi memperbarui ledger dalam satu operasi.
- Nama, sinyal, status notifikasi, serta refleksi jurnal menggunakan key `monetasens.*` masing-masing.
- Data tersimpan pada browser/perangkat yang sama dan bertahan setelah refresh.
- Jika localStorage tidak dapat ditulis, aplikasi menampilkan informasi bahwa perubahan hanya bertahan selama sesi.
- Menghapus site data pada browser mengembalikan aplikasi ke snapshot demo awal.
- Deposit dan withdrawal hanya mencatat transaksi simulasi; tidak memindahkan uang sungguhan.

## Pemeriksaan

```bash
npm run typecheck       # TypeScript strict
npm test                # Unit test kalkulasi risk/reward dan format
npm run build           # Build + manifest + service worker
npx playwright install chromium
npm run test:e2e        # Alur desktop/mobile, persistensi, ekspor, offline
```

Uji end-to-end memakai build terbaru pada port 4173. Screenshot hasil pengujian tersedia di `test-results/` dan tidak dimasukkan ke Git.

```bash
npm run icons           # Regenerasi ikon
npm run format          # Format source code
```

## Pengembangan selanjutnya

Setelah PRD diisi, domain types di `src/types/`, snapshot di `src/data/`, serta operasi akun pada `src/app/App.tsx` dapat dijadikan titik integrasi API. Harga demo perlu diganti feed pasar; pengiriman Telegram otomatis harus dilakukan server-side agar token bot tidak berada di bundle frontend.
