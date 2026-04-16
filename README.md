# 🌊 AquaVision AI — Upgraded v2.0

**Underwater Animal Identification Platform**  
Hybrid CNN + Quantum VQC · 97.4% Accuracy · 120+ Marine Species

---

## ✨ What's New in v2

| Feature | v1 (Original) | v2 (Upgraded) |
|---|---|---|
| Login Page | ❌ None | ✅ Animated Split-Panel |
| Registration | ❌ None | ✅ With validation |
| Auth Guard | ❌ None | ✅ Token-based sessions |
| Bubble BG | Basic canvas | ✅ Glowing 3D bubbles |
| Light Rays | ❌ | ✅ Conic-gradient rays |
| User Badge | ❌ | ✅ Navbar avatar + logout |
| Form Slide | ❌ | ✅ Smooth slide animation |
| Backend Auth | ❌ | ✅ Register/Login/Logout APIs |

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
pip install flask flask-cors pillow numpy
```

### 2. Run the server
```bash
cd aquavision_upgraded
python app.py
```

### 3. Open in browser
```
http://localhost:5000
```
You'll land on the animated login page. Register a new account, then you'll be redirected to the full AquaVision dashboard.

---

## 📁 Project Structure

```
aquavision_upgraded/
├── app.py              ← Flask backend (auth + ML APIs)
├── login.html          ← 🆕 Animated login/register page
├── index.html          ← Main dashboard (auth-guarded)
├── requirements.txt
├── css/
│   └── style.css       ← Dashboard styles + auth additions
└── js/
    ├── auth.js         ← 🆕 Session management + guard
    ├── app.js          ← Main dashboard logic (unchanged)
    ├── charts.js       ← Chart rendering (unchanged)
    └── data.js         ← Species data helpers (unchanged)
```

---

## 🔐 Auth API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login, returns token |
| POST | `/api/auth/logout` | Invalidate session |
| GET  | `/api/auth/me` | Get current user info |

**Request format (register):**
```json
{
  "username": "ocean_explorer",
  "email": "you@example.com",
  "password": "mypassword"
}
```

**Response:**
```json
{
  "success": true,
  "token": "<32-byte hex token>",
  "user": { "username": "ocean_explorer", "email": "...", "avatar": "O" }
}
```

Token is stored in `localStorage` as `av_token` and sent via `X-Auth-Token` header on every request.

---

## 🌊 Login Page Features

- **Animated bubbles** — canvas-based glowing bubbles with wobble physics
- **Light rays** — conic-gradient ocean light shafts
- **Split layout** — Welcome panel + sliding form panel
- **Form sliding** — smooth CSS cubic-bezier slide between Login ↔ Register
- **Real-time validation** — inline field errors before API call
- **Loading states** — spinner replaces button text during request
- **Auto-redirect** — already logged-in users skip to dashboard
- **Keyboard support** — Enter key submits active form
- **Floating fish** — decorative animated emoji in welcome panel
- **Seafloor glow** — bottom edge gradient

---

## 🎨 Design System

```
Colors:
  --cyan   #00f5d4   Primary accent
  --blue   #3b82f6   Secondary accent  
  --purple #8b5cf6   Tertiary
  --deep   #030d1a   Background base

Fonts:
  Exo 2        — Headings (login page)
  Syne         — Display (dashboard)
  DM Sans      — Body
  JetBrains Mono — Code/data
```

---

## 🧪 ML Endpoints (unchanged)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict` | Run CNN+VQC prediction |
| GET  | `/api/samples` | Sample underwater images |
| GET  | `/api/species` | Full species database |
| GET  | `/api/dashboard` | All chart data |
| GET  | `/api/charts/roc` | ROC curves |
| GET  | `/api/charts/confusion-matrix` | Confusion matrix |
| GET  | `/api/charts/accuracy` | Training history |
| GET  | `/api/viva` | Viva Q&A data |

---

## 📝 Notes

- User data is stored **in-memory** — restarts clear all accounts. For production, replace `_users` dict with SQLite/PostgreSQL.
- Sessions are token-based (`X-Auth-Token` header). No cookies required.
- All original ML logic is 100% preserved.
