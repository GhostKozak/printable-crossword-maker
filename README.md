# 🧩 İngilizce Çengel Bulmaca Oluşturucu (Printable A4 Crossword Generator)

Bu uygulama, her seferinde tamamen rastgele İngilizce çengel bulmaca oluşturan, çözümü gerçek dünyada kağıt ve kalemle yapılmak üzere tasarlanmış ve doğrudan **A4 kağıda baskı** alınabilen bir web uygulamasıdır.

---

## 🌟 Temel Özellikler

- **🎲 Sonsuz Rastgele Bulmaca:** Her "New Puzzle" tıklandığında veya zorluk değiştirildiğinde 200+ kelimelik hazneden yeni bir çengel bulmaca inşa edilir.
- **🎯 3 Zorluk Seviyesi:**
  - **Easy (Kolay):** 8 - 10 kelime
  - **Medium (Orta):** 12 - 15 kelime
  - **Hard (Zor):** 17 - 20 kelime
- **🖨️ Kusursuz A4 Baskı Düzeni:**
  - `@media print` ve `@page { size: A4 portrait; }` ile optimize edilmiş sayfa ölçüleri.
  - Baskı anında menüler, butonlar ve kontrol çubukları otomatik olarak gizlenir.
  - Grid hücre boyutları otomatik olarak A4 genişliğine ve kelime sayısına göre optimize edilir.
  - İpuçları (Across / Down) çift sütun halinde temiz ve okunabilir şekilde yerleşir.
- **🔒 Gizli Cevap Anahtarı (Solution Key):**
  - Çözen kişinin istemsizce cevapları görmemesi için cevap anahtarı varsayılan olarak **tamamen gizlidir**.
  - **"👁️ Show Answer Key"** butonuna basıldığında açılır.
  - Sadece açıldığında baskı çıktısına **Sayfa 2** olarak eklenir; gizliyken basılırsa yalnızca 1 sayfalık boş bulmaca yazdırılır.
- **⚡ Sıfır Kurulum & Çevrimdışı Çalışma:**
  - Vanilla HTML, CSS ve JavaScript (bağımlılık yok, Node.js veya sunucu gerektirmez).
  - Dosyayı çift tıklayarak herhangi bir modern web tarayıcısında (Chrome, Safari, Edge, Firefox) anında çalıştırabilirsiniz.

---

## 🚀 Nasıl Kullanılır?

1. `index.html` dosyasını tarayıcınızda açın (çift tıklayarak ya da sürükleyip bırakarak).
2. Üst panelden istediğiniz zorluk seviyesini seçin (**Easy**, **Medium**, **Hard**).
3. Beğenmediğiniz bir yerleşim olursa **"🔄 New Puzzle"** butonuna basarak yeni bir bulmaca üretin.
4. **"🖨️ Print (A4)"** butonuna tıklayın (veya klavyeden `Ctrl+P` / `Cmd+P` yapın):
   - Hedef olarak yazıcınızı veya **"PDF Olarak Kaydet"** seçeneğini seçin.
   - Kağıt boyutu olarak **A4** seçildiğinden emin olun.
5. *(Opsiyonel)* Öğretmenler veya kontrol etmek isteyenler için **"👁️ Show Answer Key"** butonuna basılarak harfleri dolu grid ve cevap dizini görüntülenebilir/yazdırılabilir.

---

## 📐 Teknik Mimari

- **Algoritma:** Iterative Word Placement & Constraint Scoring
  - Kelimeleri uzunluklarına göre azalan sırada dizer.
  - İlk kelimeyi merkez koordinatlara yerleştirir.
  - Sonraki her kelime için harf kesişim adaylarını tarar, bitişik paralel çakışmaları engeller ve en kompakt/merkezi yerleşimi seçer.
  - Bounding-box kırpması yaparak boş kenarları atar ve dinamik 1-N numaralandırma uygular.
- **Tipografi & Stil:** Google Fonts (Cinzel başlıklar, Inter grid harfleri ve metinler) ve CSS Custom Properties ile dinamik hücre ölçekleme.
