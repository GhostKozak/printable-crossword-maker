# 🧩 Printable Crossword & Arrowword Maker (Gazete Çengel & Kare Bulmaca)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Vanilla%20JS)-success.svg)](#)
[![Print Ready A4](https://img.shields.io/badge/Print-Ready%20A4%20%26%20PDF-orange.svg)](#)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages%20Ready-brightgreen.svg)](#)
[![Bilingual](https://img.shields.io/badge/Language-English%20%7C%20Türkçe-purple.svg)](#)

[ 🇬🇧 English ](#-english) &nbsp;|&nbsp; [ 🇹🇷 Türkçe ](#-türkçe)

---

# 🇬🇧 English

A modern, zero-dependency web application designed to generate authentic **newspaper-style Arrowwords (Scandinavian Crosswords / Gazete Çengel Bulmaca)** and **Classic Crosswords**. Perfectly formatted for standard **A4 paper printing**, **vector PDF export**, or **interactive in-browser keyboard solving**.

---

## 🌟 Key Features

### 1. 📰 Dual Puzzle Modes & Flexible Layouts
- **📰 Arrowword / Gazete Çengel (Scandinavian Crossword):**
  - Clues are written directly inside the grid cells.
  - Unambiguous start arrows located at the bottom-right corner (`→` Across / `↓` Down) to prevent overlapping with clue text.
  - Dual-clue cells (providing both Across and Down directions from a single block).
  - High active area density (85%–90%+ filled cells).
  - **Full-Page Layout:** A large, comprehensive newspaper arrowword spanning the whole A4 page.
  - **Dual Layout (2-in-1):** Two compact stacked puzzles on a single A4 sheet with a neat scissor cut line (`✂️`).
- **🧩 Classic Crossword:**
  - Traditional numbered grid cells paired with organized two-column clue lists below.

### 2. 🔐 Secret Keyword Strip
- Numbered circular badges (`1`, `2`, `3`...) are placed in selected grid cells.
- A horizontal answer bar at the bottom displays the secret keyword positions with an accompanying riddle/clue (`🔐 SECRET KEYWORD: Clue`).
- Typing letters in badged cells automatically updates the secret keyword boxes in real time.

### 3. ⌨️ Interactive Keyboard Play & Instant Verification
- **Keyboard Navigation:** Click any letter cell and start typing:
  - **Letters (`A-Z`):** Enters the character in uppercase and advances to the next cell.
  - **Spacebar:** Toggles typing direction (`→ Across` ↔ `↓ Down`) with an instant toast notification.
  - **Arrow Keys (`↑ ↓ ← →`):** Seamlessly navigates across the grid.
  - **Backspace / Delete:** Clears the current cell and steps back.
- **✅ Check Answers (`#btn-check`):** Highlights correct answers in green (`.cell-correct`) and mistakes in red (`.cell-wrong`), displaying an accurate progress score.
- **💡 Starter Hints (`#btn-hint`):** Reveals ~15% of grid letters to help beginners or unblock challenging words.

### 4. 🌐 Complete Bilingual Support (UI, Answer Language & Clues)
- **One-Click UI Language Toggle (`🌐 TR` / `🌐 EN`):** Instantly switches all interface labels, buttons, dialogs, sheet titles, stats, and notification toasts. Persisted in `localStorage`.
- **Selectable Answer Language (`🇬🇧 EN` Default | `🇹🇷 TR` Optional):**
  - **🇬🇧 English Answers (Default):** Generates puzzles from the **2,046+ English Word Bank** — ideal for practicing English vocabulary.
  - **🇹🇷 Turkish Answers:** Generates authentic Turkish newspaper crosswords from the **848+ Turkish Word Bank (`TR_WORD_BANK`)** with full Turkish keyboard character support (`Ç, Ğ, İ, Ö, Ş, Ü`).
- **Flexible Clue Languages:**
  - 🇹🇷 **TR:** Turkish clues (great for language learners).
  - 🇬🇧 **EN:** Native English definitions, synonyms, and idioms.
  - 🔀 **Mixed:** Randomized blend of Turkish and English clues.
- **In-Place Clue Updating:** Switching clue language updates all clues dynamically without regenerating the grid or wiping entered letters.

### 5. 🌿 Toner-Saving A4 Printing & Vector PDF
- **45° Diagonal Hatching:** Blocked/empty cells use elegant diagonal line hatching rather than solid black ink, saving up to 80% printer toner.
- **Strict A4 Guarantee:** Calibrated `@media print` rules ensure zero page overflow.
- **📄 Batch Print:** Print 2, 4, 6, 8, or 10 distinct puzzles followed by matching answer keys in one go.
- **📥 Vector PDF:** Generates crisp, printable PDF documents with clean typography and Turkish character sanitization.

### 6. 📚 2,046+ English & 848+ Turkish Words across 19 Categories + CEFR Levels
- **2,046 unique English words** and **848 unique Turkish words** spanning 3 to 10+ letters, each with **3+ concise newspaper-style clues** in both languages.
- **⭐ Top 1000 Most Frequent Words (`⭐ Top 1000`):** Includes a dedicated one-click quick filter and category chip containing **1,006 high-frequency core English words** that can be selected on its own or combined with other themes.
- **19 Thematic Categories:** Top 1000, Animals, Science, Geography, Food, Technology, Body & Jobs, General, Sports, Household, Weather, Vehicles, Culture, Emotions, Cinema & Art, History, Space, Business & Economy, Idioms & Phrases.
- **CEFR Vocabulary Difficulty Filtering:** Selecting **Easy** (A1–A2), **Medium** (B1–B2), or **Hard** (C1) filters both grid dimensions and word difficulty levels.

### 7. 🔗 Deterministic Seed & URL Sharing
- Powered by a seeded pseudo-random generator (`mulberry32`).
- **🔗 Share Link:** Copies a permalink with hash parameters (`#seed=...&type=cengel&diff=medium&ans=en&lang=en`). Opening the link reconstructs the **exact same puzzle**.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `A` – `Z` (or `Ç Ğ İ Ö Ş Ü` in TR mode) | Enter letter and advance to the next cell |
| `Space` | Toggle typing direction (`→ Across` / `↓ Down`) |
| `Arrow Keys` | Move cursor in the specified direction |
| `Backspace` | Clear cell and step back |
| `Delete` | Clear current cell |
| `Click Cell` | Select cell (clicking selected cell toggles direction) |

---

## 🏗️ Architecture

Built with pure vanilla JavaScript (ES Modules) and zero runtime dependencies:

```
cengel-bulmaca/
├── index.html                 # Main interface, sidebar controls & A4 sheets
├── css/
│   ├── style.css              # UI styles, grid layouts, themes, responsive rules
│   └── print.css              # @media print rules, A4 scaling & hatched cells
├── js/
│   ├── main.js                # Bootstrap entry point
│   ├── app.js                 # UI controller, keyboard handlers & state
│   ├── core/
│   │   ├── cengel-generator.js # Arrowword engine (in-grid clues, secret word)
│   │   └── generator.js        # Classic crossword engine
│   ├── data/
│   │   ├── words.js            # Unified barrel exports (WORD_BANK & TR_WORD_BANK)
│   │   ├── words-en.js         # 2,046 English words (19 categories, CEFR levels, Top 1000)
│   │   └── words-tr.js         # 848 Turkish words for Turkish Answer Mode
│   └── utils/
│       ├── i18n.js             # Dual-language translation strings (TR & EN)
│       ├── seeded-random.js    # Mulberry32 deterministic PRNG
│       └── pdf-exporter.js     # jsPDF vector PDF generator
├── tests/
│   └── test-suite.js           # Automated verification test suite
└── README.md
```

---

## 🚀 Deployment (GitHub Pages)

This project is a 100% static web application that deploys to GitHub Pages with zero build steps:

1. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/<username>/printable-crossword-maker.git
   git branch -M main
   git push -u origin main
   ```
2. **Enable GitHub Pages:**
   - Go to your repository **Settings** on GitHub.
   - Navigate to **Pages** in the left sidebar.
   - Set **Source** to `Deploy from a branch`, choose branch `main` and folder `/(root)`.
   - Click **Save**. Your site will be live at:
     `https://<username>.github.io/printable-crossword-maker/`

---

## 💻 Local Development

Run with any lightweight local static server:

```bash
# Python 3
python3 -m http.server 8000

# or Node.js npx
npx serve .
```

Open `http://localhost:8000` in your browser.

---

## 🧪 Running Tests

Verify dictionary integrity, seed determinism, and puzzle generation invariants:

```bash
node tests/test-suite.js
```

---

<br/>

---

# 🇹🇷 Türkçe

Gerçek **Türk gazetesi formatında Çengel Bulmaca (Scandinavian Arrowword)** ve **Klasik Kare Bulmaca** üreten; standart **A4 kağıda basılmak**, **vektörel PDF olarak indirilmek** veya **doğrudan tarayıcıda klavyeyle çözülmek** üzere tasarlanmış, sıfır bağımlılıklı modern bir web uygulamasıdır.

---

## 🌟 Öne Çıkan Özellikler

### 1. 📰 İki Farklı Bulmaca Modu & Esnek Sayfa Düzenleri
- **📰 Gazete Çengel Bulmaca (Arrowword):**
  - Sorular doğrudan ızgara kutularının içinde yer alır.
  - Soru kutularının sağ alt köşesinde net başlangıç yön okları (`→` Yatay / `↓` Dikey); metinle oklar asla üst üste gelmez.
  - İkili soru kutusu desteği (aynı kutudan hem sağa hem aşağıya soru çıkışı).
  - Yüksek aktif alan yoğunluğu (%85–%90+).
  - **Tam Sayfa Düzeni:** Tüm A4 sayfasını kaplayan dev gazete çengel bulmacası.
  - **İkili Düzen (2'li Sayfa):** Tek A4 sayfasına alt alta yerleşen, ortasında kesim çizgisi (`✂️`) bulunan iki adet kompakt çengel bulmaca.
- **🧩 Klasik Kare Bulmaca (Crossword):**
  - Geleneksel numaralandırılmış hücreler ve alt kısımda 2 sütunlu ipucu listesi.

### 2. 🔐 Şifreli Anahtar Kelime Bandı
- Gazetelerin geleneksel bulmaca sayfalarında olduğu gibi, tablodaki rastgele harflerin köşelerine numaralı küçük rozetler (`1`, `2`, `3`...) yerleştirilir.
- Bulmacanın en altında bu numaraların karşılığı olan kutucuklar yatay olarak sıralanır (`🔐 ŞİFRELİ KELİME: İpucu`).
- Ekranda klavyeyle numaralı bir hücreye harf yazdığınızda, alttaki şifreli kelime kutucuğu da otomatik dolar.

### 3. ⌨️ İnteraktif Klavye ile Çözüm & Doğrulama
- **Klavye Desteği:** Herhangi bir harf kutusuna tıklayıp doğrudan harf yazabilirsiniz:
  - **Harfler (`A-Z`):** Harfi yazar ve bir sonraki kutuya otomatik ilerler.
  - **Space (Boşluk):** Yazma yönünü anında değiştirir (`→` Soldan Sağa / `↓` Yukarıdan Aşağıya).
  - **Yön Tuşları (`↑ ↓ ← →`):** Tablo içinde serbestçe gezinme sağlar.
  - **Backspace / Delete:** Harfi siler ve bir önceki kutuya döner.
- **✅ Kontrol Et (`#btn-check`):** Yazdığınız harfleri doğrular; doğru harfleri yeşil (`.cell-correct`), hatalı harfleri kırmızı (`.cell-wrong`) vurgular ve anlık skor bildirimi sunar.
- **💡 İpucu Harf (`#btn-hint`):** Takıldığınızda bulmacadaki harflerin ~%15'ini başlangıç ipucu olarak açıp kapatabilirsiniz.

### 4. 🌐 Tam Çift Dil Desteği (Arayüz, Cevap Dili & İpuçları)
- **Tek Tıkla Arayüz Dil Değiştirici (`🌐 TR` / `🌐 EN`):** Tüm butonları, başlıkları, diyalogları, istatistikleri ve bildirimleri anında Türkçeye veya İngilizceye çevirir. Tercih `localStorage` ile saklanır.
- **Seçilebilir Cevap Dili (`🇬🇧 İngilizce` Varsayılan | `🇹🇷 Türkçe` Opsiyonel):**
  - **🇬🇧 İngilizce Cevaplar (Varsayılan):** İngilizce kelime pratiği için **2.046+ kelimelik İngilizce Kelime Havuzundan** bulmaca üretir.
  - **🇹🇷 Türkçe Cevaplar:** Klasik Türk gazetesi bulmacası çözmek isteyenler için **848+ kelimelik Türkçe Kelime Havuzundan (`TR_WORD_BANK`)** bulmaca üretir (Tam Türkçe klavye `Ç, Ğ, İ, Ö, Ş, Ü` desteğiyle).
- **3 Farklı İpucu Dili:**
  - 🇹🇷 **TR:** Türkçe ipuçları (İngilizce kelime haznesi geliştirmek için mükemmel).
  - 🇬🇧 **EN:** İngilizce eş anlamlılar, tanımlar ve deyimler.
  - 🔀 **Mix:** Karışık Türkçe ve İngilizce ipucu kombinasyonu.
- **Yerinde Güncelleme:** İpucu dili değiştirildiğinde bulmaca yapısı bozulmaz veya girilen harfler silinmez; ipuçları anında güncellenir.

### 5. 🌿 Toner Tasarruflu A4 Baskı & Vektörel PDF
- **45° Köşegen Tarama (Hatched Cells):** Kullanılmayan siyah kutular simsiyah mürekkep basmak yerine 45 derecelik ince çizgilerle taranır. Yazıcı tonerinden %80'e varan tasarruf sağlar.
- **Tek Sayfa A4 Garantisi:** `@media print` kuralları ile grid, başlık ve şifreli kelime bandı tam olarak A4 sayfasına sığacak şekilde ölçeklenir.
- **📄 Toplu Baskı (Batch Print):** Tek tıkla 2, 4, 6, 8 veya 10 farklı bulmacayı ve arkasındaki cevap anahtarlarını sıralı olarak yazdırabilirsiniz.
- **📥 Vektörel PDF İndirme:** Sayfayı Türkçe karakter destekli, net çizgili PDF formatında tek tıkla kaydeder.

### 6. 📚 2.046+ İngilizce & 848+ Türkçe Kelime, 19 Kategori ve CEFR Seviyeleri
- 3 harfliden 10+ harfliye kadar dengeli **2.046 benzersiz İngilizce kelime** ve **848 benzersiz Türkçe kelime** (her kelimede gazete çengel kutularına uygun **3+ özlü ipucu**).
- **⭐ En Sık Kullanılan 1000 Kelime (`⭐ İlk 1000`):** Günlük hayatta en sık kullanılan **1.006 temel İngilizce kelimeyi** tek tıkla tek başına veya diğer kategorilerle birlikte seçebilme imkanı.
- **19 Zengin Kategori:** En Sık 1000, Hayvanlar, Bilim, Coğrafya, Yiyecekler, Teknoloji, Vücut & Meslekler, Genel, Spor, Ev & Eşya, Hava Durumu, Taşıtlar, Kültür, Duygular, Sinema & Sanat, Tarih, Uzay, İş & Ekonomi, Deyimler.
- **CEFR Kelime Zorluk Filtresi:** **Kolay** (A1–A2), **Orta** (B1–B2) ve **Zor** (C1) seçimi yalnızca ızgara boyutunu değil, seçilen kelimelerin zorluk seviyesini de akıllıca filtreler.

### 7. 🔗 URL ile Paylaşım & Deterministik Seed
- Her bulmaca `mulberry32` algoritması ile deterministik bir tohum (seed) üzerinden üretilir.
- **🔗 Paylaş Butonu:** Bulmacanın tam halini içeren URL hash parametresini (`#seed=...&type=cengel&diff=medium&ans=en&lang=tr`) panoya kopyalar. Linki açan herkes **birebir aynı** bulmacayı görür.

---

## ⌨️ Klavye Kısayolları

| Tuş | İşlev |
| --- | --- |
| `A` – `Z` | Harfi yaz ve bir sonraki kutuya geç |
| `Boşluk (Space)` | Yazma yönünü değiştir (`→ Soldan Sağa` / `↓ Yukarıdan Aşağıya`) |
| `Yön Tuşları` | Tabloda istenen yönde gezin |
| `Backspace` | Harfi sil ve geri git |
| `Delete` | Seçili kutudaki harfi sil |
| `Kutuya Tıklama` | Kutuyu seç (seçili kutuya tekrar tıklamak yönü değiştirir) |

---

## 🚀 Canlı Yayına Alma (GitHub Pages)

Bu proje statik bir web uygulaması olduğu için **GitHub Pages üzerinde ücretsiz ve anında** yayınlanabilir:

1. **Reponuzu GitHub'a Gönderin:**
   ```bash
   git remote add origin https://github.com/<kullanici-adiniz>/printable-crossword-maker.git
   git branch -M main
   git push -u origin main
   ```
2. **GitHub Pages'i Açın:**
   - GitHub'da reponuzun **Settings** sekmesine tıklayın.
   - Sol menüden **Pages** seçeneğine gidin.
   - **Branch:** `main` ve klasör olarak `/(root)` seçip **Save** butonuna basın.
   - 30 saniye içinde siteniz `https://<kullanici-adiniz>.github.io/printable-crossword-maker/` adresinde canlıya geçer!

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
