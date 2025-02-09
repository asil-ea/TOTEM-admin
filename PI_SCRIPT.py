import numpy as np
from pyzbar.pyzbar import decode
import cv2
from picamera2 import Picamera2
import RPi.GPIO as GPIO
import time
import pyotp
import firebase_admin
from firebase_admin import credentials, firestore

# Firebase Initialization
cred = credentials.Certificate("/home/asil/serviceAccountCredentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# GPIO Setup
LED_PIN = 17
GPIO.setmode(GPIO.BCM)
GPIO.setup(LED_PIN, GPIO.OUT)
GPIO.output(LED_PIN, GPIO.LOW)

# Camera Setup
picam2 = Picamera2()
camera_config = picam2.create_preview_configuration(
    main={"format": "YUV420", "size": (320, 240)}
)
picam2.configure(camera_config)
picam2.start()

print("QR Code Scanner initialized. Point the camera at a QR code.")

def blink_led(times, interval):
    """Blink LED a specified number of times with a specified interval"""
    for _ in range(times):
        GPIO.output(LED_PIN, GPIO.HIGH)
        time.sleep(interval)
        GPIO.output(LED_PIN, GPIO.LOW)
        time.sleep(interval)

def log_access(issuer, uid, access, info=None):
    """Log access attempt in Firestore"""
    start_time = time.time()
    log_ref = db.collection(issuer).document("access-logs").collection("data")
    log_data = {
        "timestamp": firestore.SERVER_TIMESTAMP,
        "uid": uid,
        "access": access,
        "info": info
    }
    log_ref.add(log_data)
    end_time = time.time()
    print(f"Log Access operation took: {end_time - start_time:.4f} seconds")

def verify_totp(secret, code):
    """Verify TOTP code with a time drift of 30 seconds"""
    start_time = time.time()
    totp = pyotp.TOTP(secret)
    current = totp.now()
    previous = totp.at(time.time() - 30)
    next_code = totp.at(time.time() + 30)
    end_time = time.time()
    print(f"TOTP Verification operation took: {end_time - start_time:.4f} seconds")
    return code in [current, previous, next_code]

def fetch_user_data(issuer, uid):
    """Fetch user data from Firestore, with caching"""

    start_time = time.time()
    user_ref = db.collection(issuer).document("users").collection("data").document(uid)
    user_doc = user_ref.get()
    end_time = time.time()
    print(f"Firestore query operation took: {end_time - start_time:.4f} seconds")

    if user_doc.exists:
        user_data = user_doc.to_dict()
        return user_data
    else:
        return None

try:
    while True:
        # Capture frame
        start_time = time.time()
        frame = picam2.capture_array()
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_YUV2GRAY_YV12)
        decoded_objects = decode(gray_frame)
        end_time = time.time()
        print(f"QR Code scanning operation took: {end_time - start_time:.4f} seconds")

        if decoded_objects:
            for obj in decoded_objects:
                qr_data = obj.data.decode("utf-8")
                print(f"Detected QR Code: {qr_data}")

                try:
                    # Parse QR code data
                    start_time = time.time()
                    code, uid, issuer = qr_data.split(":")
                    end_time = time.time()
                    print(f"QR Data parsing operation took: {end_time - start_time:.4f} seconds")

                    # Fetch user data from cache or Firestore
                    user_data = fetch_user_data(issuer, uid)

                    if user_data:
                        secret = user_data.get("secret")
                        is_user_active = user_data.get("active")

                        if is_user_active:
                            if secret and verify_totp(secret, code):
                                print("Access Granted")
                                # Blink LED for 3 seconds continuously if access is granted
                                GPIO.output(LED_PIN, GPIO.HIGH)
                                time.sleep(3)
                                GPIO.output(LED_PIN, GPIO.LOW)

                                # Log access granted
                                log_access(issuer, uid, access=True, info=None)
                            else:
                                print("Access Denied: Invalid Code")
                                # Blink LED 5 times quickly if access is denied
                                blink_led(5, 0.2)
                                # Log access denied due to invalid code
                                log_access(issuer, uid, access=False, info="Invalid code")
                        else:
                            print("Access Denied: Inactive user")
                            # Blink LED 5 times quickly if access is denied due to inactivity
                            blink_led(5, 0.2)
                            # Log access denied due to inactive user
                            log_access(issuer, uid, access=False, info="Inactive user")
                    else:
                        print("Access Denied: UID not found")
                        # Blink LED 5 times quickly if access is denied due to UID not found
                        blink_led(5, 0.2)
                        # Log access denied due to UID not found
                        log_access(issuer, uid, access=False, info="UID not found")

                except ValueError:
                    print("Invalid QR format. Expected format: CODE:UID:ISSUER")

        cv2.imshow("QR Code Scanner", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
        # Wait for 1 second before scanning again
        time.sleep(0.5)

except KeyboardInterrupt:
    print("Exiting...")

finally:
    GPIO.cleanup()
    picam2.stop()
    cv2.destroyAllWindows()
