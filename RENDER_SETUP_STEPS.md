# 🚀 Quick Render Deployment Steps

## ✅ Step 1: Code Pushed to GitHub
Your code is now at: https://github.com/toayushh/CareConnect

---

## 📋 Step 2: Deploy on Render

### A. Sign Up / Login to Render
1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

### B. Create PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `leapfrog-db`
   - **Database**: `leapfrog`
   - **User**: `leapfrog`
   - **Region**: Oregon (US West)
   - **Plan**: **Free**
3. Click **"Create Database"**
4. Wait 2-3 minutes for creation
5. **Copy the "Internal Database URL"** (you'll need this)

### C. Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `toayushh/CareConnect`
3. Configure:
   - **Name**: `leapfrog-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT wsgi:app`
   - **Plan**: **Free**

### D. Set Environment Variables
Click **"Advanced"** → **"Add Environment Variable"** and add these:

```
FLASK_ENV=production
SECRET_KEY=leapfrog-secret-key-2024
JWT_SECRET_KEY=leapfrog-jwt-secret-key-2024
ENCRYPTION_KEY=l844JVn_PjcGh63YweLgFaFJ8jHWQFgOOX2NnVBGHr8=
DATABASE_URL=<paste-internal-database-url-from-step-B>
CORS_ORIGINS=https://major-project-psi-six.vercel.app
```

**Important**: Replace `<paste-internal-database-url-from-step-B>` with the actual URL you copied in Step B.

### E. Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Your backend will be at: `https://leapfrog-backend.onrender.com`

---

## 🗄️ Step 3: Initialize Database

After deployment completes:

1. Go to your Render dashboard
2. Click on **"leapfrog-backend"** service
3. Click **"Shell"** tab (top right)
4. Run this command:
   ```bash
   python manage_db.py
   ```
5. Wait for "Database initialized successfully" message

---

## 🔗 Step 4: Update Frontend to Use Production Backend

### Option A: Using Environment Variable (Recommended)

1. In your project root, create `.env.production`:
   ```bash
   echo "VITE_API_URL=https://leapfrog-backend.onrender.com" > .env.production
   ```

2. Update `src/services/api.js` to use environment variable:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';
   ```

3. Redeploy to Vercel:
   ```bash
   vercel --prod
   ```

### Option B: Direct Update

1. Find your backend URL from Render dashboard
2. Edit `src/services/api.js`
3. Change the API_URL to your Render URL
4. Commit and push:
   ```bash
   git add src/services/api.js
   git commit -m "Update API URL for production"
   git push origin main
   ```
5. Vercel will auto-deploy

---

## ✅ Step 5: Test Your Deployment

### Test Backend
```bash
curl https://leapfrog-backend.onrender.com/health
```

Expected response:
```json
{"service": "LeapFrog Backend", "status": "healthy"}
```

### Test Frontend
1. Visit: https://major-project-psi-six.vercel.app
2. Try logging in with test credentials:
   - Email: `test@example.com`
   - Password: `test123`
3. Check browser console for errors

---

## 🎯 Quick Commands Reference

### Generate New Secret Keys (if needed)
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### View Render Logs
- Dashboard → Your Service → **"Logs"** tab

### Redeploy Backend
- Dashboard → Your Service → **"Manual Deploy"** → **"Deploy latest commit"**

### Update Environment Variables
- Dashboard → Your Service → **"Environment"** tab → Edit variables → **"Save Changes"**

---

## ⚠️ Important Notes

### Free Tier Limitations
- **Auto-sleep**: Service sleeps after 15 minutes of inactivity
- **Cold starts**: First request after sleep takes 30-60 seconds
- **Database**: 1GB storage limit
- **Hours**: 750 hours/month (enough for 24/7 if only one service)

### Keeping Service Awake (Optional)
Use a service like UptimeRobot or Cron-job.org to ping your backend every 10 minutes:
- URL to ping: `https://leapfrog-backend.onrender.com/health`
- Interval: 10 minutes

---

## 🐛 Troubleshooting

### Issue: Build Failed
**Check**: 
- Build logs in Render dashboard
- Make sure `requirements.txt` is in `backend/` directory
- Verify Python version compatibility

### Issue: Database Connection Error
**Solution**: 
- Verify `DATABASE_URL` is set correctly
- Make sure you used the **Internal Database URL**, not External
- Check database is in same region as web service

### Issue: CORS Error in Frontend
**Solution**: 
- Add your Vercel URL to `CORS_ORIGINS` environment variable
- Format: `https://major-project-psi-six.vercel.app` (no trailing slash)
- Redeploy after updating

### Issue: 502 Bad Gateway
**Solution**: 
- Check if service is running in Render dashboard
- View logs for errors
- Make sure start command is correct
- Verify port binding: `0.0.0.0:$PORT`

---

## 📊 Current Setup Summary

| Component | Status | URL |
|-----------|--------|-----|
| **GitHub Repo** | ✅ Pushed | https://github.com/toayushh/CareConnect |
| **Frontend** | ✅ Deployed | https://major-project-psi-six.vercel.app |
| **Backend** | ⏳ Pending | Will be `https://leapfrog-backend.onrender.com` |
| **Database** | ⏳ Pending | Create on Render |

---

## 🎉 Next Steps

1. ✅ **DONE**: Code pushed to GitHub
2. ⏭️ **NOW**: Go to https://render.com and follow steps above
3. ⏭️ **THEN**: Initialize database
4. ⏭️ **FINALLY**: Update frontend API URL and redeploy

---

**Estimated Time**: 15-20 minutes total

**Need help?** Check the full guide in `BACKEND_DEPLOYMENT_GUIDE.md`
