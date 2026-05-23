# Frontend-Backend Separation for Vercel Deployment

## Architecture
```
Fhenix-Learn/                    # This directory (Frontend + API spec)
├── src/                         # React app (Vercel deployment)
├── dashboard.html              # Static HTML (Vercel deployment)
├── vite.config.js             # Frontend build config
├── vercel.json                # Frontend deployment config (Vercel only)
└── .env.production            # Frontend env vars

fhenix-learn-backend/          # NEW: Separate backend repo
├── server.js                  # Express backend (Railway/Render deployment)
├── package.json              # Backend dependencies
├── .env.backend              # Backend env vars
└── Dockerfile                # Optional: For containerized deployment
```

## Step 1: Deploy Frontend to Vercel

✅ Already configured. Push to GitHub and Vercel auto-deploys.

```bash
# Vercel builds this automatically
npm run build  # Output: dist/
```

## Step 2: Deploy Backend Separately

Choose ONE backend platform:

### Option A: Railway (⭐ Recommended - easiest)
1. Create account: https://railway.app
2. Connect GitHub
3. Deploy `server.js` project
4. Get deployment URL: `https://your-backend.railway.app`

### Option B: Render
1. Create account: https://render.com
2. New → Web Service
3. Connect your backend repo
4. Set build command: `npm install`
5. Set start command: `node server.js`
6. Get deployment URL: `https://your-backend.onrender.com`

### Option C: Heroku (free tier deprecated, but still works)
```bash
heroku login
heroku create your-fhenix-backend
git push heroku main
```

## Step 3: Update Frontend Environment

Add to Vercel dashboard (Settings → Environment Variables):

```
VITE_API_URL=https://your-backend.railway.app
PROGRESS_API_ORIGIN=https://your-backend.railway.app
```

## Backend Repository Structure

Create a new repo `fhenix-learn-backend` with:

```
fhenix-learn-backend/
├── server.js                      # Express app (no changes needed)
├── package.json                   # Dependencies
├── .env.example                   # Env template
├── Dockerfile                     # Optional for Railway/Render
├── railway.json                   # Optional: Railway config
└── README.md
```

### package.json (Backend only)
```json
{
  "name": "fhenix-learn-backend",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "engines": {
    "node": "18.x"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  }
}
```

### Dockerfile (Optional - for Railway/Render)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3101
CMD ["node", "server.js"]
```

### railway.json (for Railway)
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "always",
    "numReplicas": 1
  }
}
```

## Environment Variables

### Vercel (Frontend)
```
VITE_API_URL=https://your-backend-url.com
PROGRESS_API_ORIGIN=https://your-backend-url.com
```

### Backend (Railway/Render)
```
PORT=3101
NODE_ENV=production
FHENIX_LEARN_BADGE_ADDRESS=0x...
```

## Connection Flow

```
User Browser
    ↓
[Vercel Frontend] - VITE_API_URL → [Railway Backend]
    ↓
React App uses: import.meta.env.VITE_API_URL
```

## Deployment Checklist

- [ ] Frontend on Vercel:
  - [ ] GitHub repo connected
  - [ ] vercel.json configured
  - [ ] Environment variables set
  - [ ] Build succeeds: `npm run build`

- [ ] Backend deployed (Railway/Render/Heroku):
  - [ ] New repo with server.js
  - [ ] package.json with dependencies
  - [ ] Dockerfile (if needed)
  - [ ] Environment variables configured
  - [ ] Server running and accessible

- [ ] Integration:
  - [ ] Get backend URL (e.g., https://your-backend.railway.app)
  - [ ] Add VITE_API_URL to Vercel environment
  - [ ] Test dashboard API calls

## Testing

### Local
```bash
# Terminal 1: Backend
node server.js

# Terminal 2: Frontend
npm run dev
```

### Production
```bash
# Visit Vercel frontend URL
https://your-project.vercel.app/dashboard.html

# Dashboard should fetch from backend URL
# Check browser console (F12) for API calls
```

## Troubleshooting

### "Failed to fetch from API"
→ Check VITE_API_URL in Vercel environment variables

### "CORS error"
→ Backend needs `cors()` middleware (already in your server.js ✓)

### Backend won't start on Railway/Render
→ Check PORT environment variable (should default to 3101)

### Frontend builds but dashboard is 404
→ Ensure `dashboard.html` is in root and Vercel serves it
