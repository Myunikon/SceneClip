Berdasarkan keputusan Anda untuk menggunakan **Deep Gray Theme** dengan pendekatan "Professional Utility", berikut adalah rincian perbedaan fundamental antara Light Mode dan Dark Mode dalam sistem desain baru ini.

Perbedaan ini dirancang agar mata pengguna merasa nyaman secara alami (ergonomis) di kedua kondisi cahaya, tanpa memaksakan "kesamaan visual" yang kaku.

### Ringkasan Perbedaan Utama

| Fitur Desain | Light Mode (Mode Terang) | Dark Mode (Mode Gelap) |
| --- | --- | --- |
| **Metafora Visual** | **Meja Kerja (Paper)** | **Kokpit Pesawat (Dashboard)** |
| **Strategi Kedalaman** | **Elevasi & Bayangan** (Timbul) | **Luminositas** (Tenggelam/Maju) |
| **Warna Dasar** | Putih & Abu-abu Netral (Sangat Terang) | Arang Gelap / Deep Charcoal (Matte) |
| **Input & Select** | **Background Putih** (Kotak di atas kertas) | **Background Lebih Gelap** (Lubang/Slot) |
| **Border** | Tajam, Abu-abu Netral (`slate-200`) | Halus, Menyatu (`white/10`) |
| **Shadow** | Soft Shadow untuk memisahkan lapisan | Hampir tidak ada / Glow sangat halus |
| **Vibe** | Bersih, Administratif, Jelas | Fokus, Teknis, Imersif |

---

### Analisis Mendalam

#### 1. Strategi Input: "Box" vs "Slot"

Ini adalah perbedaan paling mencolok yang kita diskusikan (Elevated vs Sunken).

* **Light Mode (The Box):**
Input terlihat seperti sebuah kotak putih yang diletakkan di atas kertas abu-abu muda. Batasnya ditentukan oleh **Border** (garis tepi).
* *Kenapa?* Di dunia nyata, kita menulis di atas kertas putih. Border membantu mata membedakan area tulis dari area non-tulis.


* **Dark Mode (The Slot):**
Input terlihat seperti lubang atau cekungan yang dipahat ke dalam permukaan metal. Warnanya lebih **gelap** daripada Card di sekitarnya.
* *Kenapa?* Di ruang gelap, objek yang lebih dekat ke cahaya (lebih tinggi) terlihat lebih terang. Area yang "dalam" (seperti lubang input) tidak terkena cahaya, jadi warnanya lebih gelap.


 Ini memberikan kesan lembut dan mengurangi ketegangan mata saat coding atau bekerja malam hari.

#### 2. Hirarki Visual (Cara Mata Membaca)

* **Light Mode:** Mengandalkan **Shadow**.
* Background (Paling Bawah) -> Card (Ada Shadow) -> Popover/Dropdown (Shadow Lebih Besar).


* **Dark Mode:** Mengandalkan **Kecerahan (Brightness)**.
* Background (Paling Gelap) -> Card (Agak Terang) -> Popover/Dropdown (Paling Terang).
* *Pengecualian:* Input field justru lebih gelap (ke dalam).

### Kesimpulan

Dengan memisahkan perlakuan ini, Anda mendapatkan **kemenangan ganda**:

1. **Light Mode** terlihat bersih dan profesional (tidak seperti "aplikasi yang rusak").
2. **Dark Mode** terlihat nyaman dan teknis (tidak menyilaukan mata dengan garis putih tebal).

Aplikasi Anda sekarang memiliki "Design Language" yang matang, setara dengan standar software profesional.