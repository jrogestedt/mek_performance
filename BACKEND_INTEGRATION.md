# Frontend → Backend integration

Hemsidan använder **en** backend (Odoo-backend på Railway) för leads, Google-recensioner och (valfritt) booking. Samma base URL för alla anrop.

## Base URL och konfiguration

Sätt i `index.html` (före `script.js`):

```html
<script>
  window.ALEX_BOOKING_API_URL = 'https://odoobackend-production-c3c9.up.railway.app';
  window.ALEX_BOOKING_API_KEY = 'din-api-nyckel';   // krävs för /health och /api/lead
  window.ALEX_REVIEWS_API_URL = 'https://odoobackend-production-c3c9.up.railway.app';  // samma URL
</script>
```

Ersätt med din faktiska Railway-URL om den skiljer sig.

## Endpoints som används

| Endpoint | Auth | Användning |
|----------|------|------------|
| `GET /health` | API key (X-API-Key) | Health-check i footern |
| `POST /api/lead` | API key | Boka Tid-formuläret → skapar lead i Odoo (name, email, phone, message, possible_price, extra_fields) |
| `GET /api/google-reviews` | **Ingen** | Hämtar betyg och recensioner från Google (cachade 24 h). Vid 503 visas statisk fallback. |

## Lead-payload (Boka Tid)

Formuläret skickar enligt Lead API: `name`, `email` (obligatoriskt), `phone`, `message` (notes), `possible_price` (summa valda tjänster), `extra_fields` (t.ex. `x_studio_registration_number`, `x_studio_desired_services`). API-nyckel skickas i header `X-API-Key`.

## Google reviews

- Anrop: `GET {ALEX_REVIEWS_API_URL}/api/google-reviews` – **ingen** API-nyckel.
- Svar: `{ rating, user_ratings_total, reviews }` där varje `reviews[]` har `author_name`, `rating`, `text`, `relative_time_description`.
- Vid fel (t.ex. 503) behålls den statiska fallback-texten på sidan.

## Fullständig API-dokumentation

Se backend-repots **Lead API — Frontend integration guide** för alla endpoints, felkoder, CORS och exempel (t.ex. `POST /api/booking` om booking används separat från lead).
