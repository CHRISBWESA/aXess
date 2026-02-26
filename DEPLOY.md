# Deploy aXess: Frontend on Vercel, Backend on Render

## 1. Deploy backend to Render

1. Go to [render.com](https://render.com) and sign in (or use GitHub).
2. **New** → **Web Service**.
3. Connect your GitHub repo **CHRISBWESA/aXess**.
4. Configure:
   - **Name:** `axess-backend` (or any name).
   - **Root Directory:** `axess-backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. **Environment** variables (add each):

   | Key           | Value |
   |---------------|--------|
   | `MONGO_URI`   | Your Atlas URI (same as in `.env`, with `ssl=true`) |
   | `JWT_SECRET`  | A long random string (e.g. generate one) |
   | `FRONTEND_URL`| Your Vercel app URL (e.g. `https://axess.vercel.app`) — **set after deploying frontend** |
   | `EMAIL_USER`  | Your Gmail (for emails) |
   | `EMAIL_PASS`  | Gmail App Password |

   Do **not** set `PORT`; Render sets it automatically.

6. Click **Create Web Service**. Wait for the first deploy.
7. Copy your backend URL, e.g. **`https://axess-backend.onrender.com`**.

Notes:
- Free tier sleeps after ~15 min inactivity; first request after sleep can take 30–60 seconds.
- For multiple frontend origins (e.g. Vercel previews), set `FRONTEND_URL` to comma-separated URLs.

---

## 2. Deploy frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (or use GitHub).
2. **Add New** → **Project** → import **CHRISBWESA/aXess**.
3. Configure:
   - **Root Directory:** `axess-frontend` (click **Edit** and set to `axess-frontend`).
   - **Framework Preset:** Vite (should be auto-detected).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables** — add:

   | Key             | Value |
   |-----------------|--------|
   | `VITE_API_URL`  | Your Render backend URL + `/api`, e.g. `https://axess-backend.onrender.com/api` |

5. Click **Deploy**. Wait for the build.
6. Copy your frontend URL, e.g. **`https://axess.vercel.app`** (or the one Vercel gives you).

---

## 3. Connect frontend and backend

1. **Render (backend):** Open your service → **Environment** → set **`FRONTEND_URL`** to your Vercel URL (e.g. `https://axess.vercel.app`). Save; Render will redeploy if needed.
2. **Vercel (frontend):** You already set `VITE_API_URL` to the Render API URL. No change unless you use a new backend URL.

---

## 4. Quick reference

| Item        | Where |
|------------|--------|
| Backend URL | Render dashboard → your service → URL (e.g. `https://axess-backend.onrender.com`) |
| Frontend URL | Vercel dashboard → your project → URL (e.g. `https://axess.vercel.app`) |
| API base for frontend | Backend URL + `/api` (e.g. `https://axess-backend.onrender.com/api`) |
| CORS on backend | Set `FRONTEND_URL` to the Vercel app URL (or comma-separated list). |

---

## 5. Local development

- **Frontend:** In `axess-frontend`, do **not** set `VITE_API_URL` in `.env` so the app uses `/api` and the Vite proxy to `http://localhost:5000`.
- **Backend:** In `axess-backend`, use your existing `.env` with `FRONTEND_URL=http://localhost:5173`.
