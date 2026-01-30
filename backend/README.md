# Mek Performance – Booking API

Small Flask backend that receives "Boka Tid" form submissions. Ready for Railway.

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export PORT=5000
python app.py
```

Then set in your frontend (or use same origin):

```html
<script>window.ALEX_BOOKING_API_URL = 'http://localhost:5000';</script>
```

## Deploy on Railway

1. In [Railway](https://railway.app), create a new project and add a service.
2. Set **Root Directory** to `backend` (so Railway uses this folder).
3. Connect your repo; Railway will detect Python and use the Procfile (`web: gunicorn app:app --bind 0.0.0.0:$PORT`).
4. After deploy, copy the public URL (e.g. `https://your-app.railway.app`) and set it in your frontend:

   ```html
   <script>window.ALEX_BOOKING_API_URL = 'https://your-app.railway.app';</script>
   ```

5. (Optional) To email bookings to `mek.performance@gmail.com`, set in Railway:

   - `SEND_BOOKING_EMAIL=1`
   - `SMTP_HOST=` (e.g. `smtp.gmail.com`)
   - `SMTP_USER=` your email
   - `SMTP_PASSWORD=` app password

If `ALEX_BOOKING_API_URL` is empty or the request fails, the form falls back to opening a `mailto:` link.

## Endpoints

- **POST /api/booking** – JSON body: `name`, `phone`, `email`, `registration`, `services` (array), `extra`. Returns `{ "ok": true, "message": "..." }` or `{ "error": "..." }`.
- **GET /api/health** – Health check for Railway.
