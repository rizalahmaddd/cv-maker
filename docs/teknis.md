# Dokumentasi Teknis

Dokumentasi arsitektur, penyimpanan data, mesin PDF, ekspor/impor, dan panduan pengembangan **CV Maker**.

---

## 1. Arsitektur Client-Side

Seluruh aplikasi berjalan di browser. Tidak ada backend, akun, atau database server; Cloudflare Workers hanya menyajikan file statis.

```
                 ┌───────────────────────────────────────────────┐
                 │        UI (React 18 + React Router)           │
                 │  pages/ · editor/ · components/               │
                 └────┬───────────────┬───────────────┬──────────┘
                      │               │               │
        ┌─────────────▼─────┐ ┌───────▼────────┐ ┌────▼──────────────────┐
        │  Data (Dexie)     │ │  Mesin PDF     │ │  Ekspor               │
        │  cvs, letters,    │ │  @react-pdf,   │ │  PDF · DOCX · PNG/JPG │
        │  assets, templates│ │  11 layout     │ │  TXT · MD · JSON · ZIP│
        │  applications     │ │                │ │                       │
        └─────────┬─────────┘ └───────┬────────┘ └────┬──────────────────┘
                  │                   │               │
        ┌─────────▼─────────┐ ┌───────▼────────┐ ┌────▼──────────────────┐
        │ Impor             │ │ Pratinjau      │ │ Cek CV                │
        │ PDF/LinkedIn,     │ │ PDF.js canvas, │ │ aturan + kata kunci   │
        │ teks, JSON Resume │ │ thumbnail      │ │ lowongan              │
        └───────────────────┘ └────────────────┘ └───────────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │ Service Worker (Workbox / PWA)  │
                    └─────────────────────────────────┘
```

---

## 2. Peta Modul & Struktur Kode

| Modul | Lokasi | Fungsi |
|---|---|---|
| **Entry & Shell** | `src/main.tsx`, `src/App.tsx`, `src/components/layout.tsx` | Routing, sidebar desktop, tab bar mobile (disembunyikan di editor), tema, service worker. |
| **Halaman** | `src/pages/` | Daftar CV, buat CV, editor, lihat & unduh, impor, template & editor template, surat lamaran, pelacak lamaran, pengaturan. |
| **Editor** | `src/editor/` | Form data diri, pengaturan CV, form tiap bagian, editor poin, input tanggal/level, daftar yang bisa diseret, bank kalimat. |
| **Data** | `src/db.ts`, `src/types.ts` | Skema Dexie, buat/duplikat/simpan CV dengan cek revisi, aset foto, normalisasi data lama. |
| **Template** | `src/templates.ts` | Daftar layout, font, palet, 30 preset bawaan, `normalizeTemplate`, tingkat ATS. |
| **Mesin PDF** | `src/pdf/` | `context.ts` (konteks render), `parts.tsx` (komponen bersama), `layouts/` (11 layout), `document.tsx` (CV + muat 1 halaman), `letter.tsx` (surat), `fonts.ts`. |
| **Ekspor** | `src/export/` | DOCX CV & surat, gambar, teks/Markdown, JSON Resume, ZIP. |
| **Impor** | `src/import/` | Ekstraksi teks PDF (termasuk dua kolom LinkedIn) dan parser teks CV. |
| **Pemeriksa** | `src/check/` | Aturan Cek CV dan pencocokan kata kunci lowongan. |
| **Preset** | `src/presets/` | Definisi bagian, negara tujuan, keperluan, data pribadi & pendidikan, template surat, bank kalimat, contoh CV. |
| **Utilitas** | `src/lib/` | Tanggal, teks, kontak, label dokumen, `buildView`, nama file, backup, surat, deteksi browser. |

---

## 3. Data & Penyimpanan

Data disimpan di IndexedDB lewat Dexie (`cv-maker`).

| Tabel | Kunci & indeks | Isi |
|---|---|---|
| `cvs` | `id, title, updatedAt, templateId, country, archived` | CV lengkap: data diri, bagian & isian, opsi, revisi. |
| `letters` | `id, cvId, updatedAt` | Surat lamaran yang terhubung ke CV. |
| `assets` | `id, kind, createdAt` | Foto dan tanda tangan (data URL). Kunci = SHA-1 isi, jadi foto yang sama hanya disimpan sekali. |
| `templates` | `id, name, updatedAt` | Template buatan pengguna (bawaan ada di kode). |
| `applications` | `id, company, status, appliedAt, cvId, updatedAt` | Pelacak lamaran. |
| `settings` | `id` | Satu baris `app`: tema, bawaan negara/bahasa, pola nama file, pesan bagikan, waktu backup. |

- **Satu bentuk isian**: Semua bagian memakai `Entry` yang sama (`title`, `subtitle`, `location`, `range`, `details`, `extra`, `link`, `level`, plus `degree/score/scoreMax` untuk pendidikan). `SECTION_DEFS` menentukan arti tiap kolom per jenis bagian.
- **Kode, bukan teks**: Jenis kelamin, agama, status pernikahan, jenis pekerjaan, dan jenjang pendidikan disimpan sebagai kode (`female`, `S1`, `fulltime`) dan diterjemahkan sesuai bahasa CV di `buildView`. Teks bebas dari versi lama dipetakan otomatis (`Perempuan` → `female`, `S1 Manajemen` + `IPK 3,68 / 4,00` → jenjang, jurusan, nilai).
- **Autosave & bentrok tab**: Editor menyimpan 400 ms setelah perubahan dan saat halaman disembunyikan/ditutup. Setiap simpan menaikkan `rev`; `saveCv` menolak bila revisi di database sudah berubah, lalu `BroadcastChannel` memberi tahu tab lain sehingga muncul pilihan "Muat versi lain" atau "Pakai versi ini".
- **Urungkan/ulangi**: Riwayat di memori (maks. 80 langkah); ketikan di kolom yang sama dalam 1 detik digabung jadi satu langkah.
- **Backup**: Ekspor semua tabel ke JSON. Mode *gabung* memilih record yang terakhir diubah dan menaikkan revisi CV yang ditimpa; mode *ganti* menimpa semua. Backup dari versi aplikasi yang lebih baru ditolak.
- **Penyimpanan permanen**: `navigator.storage.persist()` diminta saat aplikasi dibuka; pengingat backup muncul bila belum backup 14 hari.

---

## 4. Mesin PDF & Template

- PDF dibuat di browser dengan `@react-pdf/renderer` dan ditampilkan dengan PDF.js.
- `buildView` (`src/lib/view.ts`) menyiapkan isi yang benar-benar tampil: nama dengan gelar, kontak, data pribadi sesuai centang, bagian yang terlihat dan tidak kosong, judul bagian per bahasa, dan format tanggal. Semua format ekspor memakai fungsi yang sama.
- `buildCtx` (`src/pdf/context.ts`) menambah ukuran huruf, spasi, margin, kertas, warna, dan font untuk layout.
- **Pemenggalan halaman**: Judul bagian digabung dengan isian pertama dalam blok yang tidak terpotong, sehingga judul tidak tertinggal sendirian di bawah halaman (`minPresenceAhead` react-pdf tidak cukup andal). Isian pendek tidak dipotong; isian dengan lebih dari 8 poin boleh terpotong.
- **Muat 1 halaman**: Render ulang dengan skala huruf dan kepadatan lebih kecil (maks. 4 langkah) sampai jumlah halaman 1. Jumlah halaman dihitung dari kamus `/Type /Page` di PDF tanpa PDF.js.
- **Font**: 15 font Fontsource didaftarkan dengan berat 400/600/700 dan italic. Helvetica dan Times diarahkan ke Arimo dan Tinos. Teks dibersihkan dari emoji dan karakter tak terlihat sebelum dirender.
- **Font Jepang**: `public/fonts/noto-sans-jp-*.woff` (Noto Sans JP statis, subset kana + kanji JIS level 1–2, ±1,6 MB per berat) hanya diunduh saat template Rirekisho dirender, tidak masuk precache. Dibuat ulang dengan `scripts/jp-font.py`. Teks CJK dipecah per karakter karena tidak memakai spasi.
- **ATS**: Tiap layout punya tingkat `safe/partial/unsafe`; gaya keahlian berupa titik/batang menurunkan tingkat ke `partial`. Halaman unduh menyediakan PDF versi ATS (layout Klasik tanpa foto).
- `normalizeTemplate` melengkapi template lama dengan opsi baru.

| Layout | Kategori | ATS |
|---|---|---|
| Klasik, Garis Waktu, Modern, Europass | Siap ATS | aman |
| Formal, Daftar Riwayat Hidup, Rirekisho | Formal | cukup |
| Sidebar, Timeline | Modern | cukup |
| Kepala Warna | Kreatif | cukup |
| Kreatif | Kreatif | kurang |

---

## 5. Ekspor

| Format | Modul | Catatan |
|---|---|---|
| PDF | `pdf/document.tsx` | Teks asli, tautan aktif, metadata judul/penulis/kata kunci. |
| DOCX | `export/docx.ts` | Selalu satu kolom dengan heading dan bullet asli supaya bisa diedit dan terbaca ATS; font dipetakan ke Calibri/Cambria/Consolas. Judul bagian memakai teks berwarna + garis bawah, bukan shading, karena shading tidak tampil di sebagian penampil. |
| PNG/JPG | `export/image.ts` | PDF.js 2,5× (±1490 px lebar A4), per halaman atau disambung. |
| TXT / Markdown | `export/text.ts` | Untuk ditempel ke formulir portal lowongan. |
| JSON Resume | `export/jsonresume.ts` | Skema jsonresume.org + salinan data asli di `x-cvmaker` untuk impor ulang tanpa kehilangan data. |
| ZIP | `export/zip.ts` | PDF, DOCX, TXT, PDF ATS (bila template tidak siap ATS), dan foto; tanpa kompresi supaya cepat di HP. |

Nama file mengikuti pola di Pengaturan (`CV_{nama}_{posisi}`), dibersihkan dari karakter yang dilarang sistem file.

---

## 6. Impor

- `import/pdftext.ts` mengelompokkan item teks PDF.js per baris berdasarkan posisi Y, memisah dua kolom bila jarak horizontal lebar (kecuali bagian kanannya tanggal), dan membuang footer "Halaman x dari y". PDF profil LinkedIn dikenali lalu kolom utama dibaca sebelum sidebar. PDF tanpa teks (hasil scan) ditolak dengan pesan jelas.
- `import/parse.ts` mencari judul bagian (ID & EN), kontak (email, nomor HP, tautan), dan rentang tanggal (`Jan 2021 – Sekarang`, `03/2019 - 12/2020`, `2016 - 2019`). Isian dipecah berdasarkan baris tanggal: dua baris pendek di atasnya menjadi judul & organisasi, atau judul di baris yang sama dengan tanggal dan organisasi di baris berikutnya. Jenjang & IPK, grup keahlian (`Hard skill: …`), level bahasa, skor tes, dan penerbit sertifikat dikenali.
- Hasil selalu ditampilkan di layar tinjauan sebelum CV dibuat.

---

## 7. Cek CV & Kata Kunci

- `check/rules.ts` mengembalikan daftar masalah bertingkat (`error`, `warn`, `tip`) dengan tautan ke bagian yang perlu diperbaiki, plus skor sederhana.
- Aturan mencakup kontak, format email/HP (kode negara untuk luar negeri), tautan, tanggal terbalik/masa depan, isian ganda, poin tanpa angka atau terlalu panjang, kata "I/my" di CV Inggris, campuran bahasa, emoji & karakter yang tidak didukung font, NIK 16 digit, teks contoh `[…]` yang belum diganti, jumlah halaman, aturan foto & data pribadi per negara, dan tingkat ATS template.
- `check/keywords.ts` menghitung frekuensi kata di teks lowongan (dengan daftar stopword ID/EN dan frasa keahlian umum) lalu mencocokkannya dengan teks CV.

---

## 8. Surat Lamaran

- Isi surat menyimpan kode `{posisi}`, `{perusahaan}`, `{sumber}`, `{pendidikan}`, `{keahlian}`, `{jabatan}` yang diisi saat render, jadi perubahan data tetap ikut. Baris `[lampiran]` menandai letak daftar berkas.
- Format Indonesia: Perihal, Lampiran (jumlah berkas), tanggal, Kepada Yth. … di tempat. Format Inggris: tanggal, penerima, `Re:`.
- Kepala surat mengikuti font dan warna template CV yang terhubung. Tanda tangan diproses dengan menghapus piksel latar putih.

---

## 9. Cache & PWA

- `vite-plugin-pwa` mode `generateSW` + `autoUpdate`; shell, font, dan worker PDF.js di-precache (batas 8 MB per file). Font Jepang memakai runtime cache `CacheFirst`.
- Pembaruan dicek setiap jam dan saat aplikasi kembali dari background.
- **Thumbnail** dirender satu per satu, hanya saat mendekati layar, dan disimpan di localStorage dengan kunci `virtual:render-version` (hash semua kode yang memengaruhi tampilan PDF).
- Browser dalam aplikasi (Instagram, TikTok, Facebook, LINE) dideteksi untuk menampilkan petunjuk membuka di Chrome/Safari. Banner pasang aplikasi muncul di Android/desktop (`beforeinstallprompt`) dan iPhone (petunjuk manual).
- Tombol kembali di HP menutup sheet terlebih dahulu (setiap sheet terbuka memiliki satu entri riwayat).

---

## 10. Build & Deploy

### Kebutuhan lingkungan
- Node.js 22 atau lebih baru
- NPM

### Perintah

```bash
npm install
npm run dev        # dev server http://localhost:5173
npm run typecheck  # cek tipe TypeScript
npm test           # unit test (Vitest)
npm run build      # type-check lalu build ke dist/
npm run preview    # pratinjau hasil build
npm run deploy     # build + deploy ke Cloudflare Workers
npm run icons      # buat ulang ikon PWA dari favicon.svg (butuh ImageMagick)
```

### Cloudflare Workers

```bash
npx wrangler login
npm run deploy
```

- `wrangler.jsonc` menyajikan `dist/` sebagai static assets dengan fallback SPA dan mengikat custom domain `cv.solusikoding.com`.

---

## 11. Lisensi Font

Semua font memakai **SIL Open Font License 1.1**.

| Font | Jenis |
|---|---|
| Plus Jakarta Sans, Inter, IBM Plex Sans, Space Grotesk, Poppins, Montserrat, Outfit | Sans |
| Arimo (pengganti Helvetica) | Sans |
| Lora, Playfair Display, Fraunces, DM Serif Display | Serif |
| Tinos (pengganti Times) | Serif |
| JetBrains Mono, Space Mono | Monospace |
| Noto Sans JP (subset, untuk Rirekisho) | Sans Jepang |
