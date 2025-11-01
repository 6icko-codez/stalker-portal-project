# 📺 IPTV Player Pro - Advanced Stalker Portal Player

A professional, feature-rich IPTV player with Stalker Portal support, built with Next.js 15, TypeScript, and modern web technologies. Features an iOS 26-inspired UI with glassmorphism effects and smooth animations.

![IPTV Player Pro](https://img.shields.io/badge/IPTV-Player%20Pro-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎬 Advanced Video Player
- **HLS.js Integration** - Adaptive streaming with automatic quality switching
- **Multiple Format Support** - HLS (m3u8), MP4, RTMP, and more
- **Quality Selector** - Auto, 1080p, 720p, 480p, 360p
- **VLC-like Controls** - Play/pause, seek, volume, fullscreen
- **Picture-in-Picture** - Watch while browsing
- **Subtitle Support** - SRT, VTT, WebVTT formats
- **Playback Speed Control** - 0.5x to 2x speed

### 🌐 Stalker Portal Integration
- **MAC Authentication** - Secure portal connection
- **MAC Generator** - Generate valid MAC addresses
- **Channel Browsing** - Browse by categories
- **Stream URL Generation** - Automatic stream link creation
- **Portal Testing** - Test connection before adding
- **Multi-Portal Support** - Manage multiple portals

### 📅 Electronic Program Guide (EPG)
- **Timeline View** - See current and upcoming programs
- **Program Details** - Full descriptions, ratings, categories
- **Progress Tracking** - Visual progress bars for current shows
- **7-Day Guide** - View programs for the next week
- **Search & Filter** - Find programs easily

### 🎨 iOS 26-Inspired UI
- **Glassmorphism** - Frosted glass effects throughout
- **Smooth Animations** - Framer Motion powered transitions
- **Responsive Design** - Works on mobile, tablet, desktop
- **Dark Theme** - Easy on the eyes
- **Dynamic Island** - Notification system
- **Gesture Controls** - Swipe and tap interactions

### 🔧 Additional Features
- **Favorites** - Mark and organize favorite channels
- **Watch History** - Track viewing history
- **Search** - Quick channel search
- **Grid/List View** - Toggle between view modes
- **Channel Logos** - Display channel branding
- **HD Badge** - Identify HD channels
- **Connection Status** - Real-time portal status
- **Error Handling** - User-friendly error messages

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 📖 Usage Guide

### Adding a Portal

1. Click the **"Portals"** tab in the sidebar
2. Click **"Add Portal"** button
3. Fill in the portal details:
   - **Portal Name**: A friendly name for your portal
   - **Portal URL**: Your Stalker portal URL (e.g., `http://example.com:8080`)
   - **MAC Address**: Your device MAC address or click "Generate"
   - **Timezone**: Your timezone (default: UTC)
4. Click **"Add Portal"** to test and save

### Watching Channels

1. Select a portal from the **"Portals"** tab
2. Switch to the **"Channels"** tab
3. Click the **refresh** button to load channels
4. Click on any channel to start playing
5. Use the video controls to adjust playback

### Using EPG

1. Click the **Calendar** icon in the header
2. View current and upcoming programs
3. Click on any program for more details
4. See progress bars for currently playing shows

### Managing Favorites

1. Click the **Star** icon on any channel
2. Filter by favorites using the category dropdown
3. Favorites are saved automatically

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── iptv/
│   │       ├── stalker/          # Stalker Portal API routes
│   │       │   ├── handshake/
│   │       │   ├── channels/
│   │       │   ├── genres/
│   │       │   ├── stream/
│   │       │   └── epg/
│   │       └── mac/
│   │           └── generate/
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Main IPTV player page
├── components/
│   └── iptv/
│       ├── VideoPlayer.tsx       # Advanced video player
│       ├── ChannelList.tsx       # Channel browser
│       ├── EPGViewer.tsx         # EPG timeline viewer
│       └── PortalManager.tsx     # Portal management
├── lib/
│   ├── stores/
│   │   └── useIPTVStore.ts       # Zustand state management
│   ├── stalker-api.ts            # Stalker Portal API client
│   └── utils.ts                  # Utility functions
└── prisma/
    └── schema.prisma             # Database schema
```

## 🎯 Technology Stack

### Core Framework
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Framer Motion** - Animation library
- **Radix UI** - Accessible component primitives

### Video & Streaming
- **HLS.js** - HTTP Live Streaming library
- **Native HTML5 Video** - Fallback for Safari

### State Management
- **Zustand** - Lightweight state management
- **React Query** - Server state management

### Database
- **Prisma** - Next-generation ORM
- **SQLite** - Embedded database

### API & Networking
- **Axios** - HTTP client
- **Next.js API Routes** - Backend API

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./db/custom.db"
```

### Prisma Database

Initialize the database:

```bash
npx prisma db push
```

Migrate the database:

```bash
npx prisma migrate dev
```

## 📱 Responsive Design

The application is fully responsive and optimized for:

- **Desktop** - Full-featured experience with sidebar and EPG panel
- **Tablet** - Optimized layout with collapsible panels
- **Mobile** - Touch-friendly interface with gesture controls

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.ts` to customize colors:

```typescript
theme: {
  extend: {
    colors: {
      primary: {...},
      secondary: {...},
    }
  }
}
```

### Player Settings

Modify player defaults in `src/lib/stores/useIPTVStore.ts`:

```typescript
settings: {
  autoPlay: true,
  rememberPosition: true,
  defaultQuality: 'auto',
  subtitlesEnabled: false,
  theme: 'dark',
}
```

## 🔒 Security Features

- **MAC Address Validation** - Ensures valid MAC format
- **Portal Authentication** - Secure handshake protocol
- **Token Management** - Automatic token refresh
- **Error Handling** - Graceful error recovery
- **Input Sanitization** - Prevents injection attacks

## 🚀 Performance Optimizations

- **Code Splitting** - Automatic route-based splitting
- **Image Optimization** - Next.js Image component
- **Lazy Loading** - Components loaded on demand
- **Caching** - API response caching
- **Debouncing** - Search input debouncing
- **Virtual Scrolling** - Efficient large list rendering

## 🐛 Troubleshooting

### Video Won't Play

1. Check if the stream URL is valid
2. Verify portal connection status
3. Try a different quality setting
4. Check browser console for errors

### Portal Connection Failed

1. Verify portal URL is correct
2. Check MAC address format
3. Ensure portal is accessible
4. Try generating a new MAC address

### Channels Not Loading

1. Click the refresh button
2. Check portal authentication
3. Verify internet connection
4. Check API route logs

## 📊 Browser Compatibility

| Browser | Version | HLS Support | Notes |
|---------|---------|-------------|-------|
| Chrome | 90+ | ✅ HLS.js | Full support |
| Firefox | 88+ | ✅ HLS.js | Full support |
| Safari | 14+ | ✅ Native | Native HLS |
| Edge | 90+ | ✅ HLS.js | Full support |
| Opera | 76+ | ✅ HLS.js | Full support |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Stalker Portal** - IPTV middleware system
- **HLS.js** - HTTP Live Streaming library
- **shadcn/ui** - Beautiful UI components
- **Next.js Team** - Amazing React framework
- **Vercel** - Hosting and deployment

## 📞 Support

For issues and questions:

1. Check the troubleshooting section
2. Search existing issues on GitHub
3. Create a new issue with details
4. Join our community Discord

## 🔮 Roadmap

- [ ] Multi-language support
- [ ] Recording functionality
- [ ] Chromecast support
- [ ] Parental controls
- [ ] Advanced search filters
- [ ] Playlist import/export
- [ ] Social features
- [ ] Mobile apps (iOS/Android)

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies**

**Powered by Stalker Portal API and HLS.js**

🌟 **Star this repo if you find it useful!** 🌟
