# Karekontrol - Proje Kapsamı

## Ne İşe Yarar?

Karekontrol, sanayi ve endüstriyel işletmelerde **uyumluluk (compliance) ve bakım prosedürlerinin** dijital ortamda yönetilmesini sağlayan bir platformdur. Fabrikalar, üretim tesisleri, depolar ve benzeri tesislerdeki ekipman/makine/varlıkların periyodik bakım, kontrol ve denetim süreçlerini baştan sona dijitalleştirir.

---

## Hangi Problemi Çözüyor?

| Geleneksel Yöntem | Karekontrol ile |
|---|---|
| Kağıt üzerinde kontrol listeleri | Dijital adım adım checklist, fotoğraflı kayıt |
| Excel'de takip, kayıp veriler | Merkezi veritabanı, gerçek zamanlı ilerleme |
| Uygunsuzlukların geç fark edilmesi | Anında bildirim, otomatik uygunsuzluk kaydı |
| Periyodik bakım atlanması | Otomatik zamanlama ve overdue uyarıları |
| Raporlama için saatler harcama | Tek tıkla uyumluluk raporu |
| Yetki karmaşası | 4 seviyeli rol tabanlı erişim kontrolü |
| Sahadaki çalışanla ofis arasında kopukluk | Mobil uygulama ile saha+ofis entegrasyonu |

---

## Kimler Kullanır?

### Platform Yöneticisi (SUPER_ADMIN)
- Birden fazla organizasyonu yönetir
- Sistem genelinde istatistikleri görüntüler
- Tüm verilere erişebilir

### Organizasyon Yöneticisi (ADMIN)
- Kendi organizasyonundaki departmanları, kullanıcıları, varlıkları yönetir
- Prosedür tanımları oluşturur
- Uyumluluk raporlarını inceler

### Departman Yöneticisi (MANAGER)
- Departmanındaki ekibi ve atanan prosedürleri takip eder
- Uygunsuzlukları departman bazında yönetir
- Departman performans metriklerini görür

### Saha Çalışanı (WORKER)
- Atanan prosedürleri mobil cihazdan yürütür
- Adım adım kontrol listesini tamamlar
- Fotoğraf çeker, not ekler
- Uygunsuzluk bildirir

---

## Temel Özellikler

### 1. Varlık Yönetimi
- Ekipman, makine, tesis gibi varlıkların kaydı
- QR kod üretimi (varlık başına otomatik)
- Fotoğraf galerisi ve doküman eklentileri
- Konum, seri numarası, üretici, garanti bilgileri
- Durum takibi (aktif, bakımda, devre dışı)

### 2. Prosedür Tanımlama
- Adım adım kontrol prosedürleri oluşturma
- Her adım için: fotoğraf zorunluluğu, not zorunluluğu, uyumluluk kontrolü
- Öncelik seviyesi (düşük, orta, yüksek, kritik)
- Periyodik tekrar aralığı (gün, hafta, ay, yıl bazında)
- Tahmini süre tanımı
- Prosedür şablonları ile hızlı oluşturma

### 3. Prosedür Yürütme
- Mobil uygulama veya web panelden adım adım yürütme
- Her adım için uyumlu/uyumsuz/atla seçenekleri
- Fotoğraf çekme ve not ekleme
- Gerçek zamanlı ilerleme takibi (% tamamlanma)
- Uyumsuz adımlarda otomatik uygunsuzluk kaydı oluşturma
- Tamamlanan adımların detaylarını görüntüleme (fotoğraf, not, checklist)

### 4. Uygunsuzluk (Compliance) Yönetimi
- Prosedür yürütme sırasında veya bağımsız olarak uygunsuzluk bildirme
- Ciddiyet seviyeleri (düşük, orta, yüksek, kritik)
- Departman veya kullanıcıya atama
- Yorum ve tartışma akışı
- Çözüm kaydı ve fotoğraflı doğrulama
- Durum takibi: Açık → Devam Ediyor → Çözüldü → Doğrulandı → Kapatıldı

### 5. Bildirim Sistemi
- Uygulama içi bildirimler (web + mobil)
- Push notification desteği (mobil)
- Otomatik bildirimler: atama, uygunsuzluk, overdue, tamamlanma
- Okunmamış bildirim sayacı (sidebar badge)
- Zamanlanmış hatırlatıcılar (adım bazlı)

### 6. Raporlama
- Uyumluluk raporu, prosedür raporu, varlık raporu, departman raporu
- Dönem bazlı filtreleme (ay/yıl)
- Otomatik rapor zamanlaması
- PDF indirme desteği

### 7. İzin ve Yetki Yönetimi
- 4 seviyeli rol yapısı (SUPER_ADMIN, ADMIN, MANAGER, WORKER)
- Organizasyon bazında izin politikası özelleştirme
- Prosedür atama sistemi (kullanıcı + tarih aralığı)
- Kapsam kontrolü: Tüm Sistem / Organizasyon / Departman / Kendi

### 8. Denetim Kaydı (Audit)
- Tüm yazma işlemleri otomatik loglanır
- Kim, ne zaman, ne yaptı kaydı
- Geri dönülemez kayıt (sadece okunabilir)

---

## Nasıl Çalışır? (Kullanıcı Akışı)

### Adım 1: Kurulum
1. SUPER_ADMIN sisteme giriş yapar
2. Organizasyon oluşturulur
3. Departmanlar tanımlanır
4. Kullanıcılar eklenir ve rolleri atanır

### Adım 2: Varlık ve Prosedür Tanımlama
1. ADMIN/MANAGER varlıkları sisteme ekler (ekipman, makine vb.)
2. Her varlık için QR kod otomatik üretilir
3. Prosedürler tanımlanır (örn: "Aylık Jeneratör Bakımı")
4. Prosedüre adımlar eklenir (örn: "Yağ seviyesini kontrol et", "Filtre temizliği yap")
5. Periyodik tekrar aralığı belirlenir

### Adım 3: Prosedür Atama ve Yürütme
1. Prosedür bir çalışana atanır
2. Çalışan mobil uygulamayı açar, atanan prosedürlerini görür
3. "Yürütme Başlat" ile prosedür başlatılır
4. Her adımı sırayla tamamlar:
   - Kontrol yapar → "Uyumlu" veya "Uyumsuz" seçer
   - Gerekirse fotoğraf çeker, not ekler
   - Uyumsuz ise otomatik uygunsuzluk kaydı oluşturulur
5. Tüm adımlar tamamlanınca "Yürütmeyi Tamamla" ile bitirilir

### Adım 4: Uygunsuzluk Takibi
1. Uyumsuz adımlarda otomatik uygunsuzluk kaydı oluşur
2. İlgili departman yöneticisine bildirim gider
3. Yönetici uygunsuzluğu bir kişiye atar
4. Atanan kişi sorunu giderir ve çözüm fotoğrafıyla kaydeder
5. Yönetici çözümü doğrular ve kapatır

### Adım 5: Raporlama ve Takip
1. Dashboard'da genel istatistikler görüntülenir
2. Uyumluluk oranları, açık uygunsuzluklar, tamamlanan prosedürler
3. Dönemsel raporlar oluşturulur
4. Overdue prosedürler için otomatik uyarılar gönderilir

---

## Platform Bileşenleri

### Web Paneli (Next.js)
- Yönetim odaklı: organizasyon, kullanıcı, prosedür tanımlama
- Dashboard: İstatistikler, aktivite akışı, açık uygunsuzluklar
- Detaylı tablo görünümleri, filtreleme, arama
- Prosedür yürütme detay görünümü (adım checklist, fotoğraflar, notlar)
- Rapor üretimi ve indirme

### Mobil Uygulama (Expo / React Native)
- Saha odaklı: prosedür yürütme, fotoğraf çekme, QR tarama
- Offline destek: çevrimdışı adım tamamlama, sonra senkronizasyon
- Push bildirimler: atama, overdue, uygunsuzluk uyarıları
- Kamera entegrasyonu: adım fotoğrafı, uygunsuzluk kanıtı

### Backend API (Django)
- RESTful API: Tüm işlemler API üzerinden
- JWT kimlik doğrulama: Güvenli, stateless
- RBAC: Her endpoint rol bazlı erişim kontrolü
- Celery: Asenkron bildirim gönderimi, rapor üretimi
- Audit trail: Tüm işlemler loglanır

---

## Teknik Gereksinimler

### Sunucu
- Python 3.12+
- PostgreSQL 15+ (production)
- Redis 7+ (Celery broker, cache)
- Nginx (reverse proxy)

### Web İstemci
- Node.js 20+
- Modern tarayıcılar (Chrome, Firefox, Safari, Edge)

### Mobil
- iOS 15+ / Android 10+
- Expo SDK 54
- Kamera izni (fotoğraf çekimi için)

---

## Mevcut Durum ve Yol Haritası

### Tamamlanan Özellikler
- Kullanıcı yönetimi ve JWT kimlik doğrulama
- Organizasyon ve departman CRUD
- Varlık yönetimi (QR, fotoğraf, doküman)
- Prosedür tanımlama (adımlar, öncelik, periyod)
- Prosedür yürütme (adım bazlı checklist)
- Uygunsuzluk yönetimi (oluşturma, atama, çözüm)
- Bildirim sistemi (uygulama içi + push)
- Raporlama (4 rapor türü + zamanlama)
- RBAC izin sistemi
- Dashboard istatistikleri
- Offline senkronizasyon (mobil)

### Gelecek Özellikler
- Audit log sayfası (web panel) — backend altyapısı hazır
- QR kod tarama ile hızlı prosedür başlatma (mobil)
- Gelişmiş analitik ve trend grafikleri
- Çoklu dil desteği (i18n)
- Email bildirim entegrasyonu
- API rate limiting (production)
- Dosya storage S3/CDN entegrasyonu (production)
