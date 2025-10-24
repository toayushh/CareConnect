# 🚀 Backend Deployment Guide

## Option 1: Render (Recommended - Free Tier Available)

### Prerequisites
- GitHub account
- Render account (sign up at https://render.com)
- Your code pushed to GitHub

### Step-by-Step Deployment

#### 1. Push Your Code to GitHub
```bash
cd /Users/ankit/Downloads/dashboard\ 2
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### 2. Deploy on Render

**Method A: Using render.yaml (Automated)**

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`
5. Click **"Apply"**
6. Set environment variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - Other variables are auto-generated

**Method B: Manual Setup**

1. **Create PostgreSQL Database**
   - Go to https://dashboard.render.com
   - Click **"New +"** → **"PostgreSQL"**
   - Name: `leapfrog-db`
   - Plan: **Free**
   - Click **"Create Database"**
   - Copy the **Internal Database URL**

2. **Create Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Configure:
     - **Name**: `leapfrog-backend`
     - **Region**: Oregon (US West)
     - **Branch**: `main`
     - **Root Directory**: `backend`
     - **Runtime**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT wsgi:app`
     - **Plan**: **Free**

3. **Set Environment Variables**
   - Click **"Environment"** tab
   - Add these variables:
     ```
     FLASK_ENV=production
     SECRET_KEY=<generate-random-string>
     JWT_SECRET_KEY=<generate-random-string>
     DATABASE_URL=<paste-internal-database-url>
     GEMINI_API_KEY=<your-gemini-api-key>
     CORS_ORIGINS=https://major-project-psi-six.vercel.app
     ```

4. **Deploy**
   - Click **"Create Web Service"**
   - Wait for deployment (5-10 minutes)
   - Your backend URL: `https://leapfrog-backend.onrender.com`

#### 3. Initialize Database
After deployment, run migrations:
1. Go to your Render dashboard
2. Click on your web service
3. Go to **"Shell"** tab
4. Run:
   ```bash
   python manage_db.py
   ```

#### 4. Update Frontend API URL
Update your Vercel deployment to use the new backend URL:

```bash
# In your project root
cd /Users/ankit/Downloads/dashboard\ 2

# Create/update .env file for production
echo "VITE_API_URL=https://leapfrog-backend.onrender.com" > .env.production

# Redeploy to Vercel
vercel --prod
```

Or update `src/services/api.js` to use the production URL.

---

## Option 2: Railway (Easy, Free Tier)

### Steps:

1. **Sign up at https://railway.app**

2. **Create New Project**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository

3. **Add PostgreSQL**
   - Click **"+ New"** → **"Database"** → **"PostgreSQL"**

4. **Configure Backend Service**
   - Click on your service
   - Go to **"Settings"**
   - Set **Root Directory**: `backend`
   - Set **Start Command**: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT wsgi:app`

5. **Set Environment Variables**
   - Go to **"Variables"** tab
   - Add:
     ```
     FLASK_ENV=production
     SECRET_KEY=<random-string>
     JWT_SECRET_KEY=<random-string>
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     GEMINI_API_KEY=<your-key>
     CORS_ORIGINS=https://major-project-psi-six.vercel.app
     ```

6. **Deploy**
   - Railway auto-deploys
   - Get your URL from the **"Settings"** → **"Domains"**

---

## Option 3: Heroku (Paid)

### Steps:

1. **Install Heroku CLI**
   ```bash
   brew tap heroku/brew && brew install heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   cd backend
   heroku create leapfrog-backend
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set FLASK_ENV=production
   heroku config:set SECRET_KEY=$(openssl rand -hex 32)
   heroku config:set JWT_SECRET_KEY=$(openssl rand -hex 32)
   heroku config:set GEMINI_API_KEY=your-key-here
   heroku config:set CORS_ORIGINS=https://major-project-psi-six.vercel.app
   ```

5. **Create Procfile**
   ```bash
   echo "web: gunicorn --worker-class eventlet -w 1 wsgi:app" > Procfile
   ```

6. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

7. **Initialize Database**
   ```bash
   heroku run python manage_db.py
   ```

---

## Option 4: AWS/GCP/Azure (Advanced)

For production-grade deployment with more control, consider:
- **AWS**: Elastic Beanstalk or ECS
- **GCP**: App Engine or Cloud Run
- **Azure**: App Service

---

## Post-Deployment Checklist

### 1. Test Backend
```bash
# Replace with your deployed URL
curl https://your-backend-url.com/health

# Should return:
# {"service": "LeapFrog Backend", "status": "healthy"}
```

### 2. Update Frontend Environment Variables

Create `.env.production` in project root:
```env
VITE_API_URL=https://your-backend-url.com
```

### 3. Update API Service File

Edit `src/services/api.js`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 
                import.meta.env.PROD 
                  ? 'https://your-backend-url.com' 
                  : 'http://localhost:9000';
```

### 4. Redeploy Frontend
```bash
vercel --prod
```

### 5. Test Full Application
- Visit your Vercel URL
- Try logging in
- Check browser console for errors
- Verify API calls are going to production backend

---

## Important Notes

### Free Tier Limitations

**Render Free Tier:**
- ✅ 750 hours/month
- ✅ Auto-sleeps after 15 min inactivity
- ⚠️ Cold starts (30-60 seconds)
- ✅ PostgreSQL 1GB storage

**Railway Free Tier:**
- ✅ $5 credit/month
- ✅ No auto-sleep
- ✅ Faster than Render

### Required Environment Variables

```bash
# Required
FLASK_ENV=production
SECRET_KEY=<random-string>
JWT_SECRET_KEY=<random-string>
DATABASE_URL=<postgres-connection-string>

# Optional but recommended
GEMINI_API_KEY=<your-api-key>
CORS_ORIGINS=https://your-frontend-url.vercel.app
```

### Generate Secret Keys
```bash
# Run this to generate secure keys
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Troubleshooting

### Issue: Database Connection Error
**Solution**: Make sure `DATABASE_URL` is set correctly and database is created

### Issue: CORS Error
**Solution**: Add your Vercel URL to `CORS_ORIGINS` environment variable

### Issue: Cold Start Delays
**Solution**: Use Railway instead of Render, or upgrade to paid tier

### Issue: WebSocket Not Working
**Solution**: Make sure you're using `eventlet` worker:
```bash
gunicorn --worker-class eventlet -w 1 wsgi:app
```

---

## Monitoring & Logs

### Render
- Dashboard → Your Service → **"Logs"** tab

### Railway
- Dashboard → Your Service → **"Deployments"** → Click deployment → **"View Logs"**

### Heroku
```bash
heroku logs --tail
```

---

## Cost Comparison

| Platform | Free Tier | Paid Tier | Best For |
|----------|-----------|-----------|----------|
| **Render** | ✅ Yes | $7/mo | Beginners, demos |
| **Railway** | ✅ $5 credit | $5/mo usage | Small projects |
| **Heroku** | ❌ No | $7/mo | Established apps |
| **AWS/GCP** | ✅ Limited | Variable | Enterprise |

---

## Recommended: Render Deployment

For your project, I recommend **Render** because:
1. ✅ Free tier available
2. ✅ Easy PostgreSQL setup
3. ✅ GitHub integration
4. ✅ Automatic deployments
5. ✅ Good documentation

**Next Steps:**
1. Push code to GitHub
2. Sign up for Render
3. Follow "Option 1" above
4. Update frontend with backend URL
5. Test your deployed app!

---

**Need help?** Check the platform-specific documentation:
- Render: https://render.com/docs
- Railway: https://docs.railway.app
- Heroku: https://devcenter.heroku.com
