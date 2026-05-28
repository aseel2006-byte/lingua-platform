-- Lingua Platform PostgreSQL Schema v2
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE user_role AS ENUM ('student','admin');
CREATE TYPE lang_code AS ENUM ('en','tr','zh');
CREATE TYPE cefr_level AS ENUM ('A0','A1','A2','B1','B2','C1','C2');
CREATE TYPE skill_type AS ENUM ('listening','speaking','reading','writing','pdf','audio','bundle');
CREATE TYPE order_status AS ENUM ('pending','paid','failed','refunded');

CREATE TABLE users (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT, password TEXT, role user_role NOT NULL DEFAULT 'student', google_id TEXT UNIQUE, google_picture TEXT, auth_provider TEXT NOT NULL DEFAULT 'email', avatar_url TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

CREATE TABLE products (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT NOT NULL, description TEXT, price NUMERIC(10,2) NOT NULL DEFAULT 0, original_price NUMERIC(10,2), lang lang_code NOT NULL, level cefr_level NOT NULL, skill skill_type NOT NULL, badge TEXT, is_free BOOLEAN NOT NULL DEFAULT false, is_featured BOOLEAN NOT NULL DEFAULT false, stripe_price_id TEXT, download_url TEXT, rating NUMERIC(3,2) DEFAULT 0, review_count INTEGER DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

CREATE TABLE orders (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES users(id), total NUMERIC(10,2) NOT NULL, status order_status NOT NULL DEFAULT 'pending', stripe_session TEXT UNIQUE, stripe_intent TEXT UNIQUE, refunded_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

CREATE TABLE order_items (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), order_id UUID NOT NULL REFERENCES orders(id), product_id UUID NOT NULL REFERENCES products(id), price NUMERIC(10,2) NOT NULL);

CREATE TABLE enrollments (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES users(id), product_id UUID NOT NULL REFERENCES products(id), progress NUMERIC(5,2) NOT NULL DEFAULT 0, completed BOOLEAN NOT NULL DEFAULT false, enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id,product_id));

CREATE TABLE reviews (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES users(id), product_id UUID NOT NULL REFERENCES products(id), rating INTEGER NOT NULL CHECK(rating>=1 AND rating<=5), comment TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id,product_id));

CREATE TABLE webauthn_credentials (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, credential_id TEXT NOT NULL UNIQUE, public_key TEXT NOT NULL, sign_count BIGINT NOT NULL DEFAULT 0, device_name TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_used_at TIMESTAMPTZ);

CREATE TABLE webauthn_challenges (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), challenge TEXT NOT NULL UNIQUE, user_id UUID REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL DEFAULT 'registration', expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes', used BOOLEAN NOT NULL DEFAULT false);

CREATE INDEX idx_products_lang ON products(lang);
CREATE INDEX idx_products_level ON products(level);
CREATE INDEX idx_products_skill ON products(skill);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_users_google ON users(google_id);
CREATE INDEX idx_webauthn_user ON webauthn_credentials(user_id);

-- Seed admin
INSERT INTO users(name,email,password,role)VALUES('Admin','admin@lingua.sa','$2b$12$CHANGE_ON_SETUP','admin');

-- Seed products
INSERT INTO products(title,description,price,original_price,lang,level,skill,badge,stripe_price_id,rating,review_count)VALUES
('الاستماع B1 — مواقف حياتية','24 تسجيل صوتي مع تمارين',89,120,'en','B1','listening','hot','price_listening_b1',4.9,128),
('المحادثة B1 — المطار والسفر','أدوار حياتية تفاعلية',75,99,'en','B1','speaking','new','price_speaking_b1',4.8,94),
('القراءة B1 — كتاب تفاعلي','PDF تفاعلي بتمارين',79,null,'en','B1','reading',null,'price_reading_b1',4.9,76),
('الكتابة B1 — رسائل ونصوص','تصحيح ذكي',79,null,'en','B1','writing',null,'price_writing_b1',4.7,61),
('قصص صوتية B1','قصص مجانية بصوت الأستاذ',0,null,'en','B1','audio','free',null,5.0,312),
('باقة B1 الكاملة','جميع مهارات B1',249,350,'en','B1','bundle',null,'price_bundle_b1',5.0,203),
('الإنجليزية الكاملة A0-C2','المنهج الأكاديمي المتكامل',399,799,'en','A0','bundle',null,'price_full_en',4.9,891);