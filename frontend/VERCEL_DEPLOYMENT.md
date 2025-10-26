# Vercel Deployment Guide

## Environment Variables to Set in Vercel Dashboard:

1. Go to your project in Vercel Dashboard
2. Go to Settings → Environment Variables
3. Add these variables:

```
VITE_API_URL = https://campus-trading-backend.onrender.com/api
VITE_APP_NAME = Campus Trading
VITE_APP_VERSION = 1.0.0
```

## Deployment Steps:

1. Connect your GitHub repository to Vercel
2. Set Root Directory to: `frontend`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Install Command: `npm install`

## Configuration Files Ready:

- ✅ `vercel.json` - Vercel configuration
- ✅ `netlify.toml` - Kept for future Netlify use
- ✅ `package.json` - Build scripts ready

## After Deployment:

- Your app will be available at: `https://your-project-name.vercel.app`
- Auto-deploys on every push to main branch
- Preview deployments for pull requests
