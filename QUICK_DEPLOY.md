# Quick Start: Vercel Deployment

## TL;DR

**Frontend → Vercel** | **Backend → Railway/Render**

---

## Step 1️⃣ Frontend on Vercel (5 min)

1. Push your code to GitHub
2. Go to https://vercel.com → New Project → Import from Git
3. Select **Fhenix-Learn** repo
4. Click **Deploy** ✓

---

## Step 2️⃣ Backend on Railway (5 min)

1. Create new GitHub repo: `fhenix-learn-backend`
2. Copy these files from this project to new repo:
   - `server.js`
   - Copy template: `BACKEND_package.json.template` → `package.json`
   - Copy template: `BACKEND_railway.json.template` → `railway.json`
   - Create `.env` with your variables

3. Go to https://railway.app → New Project → GitHub
4. Select `fhenix-learn-backend` repo
5. Railway auto-deploys 🚀
6. Click "Generate Domain" to get your backend URL

---

## Step 3️⃣ Connect Frontend → Backend (2 min)

Get your Railway backend URL: `https://your-project.railway.app`

In Vercel dashboard:
- Project Settings → Environment Variables
- Add:
  ```
  VITE_API_URL=https://your-project.railway.app
  PROGRESS_API_ORIGIN=https://your-project.railway.app
  ```
- Redeploy

---

## ✅ Done!

Frontend: `https://your-project.vercel.app`
Backend: `https://your-project.railway.app`

Both auto-deploy on GitHub push.

---

## Files Created for Reference

- `BACKEND_SEPARATION.md` - Full technical guide
- `BACKEND_package.json.template` - Backend dependencies
- `BACKEND_Dockerfile.template` - Container setup (optional)
- `BACKEND_railway.json.template` - Railway config
- `.env.production` - Production env vars template
- `.env.example` - Dev env vars template
