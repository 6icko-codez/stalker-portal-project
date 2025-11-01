# Stream URL Generation - Data Flow

## Complete Flow: Frontend → Backend → Stalker Portal → Video Player

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Browser)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User clicks channel
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ChannelList.tsx - playChannel()                                         │
│                                                                           │
│  const response = await axios.post('/api/iptv/stalker/stream', {        │
│    portalUrl: activePortal.url,                                          │
│    macAddress: activePortal.macAddress,                                  │
│    timezone: activePortal.timezone,                                      │
│    cmd: channel.cmd,                                                     │
│    channelId: channel.externalId,  ← ✅ Sent from frontend              │
│  });                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP POST
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND API ROUTE (Next.js)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  src/app/api/iptv/stalker/stream/route.ts                               │
│                                                                           │
│  const { portalUrl, macAddress, timezone, cmd, channelId } = body;      │
│                                                                           │
│  console.log('Request parameters:', {                                   │
│    channelId,              ← ✅ Logged (NEW)                            │
│    channelIdType,          ← ✅ Logged (NEW)                            │
│    channelIdLength,        ← ✅ Logged (NEW)                            │
│  });                                                                     │
│                                                                           │
│  const api = new StalkerAPI({ portalUrl, macAddress, timezone });       │
│  await api.handshake();                                                  │
│  const streamUrl = await api.createLink(cmd, channelId);  ← ✅ Passed   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Method call
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STALKER API CLIENT (Library)                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  src/lib/stalker-api.ts - createLink(cmd, channelId)                    │
│                                                                           │
│  console.log('Creating link with parameters:', {                        │
│    channelId,              ← ✅ Logged (NEW)                            │
│    cmd,                                                                  │
│  });                                                                     │
│                                                                           │
│  const data = await this.makeRequest('itv', {                           │
│    action: 'create_link',                                                │
│    cmd: encodeURIComponent(cmd),                                         │
│    id: channelId,          ← ⭐ CRITICAL FIX (NEW)                      │
│    series: '',                                                           │
│    forced_storage: 'undefined',                                          │
│    disable_ad: '0',                                                      │
│    download: '0',                                                        │
│    JsHttpRequest: '1-xml',                                               │
│  });                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP GET with params
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STALKER PORTAL (External Server)                      │
│                                                                           │
│  GET http://portal.com/portal.php?type=itv&action=create_link&          │
│      cmd=...&id=12345&series=&...                                        │
│                    ^^^^^^^^^ ← ⭐ NOW INCLUDED                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Portal processes request
                                    │ Generates stream URL
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Portal Response:                                                        │
│  {                                                                       │
│    "js": {                                                               │
│      "cmd": "ffmpeg http://portal.com/play/live.php?                    │
│              mac=XX:XX:XX:XX:XX:XX&                                      │
│              stream=12345&          ← ✅ NOW POPULATED                   │
│              extension=ts&                                               │
│              play_token=..."                                             │
│    }                                                                     │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Response returned
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  src/lib/stalker-api.ts - createLink() continued                        │
│                                                                           │
│  console.log('Portal response:', {                                      │
│    hasCmd: true,           ← ✅ Logged (NEW)                            │
│    cmdPreview: '...',                                                    │
│  });                                                                     │
│                                                                           │
│  let streamUrl = data.js.cmd.trim();                                     │
│  // Remove "ffmpeg " prefix                                              │
│  streamUrl = streamUrl.substring(7).trim();                              │
│                                                                           │
│  console.log('Final stream URL validation:', {                          │
│    hasStreamParam: true,   ← ✅ Should be TRUE now                      │
│    finalUrl: streamUrl,                                                  │
│  });                                                                     │
│                                                                           │
│  return streamUrl;                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Return to API route
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  src/app/api/iptv/stalker/stream/route.ts                               │
│                                                                           │
│  console.log('createLink returned:', {                                  │
│    hasStreamUrl: true,     ← ✅ Logged (NEW)                            │
│    streamUrlPreview: '...',                                              │
│  });                                                                     │
│                                                                           │
│  return NextResponse.json({                                              │
│    success: true,                                                        │
│    streamUrl,                                                            │
│  });                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP Response
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ChannelList.tsx - playChannel() continued                               │
│                                                                           │
│  if (response.data.success) {                                            │
│    setCurrentChannel({                                                   │
│      ...channel,                                                         │
│      streamUrl: response.data.streamUrl,  ← ✅ Valid URL                │
│    });                                                                   │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ State update
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         VIDEO PLAYER COMPONENT                           │
│                                                                           │
│  <VideoPlayer                                                            │
│    streamUrl="http://portal.com/play/live.php?                          │
│              mac=XX:XX:XX:XX:XX:XX&                                      │
│              stream=12345&          ← ✅ POPULATED                       │
│              extension=ts&                                               │
│              play_token=..."                                             │
│  />                                                                      │
│                                                                           │
│  ✅ Video loads and plays successfully!                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Changes Summary

### ❌ BEFORE (Broken Flow)

```
Frontend → API Route → StalkerAPI.createLink()
                           ↓
                       Portal API Request
                       {
                         action: 'create_link',
                         cmd: '...',
                         id: ❌ MISSING
                       }
                           ↓
                       Portal Response
                       stream=❌ EMPTY
                           ↓
                       Video Player ❌ FAILS
```

### ✅ AFTER (Fixed Flow)

```
Frontend → API Route → StalkerAPI.createLink()
                           ↓
                       Portal API Request
                       {
                         action: 'create_link',
                         cmd: '...',
                         id: ✅ channelId
                       }
                           ↓
                       Portal Response
                       stream=✅ 12345
                           ↓
                       Video Player ✅ WORKS
```

## Logging Points

Each step now has detailed logging:

1. **API Route Entry** - Logs channelId received from frontend
2. **Before createLink** - Logs channelId being passed
3. **Inside createLink** - Logs channelId in request parameters
4. **Portal Response** - Logs what portal returned
5. **URL Validation** - Logs if stream parameter is present
6. **API Route Exit** - Logs final stream URL

## Verification Checklist

When testing, verify these log entries appear:

- [ ] `channelId: '12345'` in API route request parameters
- [ ] `channelIdType: 'string'` confirms it's a string
- [ ] `channelIdLength: 5` confirms it's not empty
- [ ] `Creating link with parameters: { channelId: '12345' }`
- [ ] `hasStreamParam: true` in final validation
- [ ] `finalUrl` contains `stream=12345` (not `stream=&`)

## Expected URL Format

**Correct URL (After Fix):**
```
http://portal.com/play/live.php?mac=00:1A:79:XX:XX:XX&stream=12345&extension=ts&play_token=abc123...
                                                        ^^^^^^^^^^^^
                                                        POPULATED!
```

**Incorrect URL (Before Fix):**
```
http://portal.com/play/live.php?mac=00:1A:79:XX:XX:XX&stream=&extension=ts&play_token=abc123...
                                                        ^^^^^^
                                                        EMPTY!
```
