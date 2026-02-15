/**
 * Local dev server with API proxy so Google reviews and booking API work
 * without CORS when running locally. Run: npm run dev
 *
 * Serves static files and forwards /api/* and /health to the Railway backend.
 */
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const BACKEND_URL = process.env.ALEX_BACKEND_URL || 'https://odoobackend-production-c3c9.up.railway.app';
const API_KEY = process.env.ALEX_BOOKING_API_KEY || 'ff94829249676f4c1413417be10202aac74446076c65bdb5dc7c678034ba64e7';

const app = express();

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
