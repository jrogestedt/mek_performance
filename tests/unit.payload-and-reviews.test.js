/**
 * Unit tests: lead-payload och Google-reviews-logik (samma som i script.js).
 * Kör: npm test
 */
import test from "node:test";
import assert from "node:assert";

// Samma prislista som i script.js (bookingPriceMap)
const BOOKING_PRICE_MAP = {
  "Steg 1": 4495,
  "Steg 2": null,
  "AdBlue off": 4995,
  Decat: 1495,
  "DPF OFF": 2995,
  "Cylinder OFF": 1895,
  "EGR OFF": 1995,
  "Pops & Bangs": 2495,
  "Pops & Bangs med AV/PÅ": 3495,
  "Cold start Delete": 949,
  "Växellåda Steg 1": 3495,
  "Växellåda Steg 2": 3995,
  "Exteriör rekond": 2000,
  "Interiör rekond": 2000,
  Lackkorrigering: 2000,
  "Keramiskt lackskydd": 2000,
  Motorrestaurering: 2000,
};

function totalPriceFromServices(checkedServices) {
  let total = 0;
  for (const val of checkedServices) {
    const p = BOOKING_PRICE_MAP[val];
    if (typeof p === "number") total += p;
  }
  return total;
}

function buildMessageParts(registration, servicesText, extra) {
  return [
    registration && "Registreringsnummer: " + registration,
    servicesText && "Önskade tjänster: " + servicesText,
    extra && "Ytterligare information: " + extra,
  ].filter(Boolean);
}

function buildLeadPayload({ name, email, phone, messageStr, totalPrice, registration, servicesText }) {
  const leadPayload = { name, email };
  if (phone) leadPayload.phone = phone;
  if (messageStr) leadPayload.message = messageStr;
  if (totalPrice > 0) leadPayload.possible_price = totalPrice;
  const extraFields = {};
  if (registration) extraFields.x_studio_registration_number = registration;
  if (servicesText) extraFields.x_studio_desired_services = servicesText;
  if (Object.keys(extraFields).length > 0) leadPayload.extra_fields = extraFields;
  return leadPayload;
}

function starsHtml(rating) {
  const n =
    typeof rating === "number" && !isNaN(rating)
      ? Math.round(Math.max(0, Math.min(5, rating)))
      : 5;
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// ---- Tests: prisberäkning ----
test("totalPriceFromServices: summar endast numeriska priser, hoppar över null", () => {
  assert.strictEqual(totalPriceFromServices([]), 0);
  assert.strictEqual(totalPriceFromServices(["Steg 2"]), 0);
  assert.strictEqual(totalPriceFromServices(["Steg 1"]), 4495);
  assert.strictEqual(
    totalPriceFromServices(["Steg 1", "Steg 2", "AdBlue off"]),
    4495 + 0 + 4995
  );
  assert.strictEqual(
    totalPriceFromServices(["Exteriör rekond", "Interiör rekond"]),
    4000
  );
});

test("totalPriceFromServices: okänd tjänst ger 0 för den", () => {
  assert.strictEqual(totalPriceFromServices(["Okänd"]), 0);
});

// ---- Tests: meddelande (message) ----
test("buildMessageParts: slår ihop regnr, tjänster, extra", () => {
  const parts = buildMessageParts("ABC123", "Steg 1, AdBlue off", "Vill ha kvitto");
  assert.strictEqual(parts.length, 3);
  assert.ok(parts[0].includes("ABC123"));
  assert.ok(parts[1].includes("Steg 1"));
  assert.ok(parts[2].includes("Vill ha kvitto"));
});

test("buildMessageParts: utelämnar tomma fält", () => {
  assert.deepStrictEqual(buildMessageParts("", "", ""), []);
  assert.deepStrictEqual(buildMessageParts("A1", "", ""), ["Registreringsnummer: A1"]);
});

// ---- Tests: lead-payload ----
test("buildLeadPayload: name och email krävs, övrigt valfritt", () => {
  const p = buildLeadPayload({
    name: "Anna",
    email: "anna@test.se",
    phone: "",
    messageStr: "",
    totalPrice: 0,
    registration: "",
    servicesText: "",
  });
  assert.strictEqual(p.name, "Anna");
  assert.strictEqual(p.email, "anna@test.se");
  assert.ok(!("phone" in p));
  assert.ok(!("message" in p));
  assert.ok(!("possible_price" in p));
  assert.ok(!("extra_fields" in p));
});

test("buildLeadPayload: possible_price sätts endast om totalPrice > 0", () => {
  const p = buildLeadPayload({
    name: "B",
    email: "b@b.se",
    phone: "",
    messageStr: "",
    totalPrice: 5000,
    registration: "",
    servicesText: "",
  });
  assert.strictEqual(p.possible_price, 5000);
});

test("buildLeadPayload: extra_fields innehåller x_studio_registration_number och x_studio_desired_services", () => {
  const p = buildLeadPayload({
    name: "C",
    email: "c@c.se",
    phone: "0701234567",
    messageStr: "Registreringsnummer: XYZ\nÖnskade tjänster: Steg 1",
    totalPrice: 4495,
    registration: "XYZ",
    servicesText: "Steg 1",
  });
  assert.strictEqual(p.extra_fields.x_studio_registration_number, "XYZ");
  assert.strictEqual(p.extra_fields.x_studio_desired_services, "Steg 1");
});

// ---- Tests: Google-reviews (stjärnor) ----
test("starsHtml: avrundar rating 0–5 till heltal stjärnor", () => {
  assert.strictEqual(starsHtml(5), "★★★★★");
  assert.strictEqual(starsHtml(4.4), "★★★★☆");
  assert.strictEqual(starsHtml(4.6), "★★★★★");
  assert.strictEqual(starsHtml(0), "☆☆☆☆☆");
  assert.strictEqual(starsHtml(1), "★☆☆☆☆");
});

test("starsHtml: ogiltig rating ger 5 stjärnor som fallback", () => {
  assert.strictEqual(starsHtml(NaN), "★★★★★");
  assert.strictEqual(starsHtml(undefined), "★★★★★");
});

// ---- Tests: Google-reviews API-svar (form) ----
test("Google reviews response shape: rating, user_ratings_total, reviews[] med author_name, rating, text", () => {
  const mockResponse = {
    rating: 5,
    user_ratings_total: 7,
    reviews: [
      {
        author_name: "Test Användare",
        rating: 5,
        text: "Bra service!",
        relative_time_description: "för 2 veckor sedan",
      },
    ],
  };
  assert.strictEqual(typeof mockResponse.rating, "number");
  assert.strictEqual(typeof mockResponse.user_ratings_total, "number");
  assert.ok(Array.isArray(mockResponse.reviews));
  for (const r of mockResponse.reviews) {
    assert.ok(typeof r === "object");
    assert.ok(typeof r.author_name === "string");
    assert.ok(typeof r.rating === "number");
    assert.ok(typeof r.text === "string");
    assert.ok(typeof r.relative_time_description === "string");
  }
});
