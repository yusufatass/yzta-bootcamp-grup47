<div align="center">
<img src="frontend\public\mascot\logo.png" width="200" alt="Note Sloth Maskotu" />
  
# 📝 Papyrus AI
### Takım 47

*Düşüncelerinizi aklınızdan geçtiği gibi yazın — gerisini yapay zeka halletsin.*

</div>

---

## 👥 Takım Elemanları

| İsim | Rol |
|---|---|
| Mehmet Kaan Karataş | Product Owner |
| Yusuf Ataş | Scrum Master |
| Nermin Aybike Ertürk | Frontend Developer |

---

## 📌 Ürün Hakkında

### Ürün Açıklaması

Düşüncelerinizi aklınızdan geçtiği gibi — dağınık, düzensiz ve serbest biçimde — yazmanızı sağlayan ve yapay zeka kullanarak bunları okunabilir bir formata dönüştüren bir web uygulaması. Net başlıklar, gruplandırılmış bölümler ve öne çıkarılan önemli noktalar. Siz sadece yazın, uygulama düzenlesin.

**Teknoloji Yığını:** Next.js · FastAPI · Supabase · OpenAI API

### ✨ Ürün Özellikleri

- **Serbest metin girişi:** Kullanıcı hiçbir format kısıtlaması olmadan aklına geleni yazar, not anlık olarak kaydedilir
- **Anonim mod:** Kayıt olmadan not yazılabilir; notlar sadece tarayıcı oturumunda (sessionStorage) tutulur, sekme kapanınca silinir, AI'ya hiç gönderilmez
- **Kayıtlı mod:** Email + şifre ile kayıt olup email doğrulaması yapan kullanıcılar, notlarını AI'ya gönderebilir
- **AI destekli kategorileme:** Notlar sabit bir kategori setine (Alışveriş Listesi, Toplantı Notları, Ders Notları, Günlük Plan, Seyahat Listesi, Genel/Diğer) otomatik atanır ve okunabilir formata dönüştürülür
- **Not geçmişi:** Kenar çubuğunda geçmiş notlara erişim (anonim modda oturum bazlı, kayıtlı modda kalıcı)
- **Otomatik tam erişim:** Doğrulanan hesaplar ödeme veya ek onay olmadan doğrudan tüm AI özelliklerine erişir

### 🎯 Hedef Kitle

Düşüncelerini hızlıca ve düzensiz şekilde not almak isteyen, ancak bu notların sonradan düzenli ve okunabilir hale gelmesini bekleyen öğrenciler, profesyoneller ve günlük hayatında liste/plan tutan herkes. Özellikle ders notu tutan öğrenciler, toplantı notu alan profesyoneller ve karışık günlük görev/alışveriş listeleri tutan kullanıcılar birincil hedef kitledir.

### 🔗 Product Backlog

[Notion — Papyrus AI Sprint Raporu](https://app.notion.com/p/YZTA-Tak-m-47-Papyrus-AI-Sprint-Raporu-394884952fd9803cb22fcefed250e2f8?source=copy_link)

---

## 🚀 Sprint 1

**Backlog düzeni ve Story seçimleri**
Backlog'umuz ilk yapılacak story'lere göre düzenlenmiştir. Sprint başına tahmin edilen puan sayısını geçmeyecek şekilde sıradan seçimler yapılmaktadır. Story başına çıkan tahmin puanı, toplam puanın yarısından az tutulmuştur.

Story'ler yapılacak işlere (task'lere) bölünmüştür.

**Ekip İletişimi**
Ekip toplantıları 3 günde bir WhatsApp ve Slack üzerinden gerçekleştirilmektedir.

**Sprint 1 Hedefleri ve Tamamlananlar**
- Proje kapsamı netleştirildi, roller ve sorumluluklar ekibe dağıtıldı
- Monorepo iskelet yapısı oluşturuldu (Next.js frontend, FastAPI backend)
- Supabase projesi kuruldu: Auth yapılandırması, veritabanı şeması ve RLS politikaları uygulandı
- Branch stratejisi ve PR şablonu hazırlandı
- API kontratı taslağı oluşturuldu
- Ürün Sahibi tarafından rekabet analizi gerçekleştirildi ve ekiple paylaşıldı

<details>
<summary><strong>📊 Sprint Board Update</strong></summary>
<br>

<img width="973" height="912" alt="Sprint 1 board güncellemesi" src="https://github.com/user-attachments/assets/8e951d6a-7c73-468f-9935-025ad24f5aea" />

</details>

<details>
<summary><strong>🖥️ Ürün Durumu</strong></summary>
<br>

<img width="898" height="646" alt="Sprint 1 ürün durumu ekran görüntüsü" src="https://github.com/user-attachments/assets/d7891f70-e61d-4f5f-bf4e-f5b34691df7e" />

</details>

**Sprint Review**
Sprint sonunda Phase 1 — Foundation başarıyla tamamlanmış ve ekibe sunulmuştur. Teknik iskelet, veritabanı kurulumu ve rol dağılımı gözden geçirilmiştir. Sprint Review doğrultusunda Phase 2 — Core Loop çalışmalarına başlanmasına karar verilmiş, her role ait haftalık görevler yeniden dağıtılmıştır.

**Sprint Retrospective**
- Birbirini tanımayan bir ekip olarak bir araya gelip projenin ilk ayağını başarıyla tamamlamak olumlu bir başlangıç olarak değerlendirilmiştir
- Ekip içi iletişimin henüz yeterli olgunluğa ulaşmadığı gözlemlenmiş, iletişim kanallarının daha aktif kullanılması ve düzenli buluşma sıklığının korunması kararlaştırılmıştır
- Görev dağılımının daha adil ve dengeli bir şekilde yürütülmesi gerektiği tespit edilmiş, bir sonraki sprintte iş yükünün ekip üyeleri arasında eşit paylaşılmasına özen gösterilecektir

---

## 🚀 Sprint 2

**Backlog düzeni ve Story seçimleri**
İkinci faz kapsamındaki görev dağılımları, ilgili iletişim kanalları (WhatsApp ve Slack) üzerinden ekip üyelerine paylaştırılmıştır. Ancak ekip genelinde gerekli sorumluluk bilincinin ve duyarlılığın tam olarak oluşmaması nedeniyle, planlanan geliştirmelerin ilerletilmesinde aksaklıklar yaşanmıştır. Buna karşın, puanlama sisteminde hedeflenen süreç başarıyla tamamlanmış ve projenin kritik/can alıcı fonksiyonlarına öncelik verilerek backlog optimizasyonu sağlanmıştır.

Story'ler yapılacak işlere (task'lere) tekrar bölünmüştür.

**Ekip İletişimi**
Mevcut sprint itibariyle ekip içi iletişim kanalları tamamen işlevsiz hale gelmiş ve 2. Sprint sürecinde planlanan ortak toplantılar gerçekleştirilememiştir. Yaşanan bu operasyonel kopukluk üzerine, Bootcamp Asistanımız (Kevser Bilgiç) ile gerekli görüşmeler ve durum değerlendirmeleri yapılmıştır. Yapılan görüşmeler sonucunda, projeye ve geliştirme süreçlerine aktif katkı sağlamayan ekip üyelerinin isimlerinin projenin README dosyasından çıkarılmasına karar verilmiş ve ilgili aksiyon alınmıştır.

**Sprint 2 Hedefleri ve Tamamlananlar**
- **Kullanıcı Kayıt ve Profil Yönetimi:** Ad/soyad bilgilerinin kayıt formunda alınması, kullanıcı profil sayfasının (`/settings`) ve güvenli hesap silme (cascade deletion) işlemlerinin entegrasyonu tamamlandı.
- **Demo ve Test Altyapısı:** Hızlı test ve sunum süreçleri için örnek notlar içeren veri tohumlama betiği (`seed_demo.py`) ve otomatik doğrulanmış demo kullanıcı hesapları tanımlandı.
- **Şifre Yönetimi ve Güvenlik:** Supabase Auth destekli şifre sıfırlama akışı (`/forgot-password`, `/reset-password`), şifre gizleme/gösterme kontrolleri ve onaylı kayıt alanı geliştirildi.
- **Esnek AI ve Multi-LLM Altyapısı:** Birincil sağlayıcı olarak Groq (Llama-3.3-70b) ve yedek sağlayıcı olarak OpenAI (GPT-4o Mini) entegrasyonunu barındıran çift katmanlı LLM mimarisi kuruldu.
- **Yapay Zeka Özelleştirmeleri ve Kalite Kontrolü:** "Simplify", "Explain", "Improve" gibi hazır AI yönergeleri ve "Ask AI Assistant" özel prompt desteğini sunan açılır menü eklendi; Türkçe notlar için dil sızıntısı engelleyici ve orijinal yazar tonunu koruyucu prompt optimizasyonları yapıldı.
- **Zengin Editör ve Manuel Formatlama:** Kalın, eğik, altı çizili, başlıklar, sırasız ve kontrol listeleri içeren biçimlendirme araç çubuğu eklendi; AI analizi olmadan not kaydetmeyi sağlayan "Save as-is" (Olduğu Gibi Kaydet) seçeneği sunuldu.
- **İnteraktif Checkbox ve Sürüm Kontrolü:** Not içeriklerindeki markdown listelerinin tıklanabilir dinamik onay kutularına dönüştürülmesi sağlandı; veritabanı şemasına `original_raw_text` kolonu eklenerek notları orijinal haline döndürme (Restore) özelliği entegre edildi.
- **Arama, Filtreleme ve Dinamik Sidebar:** Not geçmişi için gerçek zamanlı kelime arama, kategoriye göre filtreleme ve fiziksel derinlik efektli yenilikçi "Card Stack" (Not Destesi) görünümü ve özel kaydırma çubuğu (scrollbar) tasarlandı.
- **Çoklu Dil Desteği (i18n):** `next-intl` altyapısı kullanılarak tüm uygulama sayfalarına, onboarding modallarına ve ayarlara TR/EN dil seçeneği ve geçiş aracı eklendi.
- **Gelişmiş Tema Yönetimi:** Yerel hafıza (localStorage) destekli ve işletim sistemi tercihlerinden bağımsız çalışan sınıf tabanlı (class-based) Koyu/Açık (Light/Dark) tema geçiş mekanizması ve özel renk teması (Cyberpunk, Sepia, Nord Ice vb.) paleti kuruldu.
- **Maskot Entegrasyonu ve Görsel Kimlik:** Uygulama kimliğini yansıtan özel "Note Sloth" (Not Uyuşuk Hayvanı) maskot çizimleri; header, onboarding aşamaları, boş durumlar ve çıkış ekranlarına entegre edildi.
- **Kullanıcı Deneyimi (UX) İyileştirmeleri:** Yeni anonim kullanıcılar için 3 adımlı interaktif Onboarding turu, özelleştirilmiş not silme/çıkış yapma doğrulama modalları ve premium özellikleri tanıtan `/premium` showcase sayfası geliştirildi.

<details>
<summary><strong>📊 Sprint Board Update</strong></summary>
<br>

<img width="896" height="955" alt="Sprint 2 board güncellemesi" src="https://github.com/user-attachments/assets/3adce823-59c8-4918-b55c-557d46564344" />

</details>

<details>
<summary><strong>🖥️ Ürün Durumu</strong></summary>
<br>

<img width="1361" height="937" alt="Sprint 2 ürün durumu 1" src="https://github.com/user-attachments/assets/97d81813-7fe3-417d-84f5-4e9efe66a6b9" />
<img width="1141" height="932" alt="Sprint 2 ürün durumu 2" src="https://github.com/user-attachments/assets/a0d3b9aa-7c4f-4d67-b10a-14ba5c467488" />
<img width="1328" height="939" alt="Sprint 2 ürün durumu 3" src="https://github.com/user-attachments/assets/d6e784d4-0ebb-4ef5-a1aa-0dd24cb872ec" />
<img width="1350" height="936" alt="Sprint 2 ürün durumu 4" src="https://github.com/user-attachments/assets/cbb414b0-f010-4ac7-b5d6-82b4c9b4f1fc" />
<img width="1302" height="936" alt="Sprint 2 ürün durumu 5" src="https://github.com/user-attachments/assets/5169c764-9e41-4430-9fe5-89de931bc520" />

</details>

**Sprint Review**
Sprint sonunda planlanan genel kapanış toplantısı, ekip genelinde gerekli sorumluluk bilincinin oluşmaması nedeniyle gerçekleştirilememiştir. Bu sprintte toplantı adına, Product Owner ile yapılan tek görüşme gerçekleştirilmiş; bu doğrultuda stratejik fikir alışverişlerinde bulunularak projenin gelecek fazlarındaki geliştirmeler planlanmıştır.

Tüm iletişim ve operasyonel aksaklıklara rağmen projenin teknik ilerlemesi sürdürülmüştür. Bu kapsamda, Frontend Developer tarafından ürünümüze ilk Pull Request (PR) başarılı bir şekilde açılmış ve dinamik tema entegrasyonu projeye sorunsuz bir şekilde dahil edilmiştir.

**Sprint Retrospective**
- Ekip bir araya gelemediği için retro toplantısı yapılamamıştır.

<details>
<summary><strong>İletişim Durumu</strong></summary>
<br>
<img width="1271" height="892" alt="image" src="https://github.com/user-attachments/assets/dc7bed54-0941-4be3-bf82-abc1146dfd55" />
<img width="1265" height="316" alt="image" src="https://github.com/user-attachments/assets/15944b33-887f-4416-8dc2-b05465e94a48" />
<img width="1275" height="886" alt="image" src="https://github.com/user-attachments/assets/a5600d39-b9fa-4b4f-9390-edc5c5966415" />
<img width="1271" height="947" alt="image" src="https://github.com/user-attachments/assets/c3fe061b-ee86-4a09-bab4-88f12f8860f6" />
</details>
---

## 🚀 Sprint 3

*(devam ediyor...)*
