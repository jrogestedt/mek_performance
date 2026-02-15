/**
 * Local dev server with API proxy so Google reviews and booking API work
 * without CORS when running locally. Run: npm run dev
 *
 * Serves static files and forwards /api/* and /health to the Railway backend.
 *
 * Optional: protect dev deployment behind HTTP Basic Auth. Set PROTECT_DEV_PASSWORD
 * (and optionally PROTECT_DEV_USER) only on the dev/staging Railway service;
 * leave unset on main/production.
 */
import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const BACKEND_URL = process.env.ALEX_BACKEND_URL || 'https://odoobackend-production-c3c9.up.railway.app';
const API_KEY = process.env.ALEX_BOOKING_API_KEY || 'ff94829249676f4c1413417be10202aac74446076c65bdb5dc7c678034ba64e7';

const app = express();

// Optional: HTTP Basic Auth for dev deployment (only when PROTECT_DEV_PASSWORD is set)
const devPassword = process.env.PROTECT_DEV_PASSWORD;
const devUser = process.env.PROTECT_DEV_USER || 'mek_performance';
if (devPassword) {
  app.use((req, res, next) => {
    // Allow health checks and API proxy without auth
    if (req.path === '/health' || req.path.startsWith('/api')) return next();
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Dev"');
      res.status(401).send('Authentication required');
      return;
    }
    const b64 = auth.slice(6);
    let decoded;
    try {
      decoded = Buffer.from(b64, 'base64').toString('utf8');
    } catch {
      res.setHeader('WWW-Authenticate', 'Basic realm="Dev"');
      res.status(401).send('Authentication required');
      return;
    }
    const [user, pass] = decoded.split(':');
    if (user !== devUser || pass !== devPassword) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Dev"');
      res.status(401).send('Authentication required');
      return;
    }
    next();
  });
}

// Proxy API and health to Railway (same-origin → no CORS)
app.use(
  ['/api', '/health'],
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    onProxyReq(proxyReq, req) {
      // Add API key for /health and /api/lead
      if (req.path === '/health' || req.path === '/api/lead') {
        proxyReq.setHeader('X-API-Key', API_KEY);
      }
    },
  })
);

// Static files
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Dev server: http://localhost:${PORT}`);
  console.log('API requests (/api/*, /health) are proxied to', BACKEND_URL);
});
