# 🚀 Deployment Guide - TuneHunt

## Deploy to Vercel with Online Database

### Option 1: Neon Database (Recommended)

#### 1. Create Neon Database
1. Go to [Neon Console](https://console.neon.tech)
2. Sign up/login with GitHub
3. Click "Create a project"
4. Choose region (closest to users)
5. Copy the connection string

#### 2. Set up Vercel
1. Push code to GitHub repository
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:

```env
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your_generated_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

#### 3. Deploy Database Schema
After first deployment:
```bash
# In your local terminal
npm run db:push
```

### Option 2: Vercel Postgres

#### 1. In Vercel Dashboard
1. Go to your project
2. Click "Storage" tab
3. Click "Create Database"
4. Choose "Postgres"
5. Click "Create"

#### 2. Environment Variables
Vercel will automatically add `DATABASE_URL` for you.
Add the remaining variables:

```env
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your_generated_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### Generate NextAuth Secret
```bash
openssl rand -base64 32
```

### Update Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Update authorized redirect URI:
   - `https://your-app-name.vercel.app/api/auth/callback/google`

### Final Steps
1. Click "Deploy" in Vercel
2. Once deployed, run database migration:
   ```bash
   npx prisma db push
   ```
3. Test the application

## 🎯 Post-Deployment Checklist
- [ ] Database connected and migrations applied
- [ ] Google OAuth working
- [ ] Room creation/joining functional  
- [ ] Theme toggle working
- [ ] No console errors

## 📊 Database Management
- **View data:** `npm run db:studio`
- **Push schema:** `npm run db:push`
- **Reset database:** Be careful in production!

Your TuneHunt app should now be live! 🎉