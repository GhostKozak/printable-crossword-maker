# 🧩 İngilizce Çengel Bulmaca Oluşturucu (Printable A4 Crossword Generator)

Tamamen rastgele İngilizce çengel bulmaca oluşturan, kağıt ve kalemle çözülmek üzere tasarlanmış, çok dilli ipucu destekli ve doğrudan **A4 kağıda baskı** alınabilen modern, modüler bir web uygulamasıdır.

---

## 🌟 Temel Özellikler

- **📚 1000+ Kelimelik Zengin Hazne:** 3 harfliden 10+ harfliye kadar dengeli, 13 kategoride 1006 benzersiz kelime.
- **🌐 Çok Dilli İpucu Desteği (Multi-Language):**
  - 🇹🇷 **TR (Türkçe):** İpuçları Türkçe (doğrudan anlam, eş/zıt anlam, deyim), ızgara cevapları İngilizce (İngilizce kelime öğrenimi ve dersler için ideal).
  - 🇬🇧 **EN (İngilizce):** Klasik İngilizce ipuçları ve tanımlar.
  - 🔀 **Mix (Karışık):** Ezberi bozan rastgele Türkçe ve İngilizce ipucu kombinasyonu.
- **🧩 Yüksek Yoğunluklu (Dense) Izgara Motoru:**
  - **Easy:** 14 kelime (~14x14 grid)
  - **Medium:** 21 kelime (~15x16 grid)
  - **Hard:** 30 kelime (18x18 ızgarayı dolduran zengin bağlantılı yapı)
  - Çoklu kesişim bonusu ve kompakt sınır optimizasyonu ile birbirine sıkıca kenetlenen bulmacalar.
- **🖨️ Kusursuz A4 Baskı Düzeni:**
  - `@media print` ve `@page { size: A4 portrait; }` ile optimize edilmiş sayfa ölçüleri.
  - Baskı anında menüler ve kontroller gizlenir, grid ve ipuçları tek A4 sayfasına sığacak şekilde ölçeklenir.
- **📄 Toplu Baskı (Batch Print):** Tek tıkla 2, 4, 6, 8 veya 10 farklı bulmacayı ve arkasındaki cevap anahtarlarını sıralı olarak yazdırma.
- **🔒 Gizli Cevap Anahtarı (Solution Key):** İsteğe bağlı açılan, açıldığında 2. sayfa olarak basılan çözüm tablosu.
- **🌙 Karanlık Mod (Dark Mode):** Göz yormayan koyu tema ve yerel depolama (`localStorage`) desteği.
- **🔗 URL ile Paylaşım:** Her bulmacanın benzersiz seed'ini, zorluğunu, dilini ve kategorilerini içeren link kopyalama.
- **📥 PDF İndirme:** Sayfayı doğrudan tek tıkla vektörel PDF olarak kaydetme.

---

## 🏗️ Modüler Proje Mimarisi

Uygulama, hem insanlar hem de AI asistanlar için yüksek okunabilirlik ve bakım kolaylığı sağlayan modüler bir yapıya sahiptir:

```
cengel-bulmaca/
├── index.html                 # Ana HTML şablonu ve modül yükleyicisi (~150 satır)
│
├── css/
│   ├── style.css              # Arayüz, butonlar, kontroller, animasyon ve dark mode
│   └── print.css              # A4 baskı kuralları (@media print)
│
├── js/
│   ├── main.js                # Uygulama giriş noktası (entrypoint)
│   ├── app.js                 # CrosswordApp (UI durum yönetimi, event listener'lar)
│   ├── core/
│   │   └── generator.js       # CrosswordGenerator (yüksek yoğunluklu ızgara algoritması)
│   ├── data/
│   │   └── words.js           # 1006 kelimelik çok dilli veri tabanı (RAW_WORD_BANK)
│   └── utils/
│       └── seeded-random.js   # SeededRandom (mulberry32 PRNG)
│
└── README.md                  # Proje dokümantasyonu
```

---

## 🚀 Nasıl Çalıştırılır?

Modern ES Modülleri (`type="module"`) kullanıldığı için uygulamayı yerel bir statik sunucuyla (veya modern tarayıcılarda doğrudan) açabilirsiniz:

```bash
# Python ile anında çalıştırmak için:
python3 -m http.server 8000

# Veya Node.js / npx ile:
npx serve
```

Ardından tarayıcınızda `http://localhost:8000` adresine gidin.
