# Protecting the dev deployment on Railway

The app can protect the **dev** deployment behind HTTP Basic Auth so only people with a password can access it. The **main** (production) deployment stays public.

## How it works

- Password protection is **off** unless you set the env var `PROTECT_DEV_PASSWORD`.
- Set `PROTECT_DEV_PASSWORD` **only** on the service/environment that deploys from the `dev` branch.
- Leave it **unset** on the service that deploys from `main`.

## Setup on Railway

1. Open your **dev** service (or staging environment) in the Railway dashboard.
2. Go to **Variables** and add:
   - `PROTECT_DEV_PASSWORD` = the password you want (e.g. a strong random string).
   - (Optional) `PROTECT_DEV_USER` = username for Basic Auth (default is `dev`).
3. Do **not** set these variables on your production service (the one that deploys from `main`).
4. Redeploy the dev service so the new variables take effect.

## Using the protected site

When visiting the dev URL, the browser will prompt for username and password. Use the username (`PROTECT_DEV_USER` or `dev`) and the password you set in `PROTECT_DEV_PASSWORD`.

- `/health` and `/api/*` are not protected so health checks and API calls still work.
