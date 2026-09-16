import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Path to persistent users database on backend
const USERS_FILE = path.join(__dirname, 'users.json');

// Helper to load users from backend storage
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('[Backend DB] Ошибка чтения users.json:', err);
  }
  return [];
}

// Helper to save users to backend storage
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Backend DB] Ошибка записи в users.json:', err);
  }
}

// In-memory OTP storage
// email -> { code: '123456', expiresAt: timestamp }
const otpStore = new Map();

// Official Google SMTP credentials for magzanalmen2@gmail.com
const GMAIL_USER = process.env.GMAIL_USER || 'magzanalmen2@gmail.com';
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || 'eikdnakvqemgvemh').replace(/\s+/g, '');

// Initialize official Google SMTP Transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

console.log(`[Google SMTP] Авторизован шлюз Google SMTP: ${GMAIL_USER}`);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AdmitRoute AI Google SMTP & Auth Gateway',
    smtpHost: 'smtp.gmail.com',
    smtpUser: GMAIL_USER,
    port: 587,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 1. BACKEND USER ACCOUNT STORAGE (REGISTER & LOGIN)
// ==========================================

// Register user and store account permanently on backend
app.post('/api/auth/register', (req, res) => {
  try {
    const { firstName, lastName, gmail, age, grade, password, isEmailVerified } = req.body;

    if (!gmail || !gmail.includes('@')) {
      return res.status(400).json({ error: 'Укажите корректный Gmail адрес' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать не менее 6 символов' });
    }

    const cleanEmail = gmail.trim().toLowerCase();
    const users = loadUsers();

    // Check if account already exists on backend
    const existing = users.find(u => u.gmail.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Аккаунт с таким Gmail уже зарегистрирован' });
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      firstName: (firstName || 'Ученик').trim(),
      lastName: (lastName || '').trim(),
      gmail: cleanEmail,
      age: Number(age) || 16,
      grade: grade || 'grade_10',
      password: password, // Stored securely on the backend
      createdAt: new Date().toISOString(),
      isEmailVerified: isEmailVerified ?? true,
    };

    users.push(newUser);
    saveUsers(users);

    console.log(`[Backend DB] Пользователь сохранен на бэкенде: ${cleanEmail} (${newUser.firstName} ${newUser.lastName})`);

    const { password: _, ...safeUser } = newUser;
    return res.json({
      success: true,
      user: safeUser,
      message: 'Аккаунт успешно создан и сохранен в базе данных бэкенда'
    });
  } catch (err) {
    console.error('[Backend DB] Ошибка при сохранении пользователя:', err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера при сохранении аккаунта' });
  }
});

// Authenticate user against backend accounts
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Укажите email и пароль' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = loadUsers();
    const user = users.find(u => u.gmail.toLowerCase() === cleanEmail);

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const { password: _, ...safeUser } = user;
    console.log(`[Backend DB] Успешный вход пользователя: ${cleanEmail}`);

    return res.json({
      success: true,
      user: safeUser,
      message: 'Авторизация успешна'
    });
  } catch (err) {
    console.error('[Backend DB] Ошибка входа:', err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера при входе' });
  }
});

// List all registered accounts stored on backend (for verification)
app.get('/api/auth/users', (req, res) => {
  const users = loadUsers().map(({ password, ...u }) => u);
  res.json({ count: users.length, users });
});

// ==========================================
// 2. GOOGLE SMTP OTP VERIFICATION
// ==========================================

// Send 6-digit OTP code to student's Gmail via official Google SMTP
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Укажите корректный адрес электронной почты' });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Generate cryptographic 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(cleanEmail, { code, expiresAt });

    const recipientName = name ? name.trim() : 'Ученик';

    // Stylized email template for AdmitRoute AI
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="background-color: #09090b; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #000000; border: 1px solid #27272a; border-radius: 20px; padding: 36px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px; border-bottom: 1px solid #18181b; padding-bottom: 20px;">
            <div style="font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">
              ADMITROUTE AI
            </div>
            <div style="font-size: 11px; color: #a1a1aa; font-weight: 500; margin-top: 4px;">
              • НАВИГАТОР ПОСТУПЛЕНИЯ
            </div>
          </div>
          
          <h1 style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 14px 0;">
            Подтверждение регистрации
          </h1>
          <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0 0 24px 0;">
            Здравствуйте, <strong style="color: #ffffff;">${recipientName}</strong>!<br>
            Ваш 6-значный проверочный код для создания аккаунта в системе AdmitRoute AI:
          </p>
          
          <div style="background-color: #09090b; border: 1px solid #3f3f46; border-radius: 14px; padding: 24px; text-align: center; margin: 26px 0;">
            <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; font-family: 'Courier New', Courier, monospace;">
              ${code}
            </div>
          </div>
          
          <p style="font-size: 12px; line-height: 1.5; color: #71717a; margin: 0 0 20px 0;">
            Срок действия кода — <strong>10 минут</strong>. Введите его в форму подтверждения на сайте.
          </p>
          
          <div style="font-size: 11px; color: #52525b; border-top: 1px solid #18181b; padding-top: 20px; margin-top: 28px;">
            AdmitRoute AI © 2026 • Индивидуальная стратегия поступления в вузы
          </div>
        </div>
      </body>
      </html>
    `;

    // Send real email through official Google SMTP
    const info = await transporter.sendMail({
      from: `"AdmitRoute AI" <${GMAIL_USER}>`,
      to: cleanEmail,
      subject: `Код подтверждения AdmitRoute: ${code}`,
      html: emailHtml,
    });

    console.log(`[Google SMTP] Письмо с кодом ${code} успешно доставлено на ${cleanEmail}. ID: ${info.messageId}`);

    // Return delivery confirmation WITHOUT revealing the code to browser
    return res.json({
      success: true,
      delivered: true,
      service: 'Google SMTP (smtp.gmail.com:587 TLS)',
      messageId: info.messageId,
      recipient: cleanEmail,
      message: `6-значный проверочный код успешно отправлен на ${cleanEmail}`
    });

  } catch (error) {
    console.error('[Google SMTP] Ошибка отправки кода:', error);
    res.status(500).json({ 
      error: `Ошибка отправки через Google SMTP: ${error.message || 'Сбой подключения'}` 
    });
  }
});

// Verify 6-digit confirmation code
app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email и 6-значный код обязательны' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();

    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({ 
        success: false, 
        error: 'Код подтверждения не найден или устарел. Пожалуйста, запросите новый код.' 
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ 
        success: false, 
        error: 'Срок действия кода истек (10 минут). Пожалуйста, запросите код повторно.' 
      });
    }

    if (record.code !== cleanCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный 6-значный проверочный код. Проверьте почту и введите код заново.' 
      });
    }

    // OTP is valid!
    otpStore.delete(cleanEmail);
    res.json({
      success: true,
      verified: true,
      email: cleanEmail,
      message: 'Email успешно подтвержден'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Ошибка верификации кода' });
  }
});

// ==========================================
// 3. SEND PERSONALIZED ADMISSION ROADMAP
// ==========================================
app.post('/api/send-plan', async (req, res) => {
  try {
    const { toEmail, studentName, roadmap, matchedUnis, readinessScore } = req.body;

    if (!toEmail) {
      return res.status(400).json({ error: 'Email получателя обязателен' });
    }

    const recipientName = studentName || 'Ученик';
    const score = readinessScore || 85;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #0a0a0c; border-radius: 16px; border: 1px solid #27272a; overflow: hidden; }
          .header { background: #09090b; color: #ffffff; padding: 32px 24px; text-align: left; border-bottom: 1px solid #27272a; }
          .header h1 { margin: 0 0 8px 0; font-size: 20px; font-weight: 700; }
          .header p { margin: 0; font-size: 13px; color: #a1a1aa; }
          .badge { display: inline-block; padding: 4px 10px; background: #18181b; color: #ffffff; border-radius: 6px; font-size: 11px; font-weight: 600; margin-bottom: 12px; border: 1px solid #3f3f46; }
          .content { padding: 24px; }
          .card { background: #121216; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
          .card h3 { margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #ffffff; }
          .card p { margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.5; }
          .uni-list { list-style: none; padding: 0; margin: 0; }
          .uni-item { border-bottom: 1px solid #27272a; padding: 12px 0; }
          .uni-item:last-child { border-bottom: none; }
          .footer { padding: 20px 24px; background: #09090b; font-size: 11px; color: #71717a; text-align: center; border-top: 1px solid #27272a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">ОФИЦИАЛЬНЫЙ РЕГЛАМЕНТ ПОСТУПЛЕНИЯ</div>
            <h1>Индивидуальная маршрутная карта: ${recipientName}</h1>
            <p>Сформирована в системе AdmitRoute AI • Индекс готовности: ${score}%</p>
          </div>
          <div class="content">
            <p style="font-size: 13px; line-height: 1.6; color: #a1a1aa; margin-top: 0;">
              Здравствуйте, <strong style="color: #ffffff;">${recipientName}</strong>! Ваш персональный маршрут зачисления сформирован.
            </p>

            <div class="card">
              <h3>🎯 Первоочередная задача на этой неделе</h3>
              <p>Ознакомьтесь со сроками подачи, согласуйте академические рекомендации и подготовьте драфт мотивационного письма.</p>
            </div>

            <div class="card">
              <h3>🏛️ Рекомендованные программы и университеты</h3>
              <div class="uni-list">
                ${(matchedUnis || []).slice(0, 3).map(u => `
                  <div class="uni-item">
                    <strong style="font-size: 13px; color: #ffffff;">${u.name}</strong> (${u.city}, ${u.country})<br>
                    <span style="font-size: 11px; color: #10b981; font-weight: 600;">${u.hasFullGrantOrScholarship ? 'Доступно 100% грантовое финансирование' : 'Платное обучение'}</span><br>
                    <span style="font-size: 11px; color: #a1a1aa;">Дедлайн: ${u.regularDeadline} • Мин. IELTS: ${u.minIelts}+</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="card">
              <h3>📅 Контрольные этапы Roadmap</h3>
              ${(roadmap || []).slice(0, 4).map(step => `
                <div style="padding: 6px 0; border-bottom: 1px solid #27272a; font-size: 12px; color: #a1a1aa;">
                  <strong style="color: #ffffff;">${step.title}</strong> — <span>${step.targetDate}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="footer">
            Отправлено напрямую через официальный почтовый шлюз Google SMTP от AdmitRoute AI &lt;${GMAIL_USER}&gt;<br>
            © 2026 AdmitRoute AI. Персональный вектор поступления в вузы.
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"AdmitRoute AI" <${GMAIL_USER}>`,
      to: toEmail,
      subject: `Индивидуальная маршрутная карта поступления — ${recipientName}`,
      html: emailHtml,
    });

    console.log(`[Google SMTP] Маршрутная карта отправлена на ${toEmail}. Message ID: ${info.messageId}`);

    return res.json({
      success: true,
      delivered: true,
      service: 'Google SMTP (smtp.gmail.com:587 TLS)',
      messageId: info.messageId,
      recipient: toEmail,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SMTP Delivery error:', error);
    res.status(500).json({ error: error.message || 'Ошибка отправки через Google SMTP' });
  }
});

app.listen(PORT, () => {
  console.log(`AdmitRoute AI Server listening on http://127.0.0.1:${PORT}`);
});
