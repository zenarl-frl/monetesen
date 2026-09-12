# **DESIGN.md — Financial & Portfolio Mobile App Design System**

## **1\. Overview & Visual Identity**

Aplikasi ini mengusung estetika **Modern Minimalist & Neumorphic-lite / Card-based UI**. Fokus utama dari desain ini adalah kejelasan visual data keuangan, penggunaan ruang *padding* yang lega, serta kontras tinggi antara elemen latar belakang bernuansa krem lembut (*light mode background*) dengan kartu bernuansa *dark mode* dan aksen merah menyala.

## **2\. Color Palette**

### **Base Colors**

* **Primary Background:** \#EBE9E1 *(Warm Light Gray / Cream)*  
* **Surface / Dark Card:** \#191919 *(Rich Dark Charcoal)*  
* **Card Neutral / Secondary:** \#B5B3AC *(Muted Gray/Taupe)*

### **Accent Colors**

* **Primary Accent / Highlight:** \#FF4D4D *(Coral Red)* — Digunakan untuk penanda nilai/node grafik, badge aktif, serta kartu highlight utama.  
* **Text Primary:** \#0F0F0F *(Near Black)*  
* **Text Secondary:** \#7E7E7A *(Muted Dark Gray)*  
* **Text Light (On Dark Surfaces):** \#FFFFFF *(Pure White)*

## **3\. Typography**

* **Font Family:** *Inter*, *SF Pro Display*, atau *Plus Jakarta Sans* (SANS-SERIF Modern).  
* **Hierarchy:**  
  * **Header Greeting:** Font-size: 20px, Weight: Bold / Semi-bold (misal: *Welcome, John\!*)  
  * **Main Balance / Large Numbers:** Font-size: 32px, Weight: Bold (misal: *$ 13,553.00*)  
  * **Section Titles:** Font-size: 16px, Weight: Semi-bold (misal: *Transactions history*, *Token Bonus*)  
  * **Card Labels / Subtitles:** Font-size: 12px \- 14px, Weight: Regular / Medium (misal: *Payment*, *Deposit*, *Balance*)  
  * **Micro Text / Badges:** Font-size: 10px \- 11px, Weight: Bold

## **4\. UI Components & Layouts**

### **A. Top Bar / Navigation Header**

* **Greeting & Profile Alert:** Menampilkan teks pemanggil nama pengguna di kiri atas serta ikon lonceng notifikasi di kanan atas dengan *indicator dot* berwarna merah.  
* **Total Balance Display:** Angka saldo berukuran besar dengan label "Balance" di samping atau bawahnya.

### **B. Interactive Charts & Data Visualization**

* **Dark Mode Chart Card (Screen 1):**  
  * Background \#191919 dengan *border-radius: 24px*.  
  * Line chart halus (*smooth curve line*) berwarna putih.  
  * Node/Data point beraksen merah dengan *tooltip* merah melayang (misal: $409).  
  * Filter rentang waktu (*1D, 1W, 1M, 3M, 6M, 1Y*) berbentuk pill button di bagian bawah kartu.  
* **Full-Width Embedded Chart (Screen 2):**  
  * Tampilan grafik terintegrasi langsung dengan latar belakang utama.  
  * Filter tab kategori atas: *Main, Weekly, Monthly, Yearly* (Tab aktif berwarna merah \#FF4D4D).

### **C. Dashboard Cards & Grid Systems (Screen 3\)**

* **Metric Cards (Positions / Cash):**  
  * Kartu sejajar (*2-column grid*) dengan sudut tumpul (*rounded corners \~20px*).  
  * Latar belakang abu-abu sedang \#B5B3AC dengan petunjuk panah navigasi \>.  
* **Token / Bonus Grid Section:**  
  * **Left Column:** Kartu gelap vertikal memuat *Radial Progress Bar* (lingkaran progress merah \#FF4D4D) beserta indikator presentase (31%) dan total nilai token (8990TB).  
  * **Right Column:** Dua kartu bertumpuk (1 kartu merah menyala sebagai highlight utama, 1 kartu serba hitam untuk secondary data).

### **D. Horizontal Recipients List**

* Deretan avatar pengguna dalam bentuk lingkaran (*circular avatars*).  
* Menampilkan *online indicator dot* atau badge status di sudut avatar.  
* Avatar terakhir memuat angka *overflow* (misal: 3+) dengan latar hitam penuh.

### **E. Transaction History List**

* **Item Layout:**  
  * Left: Square Icon Container (hitam dengan sudut membulat) memuat ikon kategori vector (makanan, bank, wine, dll).  
  * Middle: Nama transaksi (bold) \+ Tipe transaksi (*Payment/Deposit* dalam warna subdued).  
  * Right: Amount (Pengeluaran \- $40.99 atau Pemasukan \+ $460.00).

### **F. Floating Bottom Navigation Bar**

* **Pill-shaped Navigation Shell:** Floating container berwarna hitam gelap di bagian bawah.  
* **Active Tab State:** Kapsul putih (*White Pill Button*) membungkus ikon & label aktif (misal: *Home*).  
* **Action Button (FAB):** Tombol aksi utama berbentuk lingkaran hitam terpisah di sebelah kanan dengan ikon \+.

## **5\. Spacing & Radius Rules**

* **Border Radius:**  
  * Cards & Containers: 20px \- 28px  
  * Buttons & Floating Nav: 999px (Fully Rounded / Pill shape)  
  * Icon Boxes: 12px \- 16px  
* **Padding:**  
  * Screen Padding Horizontal: 20px  
  * Card Padding: 16px \- 20px