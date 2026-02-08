# GlobalMessage - Social Media Platform

A modern, real-time social media platform built with React, Node.js, Express, MongoDB, and Socket.IO.

## ✨ Features

- 📧 **Email Registration** with verification
- 🔐 **Google OAuth** authentication
- 👤 **User Profiles** with editable information
- 📝 **Post Creation** with text, images, and GIFs
- 🌍 **Global Feed** with real-time updates
- 💬 **Private Messaging** with real-time delivery
- 🔍 **User Search** functionality
- 🎨 **Modern UI** with eye-comfortable dark theme

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or MongoDB Atlas)
- Gmail account (for email verification) or other SMTP service
- Google Cloud Project (for Google OAuth)

### Installation

1. **Clone and navigate to the project**

    ```bash
    cd globalmessage2
    ```

2. **Install backend dependencies**

    ```bash
    npm install
    ```

3. **Install frontend dependencies**

    ```bash
    cd client
    npm install
    cd ..
    ```

4. **Set up environment variables**

    Copy `.env.example` to `.env`:

    ```bash
    copy .env.example .env
    ```

    Edit `.env` and configure:
    - **MongoDB**: Set `MONGODB_URI` (default: `mongodb://localhost:27017/globalmessage`)
    - **JWT Secret**: Change `JWT_SECRET` to a random string
    - **Email Service**: Configure Gmail or other SMTP service
    - **Google OAuth**: Add your Google Client ID and Secret (see below)

### Email Configuration (Gmail)

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an "App Password" for Gmail
4. Use this app password in the `.env` file:
    ```
    EMAIL_USER=your-email@gmail.com
    EMAIL_PASSWORD=your-16-character-app-password
    ```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Create OAuth Client ID:
    - Application type: Web application
    - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`:
    ```
    GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=your-client-secret
    ```

### Start MongoDB

Make sure MongoDB is running:

```bash
# If using local MongoDB
mongod
```

Or use MongoDB Atlas (cloud) and update `MONGODB_URI` in `.env`

### Run the Application

1. **Start the backend server** (from project root):

    ```bash
    npm run dev
    ```

2. **Start the frontend** (in a new terminal):

    ```bash
    cd client
    npm run dev
    ```

3. **Open your browser** and navigate to:
    ```
    http://localhost:5173
    ```

## 📁 Project Structure

```
globalmessage2/
├── config/           # Configuration files (DB, email, passport)
├── models/           # MongoDB models (User, Post, Message)
├── routes/           # API routes (auth, users, posts, messages)
├── middleware/       # Authentication middleware
├── sockets/          # Socket.IO event handlers
├── uploads/          # Uploaded media files
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React context providers
│   │   ├── pages/        # Page components
│   │   └── index.css     # Global styles
│   └── package.json
├── server.js         # Express server entry point
└── package.json
```

## 🎯 Usage

### Registration & Login

1. **Email Registration**:
    - Go to `/register`
    - Enter email, username, and password
    - Check your email for verification link
    - Click the link to verify your account
    - Login with your credentials

2. **Google OAuth**:
    - Click "Continue with Google" on login/register page
    - Authorize the application
    - You'll be automatically logged in

### Creating Posts

1. Navigate to "Create" tab
2. Write your message
3. Optionally upload an image or GIF
4. Click "Post"
5. Your post appears on the global feed in real-time

### Messaging

1. Go to "Search" tab
2. Search for a username
3. Click on a user to start messaging
4. Messages are delivered in real-time

### Profile Management

1. Click on your avatar or go to "Profile"
2. Click "Edit Profile"
3. Update display name, bio, or avatar URL
4. Save changes

## 🛠️ Tech Stack

### Backend

- **Node.js** & **Express** - Server framework
- **MongoDB** & **Mongoose** - Database
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Passport.js** - Google OAuth
- **Multer** - File uploads
- **Nodemailer** - Email verification
- **bcryptjs** - Password hashing

### Frontend

- **React** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time updates

## 🎨 Design Features

- Eye-comfortable dark theme
- Glassmorphism effects
- Smooth animations and transitions
- Responsive design
- Modern gradient accents
- Custom scrollbars

## 📝 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `GET /api/auth/verify-email` - Verify email
- `POST /api/auth/login` - Login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/google/callback` - OAuth callback

### Users

- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile
- `GET /api/users/search` - Search users
- `GET /api/users/:username` - Get user by username

### Posts

- `POST /api/posts` - Create post
- `GET /api/posts` - Get all posts
- `DELETE /api/posts/:id` - Delete post

### Messages

- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:userId` - Get messages with user

## 🔧 Troubleshooting

### MongoDB Connection Error

- Make sure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Try using MongoDB Atlas for cloud database

### Email Not Sending

- Verify Gmail App Password is correct
- Check EMAIL\_\* variables in `.env`
- The app will still work without email (verification won't function)

### Google OAuth Not Working

- Verify redirect URI matches exactly
- Check Client ID and Secret in `.env`
- Make sure Google+ API is enabled

### Port Already in Use

- Change `PORT` in `.env` (backend)
- Change port in `client/vite.config.js` (frontend)

## 📄 License

MIT License - feel free to use this project for learning or personal use.

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify as needed!

---

Built with ❤️ using modern web technologies
