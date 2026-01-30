"""
Small backend for Mek Performance booking form.
Receives POST from "Boka Tid" and can forward to email or store.
"""
import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.route("/api/booking", methods=["POST"])
def booking():
    """Accept booking form submission. Expects JSON with name, phone, email, registration, services, extra."""
    try:
        data = request.get_json(force=True, silent=True) or {}
        name = (data.get("name") or "").strip()
        phone = (data.get("phone") or "").strip()
        email = (data.get("email") or "").strip()
        registration = (data.get("registration") or "").strip()
        services = data.get("services") or []
        extra = (data.get("extra") or "").strip()

        if not name or not phone or not email:
            return jsonify({"error": "Namn, telefon och e-post krävs"}), 400

        payload = {
            "name": name,
            "phone": phone,
            "email": email,
            "registration": registration or "-",
            "services": services if isinstance(services, list) else [services],
            "extra": extra or "-",
        }
        logger.info("Booking received: %s", payload)

        # Optional: send email if env is set (e.g. SMTP or SendGrid)
        if os.environ.get("SEND_BOOKING_EMAIL") == "1":
            _send_booking_email(payload)

        return jsonify({"ok": True, "message": "Tack! Vi återkommer till dig."}), 200
    except Exception as e:
        logger.exception("Booking failed: %s", e)
        return jsonify({"error": "Något gick fel. Försök igen eller ring oss."}), 500


def _send_booking_email(payload):
    """Send booking to mek.performance@gmail.com if SMTP env vars are set."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    host = os.environ.get("SMTP_HOST")
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD")
    if not all([host, user, password]):
        logger.warning("SEND_BOOKING_EMAIL=1 but SMTP_HOST/USER/PASSWORD not set")
        return

    services_text = ", ".join(payload["services"]) if payload["services"] else "-"
    body = (
        f"Namn: {payload['name']}\n"
        f"Telefon: {payload['phone']}\n"
        f"E-post: {payload['email']}\n"
        f"Registreringsnummer: {payload['registration']}\n\n"
        f"Önskade tjänster: {services_text}\n\n"
        f"Ytterligare information:\n{payload['extra']}"
    )
    msg = MIMEMultipart()
    msg["Subject"] = f"Bokningsförfrågan från {payload['name']}"
    msg["From"] = user
    msg["To"] = "mek.performance@gmail.com"
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(host, 587) as s:
        s.starttls()
        s.login(user, password)
        s.send_message(msg)
    logger.info("Booking email sent to mek.performance@gmail.com")


@app.route("/api/health", methods=["GET"])
def health():
    """Simple health check for Railway."""
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
