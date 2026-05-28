# 🌐 Lingua Platform

منصة أكاديمية لتعليم اللغات — Node.js + Stripe + Google Auth + Face ID

## التقنيات
- Backend: Node.js + Express
- Database: PostgreSQL (Supabase)
- Payment: Stripe
- Auth: Email + Google OAuth + WebAuthn (Face ID)

## تشغيل المشروع
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## API
- POST /auth/register
- POST /auth/login
- POST /auth/google
- POST /auth/webauthn/login-options
- GET  /products
- POST /stripe/checkout-session
- GET  /me/enrollments