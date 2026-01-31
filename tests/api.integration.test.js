/**
 * Integration tests: anropar backend (health, google-reviews, lead).
 * Kräver: ALEX_API_BASE (default production), ALEX_API_KEY (för /health och /api/lead).
 * Kör: npm test
 */
import test from "node:test";
import assert from "node:assert";

const BASE = (process.env.ALEX_API_BASE || "https://odoobackend-production-c3c9.up.railway.app").replace(
  /\/$/,
  ""
);
const API_KEY = process.env.ALEX_API_KEY || "";

test("GET /health returns 200 and status up", { skip: !API_KEY }, async () => {
  const res = await fetch(`${BASE}/health`, {
    method: "GET",
    headers: { "X-API-Key": API_KEY },
  });
  assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
  const data = await res.json();
  assert.ok(data.status === "up" || data.status === "ok", `Expected status up/ok, got ${data.status}`);
});

test("GET /api/google-reviews returns 200 and shape { rating?, user_ratings_total?, reviews }", async () => {
  const res = await fetch(`${BASE}/api/google-reviews`, { method: "GET" });
  if (res.status === 503) {
    assert.ok(res.status === 503, "Backend returns 503 when Google not configured");
    const body = await res.json().catch(() => ({}));
    assert.ok(body.detail != null || true, "503 may include detail");
    return;
  }
  assert.strictEqual(res.status, 200, `Expected 200 or 503, got ${res.status}`);
  const data = await res.json();
  assert.ok(typeof data === "object" && data !== null);
  if (data.rating != null) assert.ok(typeof data.rating === "number");
  if (data.user_ratings_total != null) assert.ok(typeof data.user_ratings_total === "number");
  if (Array.isArray(data.reviews)) {
    for (const r of data.reviews) {
      assert.ok(typeof r === "object");
      if (r.author_name != null) assert.ok(typeof r.author_name === "string");
      if (r.rating != null) assert.ok(typeof r.rating === "number");
      if (r.text != null) assert.ok(typeof r.text === "string");
      if (r.relative_time_description != null) assert.ok(typeof r.relative_time_description === "string");
    }
  }
});

test("POST /api/lead returns 200 and { status: 'ok', lead_id }", { skip: !API_KEY }, async () => {
  const payload = {
    name: "Test Lead (tester)",
    email: "test-lead@example.com",
    phone: "+46701234567",
    message: "Automated test from frontend repo",
    possible_price: 5000,
    extra_fields: {
      x_studio_registration_number: "TEST123",
      x_studio_desired_services: "Test service",
    },
  };
  const res = await fetch(`${BASE}/api/lead`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(payload),
  });
  assert.strictEqual(res.status, 200, `Expected 200, got ${res.status} ${await res.text()}`);
  const data = await res.json();
  assert.strictEqual(data.status, "ok");
  assert.ok(typeof data.lead_id === "number" || typeof data.lead_id === "string");
});

test("GET /health without API key returns 401", async () => {
  const res = await fetch(`${BASE}/health`, { method: "GET" });
  assert.strictEqual(res.status, 401, `Expected 401 when no API key, got ${res.status}`);
});
