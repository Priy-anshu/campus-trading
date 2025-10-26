# GitHub Pages Deployment Configuration

## Build Command
```bash
npm run build
```

## Publish Directory
```
dist
```

## Environment Variables
- VITE_API_URL: https://campus-trading-backend.onrender.com/api

## Steps to Deploy:
1. Go to GitHub repository Settings
2. Scroll to "Pages" section
3. Source: "GitHub Actions"
4. Create workflow file in .github/workflows/deploy.yml
