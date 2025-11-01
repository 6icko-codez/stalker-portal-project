# 📺 IPTV Stream Player - Local Web App

A modern, locally-hosted IPTV stream player with Stalker Portal support. Works completely offline!

## 🚀 Features

- **🎬 Video Player**: HTML5 video player with full controls
- **🌐 Dual Mode**: Simple stream URLs + Stalker Portal integration
- **📱 Responsive**: Works on desktop, tablet, and mobile
- **💾 Local Storage**: Saves your settings and preferences
- **🔄 Auto-Switch**: Automatically populates stream URLs from Stalker Portal
- **🏠 Offline Ready**: Works without internet connection
- **🎨 Modern UI**: Beautiful dark theme with glassmorphism effects

## 📋 Requirements

- Node.js 18+ 
- npm or yarn

## 🛠 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run in development mode:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 📦 Build for Local Use

### Option 1: Development Mode (Recommended for testing)
```bash
npm run dev
```

### Option 2: Production Build
```bash
# Build the app
npm run build-local

# Serve the built app locally
npm run serve-local
```

### Option 3: Static Export (Most portable)
```bash
# This creates a static version in the 'out' folder
npm run build-local

# You can serve this with any static server
# Or simply open the index.html file in a browser
```

## 🎯 How to Use

### Simple Stream Mode
1. Click on "Simple Stream" tab
2. Enter any direct stream URL (M3U8, MP4, etc.)
3. Click "Play Stream"

### Stalker Portal Mode
1. Click on "Stalker Portal" tab
2. Enter your Portal URL and MAC Address
3. Click "Connect to Portal"
4. Click "Get Channels" to browse
5. Click on any channel to play

### Settings
- **Auto-switch tab**: When enabled, automatically switches to Simple Stream tab and populates the URL when playing from Stalker Portal
- **Local Storage**: All settings are saved automatically

## 🔧 Configuration

The app saves your settings locally:
- Portal URL
- MAC Address
- Auto-switch preference

Settings are stored in your browser's localStorage and persist between sessions.

## 🌟 Key Features

### ✅ Fixed Issues
- **Stream URL Auto-Population**: When you play a channel from Stalker Portal, the stream URL automatically appears in the Simple Stream tab
- **Toggle Auto-Switch**: You can choose whether to automatically switch tabs or stay on the current tab
- **Local Storage**: All your settings are saved locally

### 🏠 Local Web App Benefits
- **No Internet Required**: Works completely offline once loaded
- **Fast Performance**: No external dependencies or API calls
- **Privacy**: All data stays on your local machine
- **Portable**: Can be run from any device with Node.js

## 📱 Mobile Support

The app is fully responsive and works great on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktop computers

## 🎨 UI Features

- **Dark Theme**: Easy on the eyes
- **Glassmorphism**: Modern frosted glass effects
- **Smooth Animations**: Professional transitions
- **Status Indicators**: Real-time connection and playback status
- **Error Handling**: User-friendly error messages

## 🔒 Privacy & Security

- **100% Local**: No data sent to external servers
- **Browser Storage**: Settings stored only in your browser
- **No Tracking**: No analytics or tracking scripts
- **Open Source**: Full transparency in code

## 🚀 Performance

- **Fast Loading**: Optimized for quick startup
- **Smooth Playback**: HTML5 video optimization
- **Responsive Design**: Adapts to any screen size
- **Low Memory**: Efficient resource usage

## 📞 Support

This is a local web application based on your original Python IPTV Stream Player. All functionality has been preserved and enhanced with modern web technologies.

## 🔄 From Python to Web

This web app maintains all the functionality of your original Python desktop application:
- ✅ Simple stream URL playback
- ✅ Stalker Portal authentication
- ✅ Channel browsing and navigation
- ✅ Category navigation with back button
- ✅ Real-time stream URL generation
- ✅ Error handling and status updates

Plus new web-exclusive features:
- 🎨 Modern UI/UX
- 📱 Mobile compatibility
- 💾 Local settings storage
- 🔄 Auto-switch functionality
- 🏠 Offline capability