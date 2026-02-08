# Quick Setup Guide

## Step 1: Copy Environment File

Copy the `.env.example` file to `.env`:

```powershell
copy .env.example .env
```

## Step 2: Configure MongoDB

Open the `.env` file and update the MongoDB URI:

### Option A: Local MongoDB (Recommended for testing)

If you have MongoDB installed locally, use:

```
MONGODB_URI=mongodb://localhost:27017/globalmessage
```

### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Replace in `.env`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/globalmessage
```

## Step 3: Update JWT Secret

Change the JWT_SECRET in `.env` to any random string:

```
JWT_SECRET=my_super_secret_key_12345_change_this
```

## Step 4: (Optional) Configure Email

To enable email verification, configure Gmail:

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Update in `.env`:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

**Note**: The app works without email configuration, but email verification won't function.

## Step 5: (Optional) Configure Google OAuth

To enable "Sign in with Google":

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Update in `.env`:

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Note**: The app works without Google OAuth, users can still register with email.

## Step 6: Start the Application

### Start Backend (Terminal 1):

```powershell
npm run dev
```

### Start Frontend (Terminal 2):

```powershell
cd client
npm run dev
```

## Step 7: Open in Browser

Navigate to: http://localhost:5173

## Troubleshooting

### MongoDB Connection Failed

- Make sure MongoDB is running if using local installation
- Or use MongoDB Atlas (cloud) - it's free and easier
- Verify MONGODB_URI in `.env` is correct

### Port Already in Use

- Backend: Change PORT in `.env`
- Frontend: Change port in `client/vite.config.js`

### Email Not Sending

- Verify Gmail App Password is correct
- The app still works, just skip email verification for testing

---

## Testing Without Full Setup

You can test the app with minimal configuration:

1. Copy `.env.example` to `.env`
2. Set MongoDB URI (use Atlas for easiest setup)
3. Change JWT_SECRET to any random string
4. Start the servers
5. Register with email (verification won't work but you can still test)
6. Manually verify users in MongoDB if needed

**For quick testing, I recommend using MongoDB Atlas (free tier) - it requires no local installation!**
