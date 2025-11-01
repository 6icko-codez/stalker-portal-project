# 🚀 Quick Start Guide - IPTV Player Pro

Get up and running with IPTV Player Pro in 5 minutes!

## 📋 Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- A Stalker Portal URL and MAC address

## ⚡ Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15
- React 19
- HLS.js for video streaming
- Tailwind CSS for styling
- And many more...

### 2. Generate Database Client

```bash
npx prisma generate
```

This creates the Prisma client for database operations.

### 3. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

## 🎯 First Time Setup

### Step 1: Add Your First Portal

1. Open `http://localhost:3000` in your browser
2. Click on the **"Portals"** tab in the left sidebar
3. Click the **"Add Portal"** button
4. Fill in your portal details:

   ```
   Portal Name: My IPTV Service
   Portal URL: http://your-portal-url.com:8080
   MAC Address: Click "Generate" or enter your own
   Timezone: UTC (or your timezone)
   ```

5. Click **"Add Portal"**

The system will automatically test the connection and save your portal if successful.

### Step 2: Load Channels

1. Switch to the **"Channels"** tab
2. Click the **refresh icon** (↻) in the top right
3. Wait for channels to load (this may take a few seconds)
4. You should see a list of available channels

### Step 3: Start Watching

1. Click on any channel from the list
2. The video player will load and start playing
3. Use the controls at the bottom to:
   - Play/Pause
   - Adjust volume
   - Change quality
   - Enable fullscreen
   - Enable picture-in-picture

### Step 4: Explore EPG (Optional)

1. Click the **Calendar icon** in the top right
2. View the TV guide for the current channel
3. See what's playing now and what's coming up
4. Click on any program for more details

## 🎨 Interface Overview

### Main Layout

```
┌─────────────────────────────────────────────────────────┐
│  [☰] IPTV Player Pro              [Now Playing] [📅]   │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Channels │         Video Player Area                    │
│   or     │                                              │
│ Portals  │                                              │
│          │                                              │
│  [List]  │         [Video Controls]                     │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│  [Channel Info Bar]                                     │
└─────────────────────────────────────────────────────────┘
```

### Key Features

- **Left Sidebar**: Switch between Channels and Portals
- **Main Area**: Video player with full controls
- **Right Panel**: EPG (TV Guide) - toggle with calendar icon
- **Bottom Bar**: Current channel information

## 🔧 Common Tasks

### Generate a MAC Address

1. Go to Portals tab
2. Click "Add Portal"
3. Click the "Generate" button next to MAC Address field
4. A valid MAC address will be generated automatically

### Search for Channels

1. Go to Channels tab
2. Use the search box at the top
3. Type channel name
4. Results filter in real-time

### Filter by Category

1. Go to Channels tab
2. Click the "Filter" dropdown
3. Select a category
4. Only channels in that category will show

### Toggle View Mode

1. Go to Channels tab
2. Click the grid icon (⊞) for grid view
3. Click the list icon (☰) for list view

### Mark Favorites

1. Click the star icon (⭐) on any channel
2. The channel is added to favorites
3. Filter by favorites using the category dropdown

## 🎬 Video Player Controls

### Keyboard Shortcuts

- **Space**: Play/Pause
- **←/→**: Skip backward/forward 10 seconds
- **↑/↓**: Volume up/down
- **F**: Toggle fullscreen
- **M**: Mute/Unmute

### Mouse Controls

- **Click video**: Play/Pause
- **Hover**: Show controls
- **Drag progress bar**: Seek to position
- **Drag volume slider**: Adjust volume

## 🐛 Troubleshooting

### Portal Connection Failed

**Problem**: "Authentication failed" error

**Solutions**:
1. Check if portal URL is correct (include http:// or https://)
2. Verify MAC address format (XX:XX:XX:XX:XX:XX)
3. Try generating a new MAC address
4. Check if portal is accessible from your network

### Video Won't Play

**Problem**: Black screen or loading forever

**Solutions**:
1. Check internet connection
2. Try a different channel
3. Refresh the page
4. Check browser console for errors (F12)
5. Try a different browser (Chrome recommended)

### Channels Not Loading

**Problem**: "No channels found" message

**Solutions**:
1. Click the refresh button
2. Check portal connection status
3. Wait a few seconds and try again
4. Verify portal has channels available

### EPG Not Showing

**Problem**: Empty TV guide

**Solutions**:
1. Some channels may not have EPG data
2. Try a different channel
3. Check portal supports EPG
4. Refresh the EPG panel

## 📱 Mobile Usage

### On Mobile Devices

1. Open `http://localhost:3000` on your mobile browser
2. Tap the menu icon (☰) to open sidebar
3. Select a channel
4. Use touch controls:
   - Tap to play/pause
   - Swipe to seek
   - Pinch to zoom (if supported)

### Tips for Mobile

- Use landscape mode for better viewing
- Enable fullscreen for immersive experience
- Close sidebar to maximize player area
- Use headphones for better audio

## 🚀 Production Build

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

The production build is optimized for:
- Faster loading
- Better performance
- Smaller bundle size
- Improved caching

## 🔐 Security Tips

1. **Don't share your MAC address** - It's like a password
2. **Use HTTPS portals** when possible
3. **Keep portal credentials private**
4. **Update regularly** for security patches

## 📚 Next Steps

Now that you're set up, explore these features:

1. ✅ Add multiple portals
2. ✅ Organize channels with favorites
3. ✅ Explore the EPG guide
4. ✅ Try different video qualities
5. ✅ Use picture-in-picture mode
6. ✅ Customize your experience

## 💡 Pro Tips

1. **Use Grid View** for quick channel browsing
2. **Enable Auto-Play** in settings for seamless experience
3. **Mark Favorites** for quick access to preferred channels
4. **Check EPG** to plan your viewing schedule
5. **Use Search** to find channels quickly

## 🆘 Need Help?

- Check the full README: `README-IPTV-ADVANCED.md`
- Look at troubleshooting section above
- Check browser console for errors (F12)
- Ensure all dependencies are installed

## 🎉 You're Ready!

Enjoy your IPTV Player Pro experience!

---

**Happy Streaming! 📺✨**
