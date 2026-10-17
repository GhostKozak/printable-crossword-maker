# 🧩 Gazete Çengel & Kare Bulmaca Oluşturucu (Printable Arrowword & Crossword Maker)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Vanilla%20JS)-success.svg)](#)
[![Print Ready A4](https://img.shields.io/badge/Print-Ready%20A4%20%26%20PDF-orange.svg)](#)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages%20Ready-brightgreen.svg)](#)
[![Bilingual](https://img.shields.io/badge/Language-TR%20%7C%20EN%20%7C%20Mixed-purple.svg)](#)

Gerçek **Türk gazetesi formatında çengel bulmaca (Arrowword / Scandinavian Crossword)** ve **klasik kare bulmaca** üreten; kağıda basılmak, PDF olarak indirilmek veya doğrudan tarayıcı üzerinden klavyeyle çözülmek üzere tasarlanmış, sıfır bağımlılıklı modern bir web uygulamasıdır.

---

## 🌟 Öne Çıkan Özellikler

### 1. 📰 İki Farklı Bulmaca Modu
- **📰 Gazete Çengel Bulmaca (Arrowword / Scandinavian):**
  - Sorular kutuların doğrudan içinde yer alır.
  - Soru kutularının sağ alt köşesinde net başlangıç yön okları (`→` Yatay / `↓` Dikey).
  - İkili soru kutusu desteği (aynı kutudan hem sağa hem aşağıya soru çıkışı).
  - Sıfır boşluklu yüksek aktif alan yoğunluğu (%85-90+).
  - **Tekli Mod (Tam Sayfa):** Tüm A4 sayfasını kaplayan dev gazete çengel bulmacası.
  - **İkili Mod (2'li Sayfa):** Tek A4 sayfasına alt alta yerleşen, ortasında kesim çizgisi (`✂️`) bulunan iki adet kompakt çengel bulmaca.
- **🧩 Klasik Kare Bulmaca (Classic Crossword):**
  - Geleneksel numaralandırılmış hücreler ve alt kısımda 2 sütunlu ipucu listesi.

---

### 2. 🔐 Şifreli Anahtar Kelime Bandı (Secret Keyword)
- Gazetelerin geleneksel bulmaca sayfalarında olduğu gibi, tablodaki rastgele harflerin köşelerine numaralı küçük rozetler (`1`, `2`, `3`...) yerleştirilir.
- Bulmacanın en altında bu numaraların karşılığı olan kutucuklar yatay olarak sıralanır.
- Şifreli kelimenin de kendi ipucu metni bulunur (`🔐 ŞİFRELİ KELİME: İpucu`).
- Ekranda klavyeyle numaralı bir hücreye harf yazdığınızda, alttaki şifreli kelime kutucuğu da otomatik dolar.

---

### 3. ⌨️ İnteraktif Klavye ile Çözüm & Doğrulama
- **Klavye Desteği:** Herhangi bir harf kutusuna tıklayıp doğrudan harf yazabilirsiniz.
  - **Harfler (`A-Z`):** Harfi yazar ve bir sonraki kutuya otomatik ilerler.
  - **Space (Boşluk):** Yazma yönünü anında değiştirir (`→` Soldan Sağa / `↓` Yukarıdan Aşağıya).
  - **Yön Tuşları (`↑ ↓ ← →`):** Tablo içinde serbestçe gezinme sağlar.
  - **Backspace / Delete:** Harfi siler ve bir önceki kutuya döner.
- **✅ Kontrol Et (`#btn-check`):** Yazdığınız harfleri doğrular; doğru harfleri yeşil (`.cell-correct`), hatalı harfleri kırmızı (`.cell-wrong`) vurgular ve özet skor bildirimi gösterir.
- **💡 İpucu Harf (`#btn-hint`):** Takıldığınızda bulmacadaki harflerin ~%15'ini başlangıç ipucu olarak açıp kapatabilirsiniz.

---

### 4. 🌿 Toner Tasarruflu A4 Baskı & Vektörel PDF
- **45° Köşegen Tarama (Hatched Cells):** Kullanılmayan siyah kutular simsiyah mürekkep basmak yerine 45 derecelik ince çizgilerle taranır. Bu sayede yazıcı tonerinden %80'e varan tasarruf sağlanır.
- **Tek Sayfa A4 Garantisi:** `@media print` kuralları ile grid, başlık ve şifreli kelime bandı tam olarak A4 sayfasına sığacak şekilde ölçeklenir.
- **📄 Toplu Baskı (Batch Print):** Tek tıkla 2, 4, 6, 8 veya 10 farklı bulmacayı ve arkasındaki cevap anahtarlarını sıralı olarak yazdırabilirsiniz (sınıflar, kurslar ve etkinlikler için ideal).
- **📥 Vektörel PDF İndirme:** Sayfayı Türkçe karakter destekli, net çizgili PDF formatında tek tıkla kaydeder.

---

### 5. 🌐 1000+ Kelimelik Zengin Çok Dilli Veri Havuzu
- 3 harfliden 10+ harfliye kadar dengeli 1006 benzersiz İngilizce kelime.
- **13 Kategori:** Hayvanlar, Bilim, Coğrafya, Yemek, Teknoloji, Vücut & Meslekler, Genel, Spor, Ev, Hava Durumu, Taşıtlar, Kültür, Duygular.
- **3 Dil Seçeneği:**
  - 🇹🇷 **TR:** Türkçe ipuçları (İngilizce kelime öğrenimi için birebir).
  - 🇬🇧 **EN:** İngilizce tanımlar ve eş anlamlılar.
  - 🔀 **Mix:** Karışık Türkçe ve İngilizce ipucu kombinasyonu.
- **Anında Dil Güncelleme:** Dil butonuna basıldığında bulmaca bozulmadan veya girilen harfler silinmeden ipuçları yerinde güncellenir.

---

### 6. 🔗 URL ile Paylaşım & Deterministic Seed
- Her bulmaca `mulberry32` algoritması ile deterministik bir tohum (seed) üzerinden üretilir.
- **🔗 Paylaş Butonu:** Bulmacanın tam halini içeren URL hash parametresini (`#seed=...&type=cengel&diff=medium&lang=tr`) kopyalar. Linki açan herkes **birebir aynı** bulmacayı görür.

---

## 🏗️ Modüler Proje Mimarisi

Uygulama, sıfır harici paket bağımlılığıyla modern JavaScript (ES Modules) prensiplerine göre yapılandırılmıştır:

```
cengel-bulmaca/
├── index.html                 # Ana HTML arayüzü, sidebar, butonlar ve A4 baskı şablonu
│
├── css/
│   ├── style.css              # UI stilleri, gazete gridi, şifreli kelime barı, dark mode
│   └── print.css              # @media print kuralları, A4 ölçekleme, toner tarama
│
├── js/
│   ├── main.js                # Uygulama giriş noktası (bootstrap)
│   ├── app.js                 # CrosswordApp (UI durum yönetimi, klavye dinleyicileri)
│   │
│   ├── core/
│   │   ├── cengel-generator.js # Gazete tipi Çengel Bulmaca motoru (in-grid clues, secret word)
│   │   └── generator.js        # Klasik yüksek yoğunluklu Crossword motoru
│   │
│   ├── data/
│   │   └── words.js            # 1006 kelimelik kategorize edilmiş zengin TR/EN veri tabanı
│   │
│   └── utils/
│       ├── seeded-random.js    # Tohum tabanlı rastgele sayı üreticisi (PRNG)
│       └── pdf-exporter.js     # jsPDF tabanlı vektörel A4 PDF dışa aktarıcı
│
├── tests/
│   └── test-suite.js           # Kelime haznesi, tohum determinizmi ve çengel doğrulama testleri
│
└── README.md                   # Proje dokümantasyonu
```

---

## 🚀 Canlı Yayına Alma (GitHub Pages)

Bu proje statik bir web uygulaması olduğu için **GitHub Pages üzerinde 1 dakikada ücretsiz** yayınlanabilir:

1. **Reponuzu GitHub'a Gönderin:**
   ```bash
   git remote add origin https://github.com/<kullanici-adiniz>/<repo-adi>.git
   git branch -M main
   git push -u origin main
   ```
2. **GitHub Pages'i Açın:**
   - GitHub'da reponuzun **Settings** sekmesine tıklayın.
   - Sol menüden **Pages** seçeneğine gidin.
   - **Branch:** `main` ve klasör olarak `/(root)` seçip **Save** butonuna basın.
   - 30 saniye içinde siteniz `https://<kullanici-adiniz>.github.io/<repo-adi>/` adresinde canlıya geçer!

---

## 💻 Yerel Ortamda Çalıştırma

Modern ES Modülleri (`type="module"`) kullanıldığı için uygulamayı herhangi bir yerel sunucuyla açabilirsiniz:

```bash
# Python 3 ile:
python3 -m http.server 8000

# veya Node.js npx ile:
npx serve .
```

Tarayıcınızda `http://localhost:8000` adresine gidin.

---

## 🧪 Testleri Çalıştırma

Projede kelime haznesini, tekrarlayan sözcükleri, tohum determinizmini ve Çengel kelime uzunluk sınırlarını doğrulayan otomatik test paketi bulunmaktadır:

```bash
node tests/test-suite.js
```

---

## 📜 Lisans

Bu proje [MIT Lisansı](LICENSE) kapsamında açık kaynak olarak sunulmaktadır. Ticari ve kişisel projelerinizde serbestçe kullanabilir, çatallayabilir (fork) ve geliştirebilirsiniz.
