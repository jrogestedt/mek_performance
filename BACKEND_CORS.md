# Backend CORS fix (Lead API on Railway)

The frontend gets a **CORS error** when calling `POST /api/lead` because the browser’s preflight (OPTIONS) is rejected or not allowed.

## What to do on the backend (odoobackend on Railway)

1. **Set `CORS_ORIGINS`** to include the exact origin(s) the site is loaded from.

   **Frontend on Railway:** use the frontend’s Railway URL (no trailing slash):
   - `https://mekperformance-production.up.railway.app`

   In Railway: open the **backend** service (odoobackend) → **Variables** → add or edit:
   ```text
   CORS_ORIGINS = https://mekperformance-production.up.railway.app
   ```
   To also allow local testing, use comma-separated:
   ```text
   CORS_ORIGINS = https://mekperformance-production.up.railway.app, http://localhost:5500
   ```

2. **Respond to OPTIONS with 200**  
   The backend must handle `OPTIONS` requests to `/api/lead` (and any path you call) and return **200** with CORS headers, for example:
   - `Access-Control-Allow-Origin: <origin from request or *>`
   - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, X-API-Key`
   - `Access-Control-Max-Age: 86400`

3. **Include CORS headers on the actual POST response**  
   The response to `POST /api/lead` must also include `Access-Control-Allow-Origin` (and optionally other CORS headers) so the browser accepts the response.

After updating and redeploying the backend, try “Skicka förfrågan” again. If you still see CORS errors, check the **Network** tab: the OPTIONS request should return **200**, and the response headers should contain `Access-Control-Allow-Origin` matching your frontend origin.
