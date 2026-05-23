# Vercel Deployment Setup Guide

This project is now configured for Vercel deployment. Follow these steps to deploy:

## Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel
- Backend API deployed and accessible (e.g., `https://your-api-domain.com`)

## Step 1: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variables for your deployment environment:

```
VITE_API_URL=https://your-api-domain.com
PROGRESS_API_ORIGIN=https://your-api-domain.com
```

Replace `https://your-api-domain.com` with your actual backend API URL.

## Step 2: Deploy to Vercel

### Option A: Auto-deploy (Recommended)
1. Push your code to GitHub
2. Vercel will automatically build and deploy on push

### Option B: Manual Deploy
```bash
npm install -g vercel
vercel --prod
```

## Step 3: Verify Deployment

After deployment:
1. Open your Vercel project URL (e.g., `https://your-project.vercel.app`)
2. Navigate to `/dashboard.html`
3. The dashboard should load and connect to your backend API

## Project Structure

```
.
├── vercel.json              # Vercel configuration
├── .env.production          # Production environment variables template
├── .env.example             # Development environment template
├── vite.config.js          # Vite configuration (uses env variables)
├── dashboard.html          # Admin dashboard (uses VITE_API_URL)
└── src/                    # React app source
```

## Configuration Files

### vercel.json
- Build command: `vite build`
- Output directory: `dist`
- Framework: Vite

### Dashboard API URL Resolution
The dashboard uses this priority order:
1. `window.ENV?.API_URL` (set by Vercel)
2. `import.meta.env.VITE_API_URL` (from environment variables)
3. `http://localhost:3101` (fallback for local dev)

## Troubleshooting

### Dashboard returns 404
- Ensure `vercel.json` is in the root directory
- Check that environment variables are set correctly in Vercel dashboard

### API requests fail after deployment
- Verify the API URL in Vercel environment variables
- Check CORS configuration on your backend API
- Ensure your backend API domain is accessible from the internet

### Build fails
- Run `npm run build` locally to test
- Check that all dependencies are installed: `npm install`
- Verify Node.js version compatibility (18+ recommended)

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (runs Vite + Node server)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Notes

- `server.js` is only for local development (Vercel doesn't run long-lived servers)
- Dashboard connects to backend API via environment variables
- All secrets should be stored in Vercel's environment variables, never in code
