const { Pool } = require('pg');

// نقرأ الرابط من ملف .env
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
family: 4, // لضمان استخدام IPv4 وهو الأنسب لـ Neon
});

// إنشاء الجدول إذا لم يكن موجوداً
pool.query(`
  CREATE TABLE IF NOT EXISTS konami_requests (
    id SERIAL PRIMARY KEY,
    konami_email TEXT NOT NULL,
    konami_password TEXT NOT NULL,
    verification_code TEXT DEFAULT NULL,
    status TEXT DEFAULT 'قيد المعالجة',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => console.log('✅ تم الاتصال بقاعدة بيانات Neon')).catch(err => console.error('❌ خطأ في الاتصال:', err));

module.exports = {
  query: (text, params) => pool.query(text, params)
};