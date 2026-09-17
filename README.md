# AdmitRoute AI (Вектор Поступления)
### Персональный AI-навигатор маршрута поступления в университеты
**Официальный кейс 02:** «Персональный маршрут поступления» · **Код участия:** `LOCUSCASE2` · LOCUS Startup Hackathon 2026

Продакшн: **https://university-route-741a.web.app** (Firebase Hosting + Cloud Functions + Firestore).

---

## 1. Что умеет продукт

| Блок | Возможности |
| :--- | :--- |
| **База знаний** | 77 университетов (Казахстан 25 · США/Канада 30 · Европа 11 · Азия 11): пороги, стипендии, дедлайны 2026/27, официальные ссылки и соцсети, безопасность района, оборудование, проекты, клубы, общежитие, климат/аллергены/питание, что комиссия ценит и не любит. **49 олимпиад и конкурсов** (Дарын, IZhO, IMO/IPhO/IOI, ISEF, WRO/FIRST, John Locke, Diamond Challenge, YYGS, FLEX…) с этапами, месяцами, стоимостью и «весом» для приёмных комиссий по регионам. |
| **AI (Gemini)** | Чат на казахском / английском / русском (отвечает на языке вопроса), **потоковый вывод** (первые слова через 2–3 с), **память** о человеке между сессиями, распознавание типа вопроса с **вычисленными фактами** (дни до дедлайнов, шансы, стоимость, ближайшие конкурсы — считает код, а не модель), **автопроверка**: числа и даты сверяются с базой и при расхождении ответ переписывается, для казахского — контроль чистоты языка; подсказки следующих вопросов; оценка ответов 👍/👎. **Полный анализ** профиля, **оценка портфолио** по 7 критериям для сферы и вузов, **AI-сравнение** университетов, **стратегия олимпиад**, **ревью эссе** с проверкой на соответствие реальному портфолио, анализ новостей и соцсетей вуза, чтение загруженных документов. Groq — резервный провайдер. |
| **Портфолио** | Олимпиады, проекты, исследования, лидерство, волонтёрство, стажировки, курсы, публикации — с уровнем, результатом, датами, ссылками и подтверждающим документом. Детерминированная оценка + AI-ревью: сильные стороны, пробелы, план действий (→ в задачи), рекомендуемые конкурсы, сюжеты для эссе. |
| **Олимпиады** | Каталог с фильтрами, персональный подбор (предметы, класс, направления, регионы, текущий уровень), календарь на 12 месяцев, «в задачи» / «в портфолио», AI-стратегия. |
| **Аккаунты** | Вход через Google в один клик (Firebase Auth → собственная сессия) или email + пароль без кода подтверждения. Профиль синхронизируется с сервером. |
| **Шансы, задачи, документы, маршрут** | Прозрачная модель вероятности с прогнозами «при балле X»; задачи с дедлайнами и статистикой «в срок»; чек-лист документов и загрузка сканов; roadmap, .ics, письмо с планом. |
| **Языки** | KK → EN → RU. Всё, что не покрыто словарями (динамические тексты движка, база знаний), переводится автоматически на сервере и кэшируется. |

---

## 2. Локальный запуск

Требования: **Node.js ≥ 22.13**, npm.

```bash
npm install
cp .env.example .env          # вставить GEMINI_API_KEY (и по желанию GROQ_API_KEY, Gmail SMTP)
npm run dev                   # фронт http://localhost:5173 + бэкенд http://127.0.0.1:3001
```

Локально данные лежат в SQLite (`server/data/`), файлы — на диске. Тот же код в облаке работает на Firestore.

### Переменные окружения (`.env`)

| Ключ | Назначение |
| :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio — основной AI-провайдер. **Только на сервере**, в браузер не попадает. |
| `GROQ_API_KEY` | резервный провайдер + Whisper для голосового ввода (необязательно). |
| `VITE_FIREBASE_*` | публичный web-конфиг Firebase для кнопки «Войти через Google». |
| `FIREBASE_PROJECT_ID` | проект, против которого проверяются Google ID-токены. |
| `FIREBASE_SERVICE_ACCOUNT`, `DB_DRIVER=firestore` | использовать Firestore с ноутбука (путь к JSON сервисного аккаунта). |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | SMTP для писем; без них OTP/письма не отправляются. |
| `OTP_REQUIRED` | `true` — требовать код при email-регистрации (по умолчанию выключено). |
| `GEMINI_SMART_MODELS` / `FAST` / `DEEP` | переопределить список моделей (через запятую); по умолчанию стабильные модели первыми, новые — резерв с автоматическим «остыванием» при 429/503. |

---

## 3. Деплой на Firebase

```bash
npm run secrets:set     # один раз: ключи из .env → Firebase Secret Manager
npm run deploy          # build → hosting + functions (europe-west1) + firestore rules
```

Что нужно в консоли Firebase (один раз):
1. **Тариф Blaze** (pay-as-you-go) — обязателен для Cloud Functions и Secret Manager; бесплатные квоты остаются.
2. **Authentication → Get started → Sign-in method → Google → Enable** — включает кнопку «Войти через Google».

Как устроено: `scripts/prepare-functions.mjs` копирует `server/` и `shared/` в `functions/` (чтобы `.env` с ключами никогда не уезжал в облако), Hosting переписывает `/api/**` на функцию `api`, данные — в Firestore (правила запрещают любой доступ клиентам; работает только Admin SDK), файлы — chunked-блобы в Firestore (или `FILE_STORAGE=gcs` при включённом Cloud Storage).

Запасной вариант без Blaze: бэкенд на Vercel (`api/index.js` + `vercel.json` уже настроены) с Firestore через `FIREBASE_SERVICE_ACCOUNT`, фронт — на Firebase Hosting с `VITE_API_URL=https://<project>.vercel.app`. На Vercel лимит тела запроса 4,5 МБ → `MAX_UPLOAD_MB=3`.

---

## 4. Архитектура

```
shared/                       единый источник данных для фронта и бэкенда
  data/universities/          77 вузов (+ .d.ts)
  data/olympiads.js           49 олимпиад и конкурсов
  data/portfolioRubrics.js    критерии портфолио, рубрики по 8 сферам, региональные нюансы
  data/admissionsKnowledge.js что ценят комиссии, типичные сложности, документы, планы подготовки
  logic/chance.js · dates.js  модель шансов, парсер дедлайнов
server/                       Express 5
  app.js · index.js · firebase.js   приложение · standalone-сервер · Cloud Function
  services/chat.service.js    диалог: интенты → вычисленные факты → поток → фактчек/ревизия → подсказки → память
  services/memory.service.js  долговременная память о пользователе (факты из разговоров)
  services/persona.js         системный промпт (стиль, честность, самопроверка)
  db/store.js                 единый документный интерфейс: sqliteStore (dev) / firestoreStore (prod)
  storage/files.js            файлы: local / firestore / gcs
  services/                   gemini.client · groq.client · llm (провайдер-роутер) · ai (промпты, JSON-схемы)
                              context (полный снимок пользователя для AI) · portfolio · olympiad
                              auth (Google + пароль, сессии) · document (MIME по байтам, AI-выжимка) · task · news · social · mail
  routes/                     auth · universities · ai · tasks · documents · portfolio · olympiads · mail
src/                          React 19 + Vite + Tailwind v4
  lib/api.ts · auth.ts · firebase.ts   клиент API, сессия, Google-вход
  i18n/                       словари + autoTranslate (авто-перевод всего непереведённого)
  components/                 PortfolioModal · OlympiadsModal · Step5Comparison (AI) · AIAssistantWidget · ui/Markdown …
```

### API (кратко)

| Метод | Путь | Описание |
| :--- | :--- | :--- |
| GET | `/api/health`, `/api/auth/config` | статус, публичная конфигурация |
| POST | `/api/auth/google` · `/register` · `/login` · `/logout`; DELETE `/api/auth/me` | аккаунты |
| GET/PUT | `/api/auth/profile` | анкета |
| GET | `/api/universities…`, `/:id/news/analysis`, `/:id/social/analysis`, POST `/:id/chance` | база, новости, шансы |
| POST | `/api/ai/chat` · `/chat/stream` (SSE) · `/feedback` · `/analyze` · `/compare` · `/essay-review` · `/translate` · `/transcribe` | AI |
| CRUD | `/api/portfolio`, POST `/api/portfolio/evaluate`, GET `/meta`, `/rubric/:field` | портфолио |
| GET/POST | `/api/olympiads`, `/recommend`, `/advice`, `/:id` | олимпиады |
| CRUD | `/api/tasks`, POST `/bulk`, `/generate` | задачи |
| GET/POST/DELETE | `/api/documents` (base64 JSON), `/checklist`, `/:id/download` | документы |

---

## 5. Безопасность

* Ключи AI только на сервере (локально `.env`, в облаке Secret Manager); фронтенд к провайдерам не обращается.
* Сессии — случайные 256-битные токены, в базе хранится только SHA-256; передаются только в заголовке `Authorization`.
* Пароли — scrypt; одинаковый ответ для неверного email и пароля; Google ID-токены проверяются Admin SDK (`checkRevoked`, `email_verified`).
* Загрузки: тип определяется по байтам, лимит размера, безопасные пути, скачивание только владельцем.
* Firestore rules — `allow read, write: if false` для клиентов; rate-limit на auth/AI/upload; CORS-белый список; security-заголовки.
* Ответы AI рендерятся собственным Markdown-рендерером без `innerHTML`.

---

## 6. Ограничения

* Gemini на бесплатном тарифе: лимиты RPM/RPD; при 429/503 модель «остывает» и запрос уходит к следующей, затем к Groq. В чате, если первый токен не пришёл за 12 с, запрос переезжает на следующую модель. Глубокие анализы (портфолио, сравнение) занимают 15–40 с; холодный старт функции добавляет 3–6 с (лечится опцией minInstances: 1 в server/firebase.js — платно).
* Instagram/TikTok блокируют анонимный доступ — сигналы частичные, это помечается в ответах.
* Оценки безопасности районов и часть статистики — экспертные оценки по открытым источникам; дедлайны — по правилам 2026/27, сверяйтесь с официальным порталом.
