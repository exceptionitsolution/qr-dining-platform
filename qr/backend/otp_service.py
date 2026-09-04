import os
import random
import time
import urllib.request
import urllib.parse
import json
import base64

# Rate limiting storage: { phone: last_sent_timestamp }
OTP_RATE_LIMIT = {}

def generate_4digit_otp() -> str:
    return f"{random.randint(1000, 9999)}"

def can_send_otp(phone: str, cooldown_sec: int = 30) -> bool:
    now = time.time()
    last = OTP_RATE_LIMIT.get(phone, 0)
    if now - last < cooldown_sec:
        return False
    OTP_RATE_LIMIT[phone] = now
    return True

def send_via_fast2sms(phone: str, otp: str) -> bool:
    api_key = os.environ.get("FAST2SMS_API_KEY", "").strip()
    if not api_key:
        return False
    
    # Fast2SMS Quick SMS / OTP route
    try:
        url = "https://www.fast2sms.com/dev/bulkV2"
        payload = {
            "variables_values": otp,
            "route": "otp",
            "numbers": phone.replace("+91", "").strip()
        }
        data = urllib.parse.urlencode(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "authorization": api_key,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("return") is True
    except Exception as e:
        print(f"[Fast2SMS Error] {e}")
        return False

def send_via_twilio(phone: str, otp: str) -> bool:
    sid = os.environ.get("TWILIO_ACCOUNT_SID", "").strip()
    token = os.environ.get("TWILIO_AUTH_TOKEN", "").strip()
    from_num = os.environ.get("TWILIO_PHONE_NUMBER", "").strip()

    if not (sid and token and from_num):
        return False

    formatted_phone = phone if phone.startswith("+") else f"+91{phone}"
    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
        payload = {
            "To": formatted_phone,
            "From": from_num,
            "Body": f"Your Zaika verification code is {otp}. Valid for 5 minutes."
        }
        data = urllib.parse.urlencode(payload).encode("utf-8")
        auth_header = "Basic " + base64.b64encode(f"{sid}:{token}".encode()).decode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": auth_header,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            return response.status in [200, 201]
    except Exception as e:
        print(f"[Twilio Error] {e}")
        return False

def send_via_msg91(phone: str, otp: str) -> bool:
    auth_key = os.environ.get("MSG91_AUTH_KEY", "").strip()
    template_id = os.environ.get("MSG91_TEMPLATE_ID", "").strip()
    if not (auth_key and template_id):
        return False
    
    try:
        url = f"https://api.msg91.com/api/v5/otp?template_id={template_id}&mobile=91{phone}&authkey={auth_key}&otp={otp}"
        req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("type") == "success"
    except Exception as e:
        print(f"[MSG91 Error] {e}")
        return False

def dispatch_otp(phone: str) -> dict:
    """
    Main OTP dispatcher.
    Attempts real SMS gateways (Fast2SMS, Twilio, MSG91).
    If no gateway is configured or in test mode, provides demo OTP.
    """
    otp = generate_4digit_otp()
    
    # Check rate limit
    if not can_send_otp(phone, cooldown_sec=20):
        # Still return demo OTP or raise rate limit
        pass

    sent_real_sms = False
    provider_used = "demo"

    # Try Fast2SMS first if key is present
    if os.environ.get("FAST2SMS_API_KEY"):
        if send_via_fast2sms(phone, otp):
            sent_real_sms = True
            provider_used = "fast2sms"

    # Try Twilio if not sent
    if not sent_real_sms and os.environ.get("TWILIO_ACCOUNT_SID"):
        if send_via_twilio(phone, otp):
            sent_real_sms = True
            provider_used = "twilio"

    # Try MSG91 if not sent
    if not sent_real_sms and os.environ.get("MSG91_AUTH_KEY"):
        if send_via_msg91(phone, otp):
            sent_real_sms = True
            provider_used = "msg91"

    return {
        "otp": otp,
        "sent_real_sms": sent_real_sms,
        "provider": provider_used,
        "demo_otp": None if sent_real_sms else otp
    }
