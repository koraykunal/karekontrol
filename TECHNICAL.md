# Karekontrol - Teknik Dokümantasyon

## Genel Mimari

Karekontrol, üç bağımsız bileşenden oluşan bir full-stack uygulamadır:

```
karekontrol/
├── backend/          Django REST API (Python 3.12+)
├── web/              Next.js 16 Dashboard (TypeScript/React 19)
└── mobile/           Expo SDK 54 / React Native (TypeScript)
```

Tüm bileşenler aynı backend API'yi tüketir. Web uygulaması server-side proxy üzerinden, mobil uygulama doğrudan API'ye bağlanır.

---

## Backend (Django REST Framework)

### Uygulama Yapısı

```
backend/
├── config/
│   ├── settings/
│   │   ├── base.py           Temel ayarlar (JWT, Celery, Logging, Middleware)
│   │   ├── development.py    SQLite, CORS *, console email, debug
│   │   ├── production.py     PostgreSQL, HTTPS, SMTP, CORS whitelist
│   │   └── test.py           Test ayarları
│   ├── urls.py               Ana URL router
│   └── celery.py             Celery yapılandırması
├── apps/
│   ├── authentication/       Kullanıcı yönetimi, JWT login/logout/refresh
│   ├── organizations/        Organizasyon ve departman CRUD
│   ├── entities/             Varlık (ekipman/makine) yönetimi, QR, fotoğraf
│   ├── procedures/           Prosedür tanımları, adımlar, şablonlar
│   ├── execution/            Prosedür yürütme, adım logları, hatırlatıcılar
│   ├── compliance/           Uygunsuzluk (issue) yönetimi, yardım talepleri
│   ├── permissions/          RBAC motoru, prosedür atamaları, izin politikaları
│   ├── notifications/        Bildirimler, push, zamanlanmış görevler (Celery)
│   ├── reporting/            Rapor üretimi, zamanlanmış raporlar
│   ├── audit/                Denetim kaydı (AuditMiddleware ile otomatik)
│   └── core/                 Dashboard, dosya upload, ortak modeller/servisler
└── manage.py
```

### Rol Tabanlı Erişim (RBAC)

4 seviyeli rol yapısı:

| Rol | Kapsam | Yetkiler |
|-----|--------|----------|
| SUPER_ADMIN | Tüm sistem | Her şeye tam erişim, organizasyonlar arası geçiş |
| ADMIN | Kendi organizasyonu | Organizasyon yönetimi, tüm departmanları görme |
| MANAGER | Kendi departmanı | Departman kullanıcıları, prosedürler, raporlar |
| WORKER | Kendi atanmışları | Atanan prosedürleri yürütme, uygunsuzluk bildirme |

İzin motoru: `apps/permissions/engine.py` → `PermissionEngine`
- Her rol için varsayılan izin seti tanımlı
- `PermissionPolicy` modeli ile organizasyon bazında özelleştirilebilir
- `filter_queryset()` ile queryset seviyesinde kapsam filtreleme
- 5 dakikalık önbellek (per-user)

### Kimlik Doğrulama (JWT)

- Access token: 30 dakika
- Refresh token: 7 gün (rotate + blacklist)
- SimpleJWT ile `TokenObtainPairView`, `TokenRefreshView`
- Token blacklisting aktif (logout'ta refresh token iptal)

### Veritabanı

- Development: SQLite (sıfır bağımlılık)
- Production: PostgreSQL (`CONN_MAX_AGE=600`)
- Multi-tenancy: `TenantMiddleware` ile organizasyon bazlı filtreleme
- Audit: `AuditMiddleware` ile tüm yazma işlemleri otomatik loglanır

### API Response Yapıları

Backend farklı endpoint türleri için farklı response wrapper'ları kullanır:

| Endpoint Türü | Response Yapısı | Örnek |
|---------------|----------------|-------|
| List (paginated) | `{ success, data: [...], total, page, page_size, total_pages }` | `GET /procedures/` |
| Retrieve (detail) | Düz serializer objesi `{ id, title, ... }` | `GET /procedures/5/` |
| Create / Action | `{ success, message, data: {...} }` | `POST /procedures/` |
| Dashboard | `{ success, data: {...} }` | `GET /dashboard/stats/` |
| Hata | `{ success: false, message, errors }` | 4xx/5xx yanıtları |

### Asenkron Görevler (Celery + Redis)

- Broker: Redis
- Beat scheduler: Overdue prosedür kontrolü, zamanlanmış raporlar
- Görevler: Bildirim gönderimi, push notification, rapor üretimi
- `transaction.on_commit()` ile transaction güvenli dispatch

### Dosya Upload

- `core/UploadViewSet`: Organizasyon bazlı klasör yapısı
- Path: `uploads/org_{id}/{category}/{date}/{uuid}.{ext}`
- Kategori: images, videos, documents, procedures, other
- Maks boyut: 50MB
- MIME type ve uzantı doğrulaması: `core/file_validators.py`

---

## Web (Next.js 16)

### Mimari

```
web/src/
├── app/
│   ├── api/
│   │   ├── auth/              Login/Logout/Refresh/Me route handlers
│   │   └── proxy/[...path]/   Backend proxy (cookie-based auth injection)
│   ├── dashboard/             Tüm dashboard sayfaları
│   │   ├── page.tsx           Ana dashboard (istatistikler, aktivite)
│   │   ├── organizations/     Organizasyon yönetimi
│   │   ├── users/             Kullanıcı yönetimi
│   │   ├── entities/          Varlık listesi + detay (sekmeli)
│   │   ├── procedures/        Prosedür listesi + detay
│   │   ├── execution/         Yürütme listesi + detay (adım checklist)
│   │   ├── compliance/        Uygunsuzluk yönetimi
│   │   ├── notifications/     Bildirimler
│   │   ├── reports/           Raporlar
│   │   ├── settings/          Profil + şifre değiştirme
│   │   └── audit/             Denetim kaydı (yakında)
│   └── login/                 Giriş sayfası
├── components/
│   ├── ui/                    shadcn/ui bileşenleri (21 adet)
│   └── shared/                DataTable, ConfirmDialog, PageHeader, vb.
├── hooks/
│   ├── queries/               React Query hooks (10 dosya)
│   ├── useAuth.ts             Login/logout mantığı
│   ├── usePermissions.ts      Rol bazlı UI kontrolü
│   ├── usePagination.ts       Sayfalama state yönetimi
│   └── useDebounce.ts         Debounce utility
├── lib/
│   ├── api/
│   │   ├── client.ts          Axios instance + 401 refresh interceptor
│   │   └── modules/           API modülleri (auth, entities, procedures, vb.)
│   ├── constants.ts           Enum'lar, label map'leri (Türkçe)
│   ├── query-keys.ts          React Query key factory
│   ├── utils.ts               Yardımcı fonksiyonlar (handleApiError, cn, vb.)
│   └── server/cookies.ts      HTTP-only cookie yönetimi
├── store/
│   ├── auth.ts                Zustand auth store (isAuthenticated, user)
│   └── tenant.ts              Zustand tenant store (currentOrganization)
└── types/                     TypeScript tip tanımları (10 dosya)
```

### Auth Akışı (Web)

```
1. Login sayfası → POST /api/auth/login (Next.js route handler)
2. Route handler → Backend /auth/login/ çağrısı
3. Backend JWT token döner → Route handler HTTP-only cookie set eder
4. Client redirect → /dashboard
5. Dashboard layout → /api/auth/me ile user bilgisi çeker
6. API istekleri → /api/proxy/[...path] üzerinden backend'e iletilir
7. Proxy → Cookie'den token okur → Authorization: Bearer header ekler → Backend'e gönderir
8. 401 yanıtı → Client /api/auth/refresh çağırır → Cookie yenilenir → İstek tekrarlanır
```

Token'lar asla client-side JavaScript'te saklanmaz. Tüm token yönetimi server-side HTTP-only cookie'ler üzerinden yapılır.

### State Yönetimi

| Store | Persist | İçerik |
|-------|---------|--------|
| auth | Evet (sadece `isAuthenticated` flag) | user, isAuthenticated, hydrated |
| tenant | Hayır | currentOrganization, availableOrganizations |
| React Query | Bellek (cache) | Tüm API verileri |

PII (kullanıcı bilgileri) persist edilmez. Sayfa yenilemede `/api/auth/me` ile tekrar çekilir.

### React Query Pattern'ları

- **List hooks**: `queryFn` doğrudan `PaginatedResponse<T>` döner
- **Detail hooks**: `queryFn` doğrudan `T` döner (backend retrieve plain obje döner)
- **Dashboard hooks**: `response.data` unwrap (dashboard endpoint'leri `{success, data}` wrapper kullanır)
- **Mutation hooks**: `handleApiError(error, 'Türkçe mesaj')` ile tutarlı hata yönetimi
- **Invalidation**: Mutation sonrası ilgili query key'ler invalidate edilir

### UI Bileşenleri

- **shadcn/ui**: 21 temel UI bileşeni (Button, Card, Dialog, Table, vb.)
- **DataTable**: Sıralama, arama, sayfalama, skeleton loading, boş state
- **ConfirmDialog**: Tehlikeli işlemler için onay dialogu (`isLoading` prop)
- **StepChecklist**: Prosedür adımlarını yürütme (uyumlu/uyumsuz/atla + fotoğraf/not gösterimi)

---

## Mobil (Expo / React Native)

### Mimari

```
mobile/
├── app/                       Expo Router (file-based routing)
│   ├── (auth)/login.tsx       Giriş ekranı
│   ├── (main)/
│   │   ├── (tabs)/
│   │   │   ├── (dashboard)/   Ana sayfa
│   │   │   ├── (management)/  Varlık, prosedür, kullanıcı yönetimi
│   │   │   └── (profile)/     Profil
│   │   ├── execution/         Prosedür yürütme detay
│   │   └── notifications.tsx  Bildirimler
│   └── _layout.tsx            Root layout
├── src/
│   ├── api/
│   │   ├── client/            Axios instance + interceptors
│   │   ├── endpoints/         Endpoint tanımları
│   │   └── services/          API servis katmanı
│   ├── store/
│   │   ├── zustand/           auth, offline, app store'ları
│   │   └── react-query/       Query client + hooks
│   ├── features/              Özellik bazlı bileşenler (entities, procedures, vb.)
│   ├── hooks/                 Custom hooks (usePushNotifications, useEntityHistory)
│   └── constants/             Env, theme, sabitler
└── app.json                   Expo yapılandırması
```

### Auth Akışı (Mobil)

```
1. Login ekranı → Backend /auth/login/ doğrudan çağrılır
2. access_token + refresh_token → SecureStore'a kaydedilir
3. Her istek → Interceptor Authorization: Bearer header ekler
4. 401 yanıtı → Interceptor refresh dener (Promise-based dedup)
5. Refresh başarısız → clearAuth() + login ekranına redirect
```

### Offline Desteği

- `offline.store.ts`: Zustand ile offline mutation kuyruğu
- Çevrimdışıyken adım tamamlama işlemleri kuyruğa eklenir
- Çevrimiçi olunca sırayla işlenir
- AsyncStorage'da persist edilir

### Push Notifications

- Expo Push Token sistemi
- `usePushNotifications.ts`: Token kaydı + deep link yönlendirme
- Backend `push_service.py`: Expo API ile gönderim

---

## Veritabanı Şeması (Ana Tablolar)

```
organizations          Organizasyonlar
departments            Departmanlar (org → department)
users                  Kullanıcılar (org + department + role)
entities               Varlıklar (org + department + type + status)
entity_images          Varlık fotoğrafları
entity_documents       Varlık dokümanları
procedures             Prosedür tanımları (org + entity + interval)
procedure_steps        Prosedür adımları (sıralı)
procedure_logs         Yürütme kayıtları (procedure + entity + user + status)
step_logs              Adım logları (procedure_log + step + completion_status)
non_compliance_issues  Uygunsuzluklar (entity + step_log + severity)
issue_comments         Uygunsuzluk yorumları
notifications          Bildirimler (user + type)
notification_schedules Zamanlanmış bildirimler
audit_logs             Denetim kayıtları (otomatik)
permission_policies    İzin politikaları (org bazlı RBAC özelleştirme)
procedure_assignments  Prosedür atamaları (user + procedure + tarih aralığı)
reports                Raporlar (org + department + type + period)
report_schedules       Zamanlanmış raporlar
```

---

## Geliştirme Ortamı Kurulumu

### Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows
pip install -r requirements.txt
cp .env.example .env           # SECRET_KEY ve DEMO_PASSWORD ayarla
python manage.py migrate
python manage.py populate_demo_data --password <demo_sifre>
python manage.py runserver 0.0.0.0:8000
```

Celery (opsiyonel, bildirimler ve raporlar için):
```bash
celery -A config worker -l info
celery -A config beat -l info
```

### Web

```bash
cd web
npm install
cp .env.example .env.local     # DJANGO_API_URL ayarla
npm run dev
```

### Mobil

```bash
cd mobile
npm install
cp .env.example .env           # API_BASE_URL ayarla
npx expo start
```

---

## Production Deployment Notları

### Backend
- `DJANGO_SETTINGS_MODULE=config.settings.production`
- PostgreSQL veritabanı
- Redis (Celery broker + cache)
- `ALLOWED_HOSTS` ve `CORS_ALLOWED_ORIGINS` zorunlu
- Gunicorn/uWSGI ile serve
- `collectstatic` çalıştır, media dosyalarını S3/CDN'e yönlendir
- SSL/TLS zorunlu (tüm güvenlik header'ları production.py'de aktif)

### Web
- `npm run build && npm start`
- `DJANGO_API_URL` production backend URL'i
- `next.config.ts` → `images.remotePatterns` → production domain ekle
- CSP header'daki `img-src` → production media domain ekle

### Mobil
- `eas build --profile production`
- `app.json` → `bundleIdentifier` (iOS) ve `package` (Android) ayarla
- `eas.json` profilleri: development, preview, production
- Push notification sertifikaları yapılandır

---

## Kod Kalitesi ve Convention'lar

- TypeScript strict mode (web + mobile)
- Türkçe UI metinleri, İngilizce kod ve değişken isimleri
- React Query ile server state, Zustand ile client state ayrımı
- API modülleri → hooks → bileşenler katmanlı yapı
- Backend: Service layer pattern (views → services → models)
- RBAC: Backend zorunlu, frontend sadece UI gösterimi
- Hata yönetimi: `handleApiError()` ile tutarlı toast mesajları
- Yorum satırı kullanılmaz (clean code prensibi)
