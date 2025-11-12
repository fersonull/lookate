# 🚀 lookate Deployment Guide

## Quick Deploy to Vercel (Recommended)

### 1. Prepare Repository
```bash
# Initialize git if not done
git init
git add .
git commit -m "Initial commit - ready for deployment"

# Push to GitHub
git remote add origin https://github.com/yourusername/lookate.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Visit [vercel.com](https://vercel.com) and sign up
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### 3. Environment Variables
Add these in Vercel dashboard:

**Required Variables:**
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/lookate
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-random-secret-key-32-characters
JWT_SECRET=another-random-secret-key-32-chars
```

**Generate Secrets:**
```bash
# Generate secure secrets
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Custom Domain (Optional)
1. In Vercel dashboard → Settings → Domains
2. Add your domain: `lookate.com`
3. Update DNS records as shown

## Alternative: Railway Deployment

### 1. Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### 2. Add Environment Variables
```bash
railway variables set MONGODB_URI="your_uri"
railway variables set NEXTAUTH_URL="https://your-app.railway.app"
railway variables set NEXTAUTH_SECRET="your_secret"
railway variables set JWT_SECRET="your_secret"
```

## Production Checklist

### Security
- [ ] Secure random secrets generated
- [ ] MongoDB IP whitelist updated (0.0.0.0/0 for cloud)
- [ ] Environment variables set
- [ ] HTTPS enabled

### Performance
- [ ] Images optimized
- [ ] API routes tested
- [ ] Database indexes created
- [ ] Error monitoring setup

### Functionality
- [ ] Authentication working
- [ ] Profile management functional
- [ ] Location sharing working
- [ ] Real-time updates active
- [ ] Mobile responsive

## Post-Deployment

### 1. Test Your Deployed App
- Sign up for new account
- Test profile management
- Share location
- Verify real-time updates

### 2. Monitor Performance
- Vercel Analytics (free)
- Database performance in MongoDB Atlas
- API response times

### 3. Optional Enhancements
- Custom domain
- Analytics (Google Analytics)
- Error tracking (Sentry)
- Performance monitoring

## Troubleshooting

### Common Issues:
1. **Build Errors:** Check Node.js version compatibility
2. **Environment Variables:** Ensure all secrets are set
3. **Database Connection:** Verify MongoDB URI and network access
4. **Authentication:** Check NEXTAUTH_URL matches deployment URL

Your lookate app is production-ready! 🎉