# إعداد Google Sign-In

1. اذهب إلى https://console.cloud.google.com
2. APIs & Services → Credentials → OAuth client ID
3. اختر Web application
4. Authorized origins: http://localhost:3000
5. احفظ Client ID
6. ضعه في auth.html و .env

# WebAuthn (Face ID)
- يعمل تلقائياً على iOS/Android/macOS
- يحتاج HTTPS في الإنتاج
- في .env:
  WEBAUTHN_RP_ID=yourdomain.com
  WEBAUTHN_RP_ORIGIN=https://yourdomain.com