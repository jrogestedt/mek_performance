# Backend CORS fix (Odoo backend on Railway)

The frontend gets **CORS errors** when calling the backend from another origin (e.g. localhost, Live Server, or the production frontend). Affected requests:

- **GET /api/google-reviews** – no custom headers, but response must include CORS headers
- **GET /health** – sends `X-API-Key`, so the browser sends a **preflight (OPTIONS)** first; preflight must return **200**, not 400
- **POST /api/lead** – same: preflight (OPTIONS) then POST; both need CORS

If the preflight returns **400**, the browser never sends the real request and you see “CORS error” and “Preflight” in the Network tab.

## What to do on the backend (odoobackend on Railway)

### 1. Set `CORS_ORIGINS`

Include every origin the site is loaded from (no trailing slash).

In Railway: **backend** service → **Variables** → add or edit:

```text
CORS_ORIGINS = https://mekperformance-production.up.railway.app, http://localhost:5500, http://localhost:3000, http://127.0.0.1:5500
```

Add any port you use locally (e.g. Live Server often uses 5500, `npx serve` uses 3000).

### 2. OPTIONS (preflight) must return 200

For **every** path the frontend calls (`/health`, `/api/lead`, `/api/google-reviews`), the backend must:

- Accept **OPTIONS** requests to that path.
- Return status **200** (not 400 or 405).
- Include CORS headers on the OPTIONS response:
  - `Access-Control-Allow-Origin: <allowed origin>`
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, X-API-Key`
  - `Access-Control-Max-Age: 86400`

If OPTIONS returns 400 (e.g. “missing API key”), the browser blocks the request. So: **do not require API key or body for OPTIONS**; handle OPTIONS before auth and return 200 with CORS headers only.

### 3. CORS headers on real responses

Every **GET** and **POST** response from these endpoints must include:

- `Access-Control-Allow-Origin: <origin>` (one of the allowed origins, or the request’s `Origin` if it’s in the allow-list)

So:

- **GET /api/google-reviews** – add CORS headers to the JSON response.
- **GET /health** – add CORS headers (and keep 401 for missing/invalid key, but still send CORS so the browser can read the response).
- **POST /api/lead** – add CORS headers to the JSON response.

### 4. Summary checklist

| Request            | Backend must                                                                 |
|--------------------|-------------------------------------------------------------------------------|
| OPTIONS /health    | 200 + CORS headers (no API key required)                                     |
| OPTIONS /api/lead | 200 + CORS headers                                                            |
| OPTIONS /api/google-reviews | 200 + CORS headers (optional; simple GET may not preflight)          |
| GET /api/google-reviews | 200 (or 503) + **Access-Control-Allow-Origin** + body                  |
| GET /health        | 200 or 401 + **Access-Control-Allow-Origin** + body                           |
| POST /api/lead     | 200 + **Access-Control-Allow-Origin** + body                                 |

After changing and redeploying the backend, reload the frontend and check the **Network** tab: OPTIONS should be **200**, and each response should have `Access-Control-Allow-Origin` matching your frontend origin (e.g. `http://localhost:5500`).
