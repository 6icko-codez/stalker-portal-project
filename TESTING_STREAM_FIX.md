# Testing Guide: Stream URL Fix

## What Was Fixed

The `stream` parameter in generated URLs was empty because the `channelId` wasn't being sent to the Stalker portal API. This has been fixed by adding `id: channelId` to the API request.

## Pre-Testing Checklist

Before testing, ensure:
- [ ] Dependencies are installed: `npm install`
- [ ] Development server is ready to start
- [ ] You have valid portal credentials (URL and MAC address)
- [ ] Browser console is open (F12) to view logs

## Testing Steps

### 1. Start the Development Server

```bash
npm run dev
```

Wait for the server to start (usually on http://localhost:3000)

### 2. Open the Application

Navigate to http://localhost:3000 in your browser

### 3. Configure Portal Connection

1. Go to the IPTV settings/configuration page
2. Enter your portal URL (e.g., `http://portal.example.com`)
3. Enter your MAC address
4. Save the configuration

### 4. Load Channels

1. Navigate to the channel list
2. Wait for channels to load
3. Select any channel to play

### 5. Monitor the Logs

#### Server Console Logs (Terminal)

Look for these log entries:

```
[Stream API xxxxx] ========== NEW REQUEST ==========
[Stream API xxxxx] Request parameters: {
  portalUrl: 'http://...',
  macAddress: '...',
  channelId: '12345',          ← Should have a value
  channelIdType: 'string',     ← Should be 'string'
  channelIdLength: 5           ← Should be > 0
}

[StalkerAPI.createLink] Creating link with parameters: {
  channelId: '12345',          ← Should match the request
  cmd: '...',
  cmdLength: ...
}

[StalkerAPI.createLink] Portal response: {
  hasCmd: true,
  cmdPreview: 'ffmpeg http://...',
  fullResponse: '...'
}

[StalkerAPI.createLink] Final stream URL validation: {
  hasStreamParam: true,        ← Should be TRUE (was false before)
  urlLength: ...,
  finalUrl: 'http://portal.com/play/live.php?mac=...&stream=12345&...'
                                                     ^^^^^^^^^^^^
                                                     Should NOT be empty!
}
```

#### Browser Console Logs

Look for:
- ✅ No `[VideoPlayer] Native video error` messages
- ✅ Stream URL in network tab should have `stream=<number>` (not `stream=&`)

### 6. Verify Video Playback

- [ ] Video player loads without errors
- [ ] Stream starts playing
- [ ] No error messages in browser console
- [ ] Video controls work (play, pause, volume)

### 7. Test with VLC (Optional but Recommended)

1. Copy the stream URL from the server logs (look for `finalUrl`)
2. Open VLC Media Player
3. Go to: Media → Open Network Stream
4. Paste the URL
5. Click Play
6. Verify the stream plays successfully

**Expected Result:** VLC should play the stream without "Unable to open the MRL" error

## Success Criteria

✅ **channelId is present** in all log entries  
✅ **hasStreamParam is true** in the final validation  
✅ **Stream URL contains** `stream=<number>` (not `stream=&`)  
✅ **Video player loads** and plays the stream  
✅ **No errors** in browser or server console  
✅ **VLC can play** the copied stream URL  

## Troubleshooting

### Issue: channelId is undefined or null

**Cause:** The frontend isn't sending the channelId properly

**Solution:** Check that `channel.externalId` exists in the channel data

### Issue: hasStreamParam is still false

**Possible causes:**
1. Portal doesn't recognize the channel ID
2. Channel ID format is incorrect
3. Portal requires additional parameters

**Debug steps:**
1. Check the `fullResponse` in logs to see what the portal returned
2. Verify the channel ID matches what the portal expects
3. Try a different channel

### Issue: Stream URL is still empty

**Cause:** Portal might not be returning a valid stream URL

**Debug steps:**
1. Check portal subscription status
2. Verify MAC address is authorized
3. Check if the channel is available in your subscription

## Comparison: Before vs After

### Before Fix

```
URL: http://portal.com/play/live.php?mac=XX:XX:XX:XX:XX:XX&stream=&extension=ts&play_token=...
                                                            ^^^^^^^ EMPTY!

Logs:
  hasStreamParam: false
  
Result: ❌ Video player error, VLC fails
```

### After Fix

```
URL: http://portal.com/play/live.php?mac=XX:XX:XX:XX:XX:XX&stream=12345&extension=ts&play_token=...
                                                            ^^^^^^^^^^^^^ POPULATED!

Logs:
  channelId: '12345'
  hasStreamParam: true
  
Result: ✅ Video plays successfully
```

## Additional Testing

### Test Multiple Channels

Try playing 3-5 different channels to ensure the fix works consistently:
- [ ] Channel 1: _____________
- [ ] Channel 2: _____________
- [ ] Channel 3: _____________
- [ ] Channel 4: _____________
- [ ] Channel 5: _____________

### Test Different Portals (if available)

If you have access to multiple portals, test with each:
- [ ] Portal 1: _____________
- [ ] Portal 2: _____________

## Reporting Results

After testing, please report:

1. **Success/Failure:** Did the fix work?
2. **Stream URL:** Copy the final stream URL from logs
3. **Logs:** Copy relevant log entries showing channelId
4. **Video Playback:** Did the video play in the browser?
5. **VLC Test:** Did VLC play the stream?
6. **Any Errors:** Copy any error messages

## Next Steps

If the fix works:
- ✅ Mark this issue as resolved
- ✅ Consider removing verbose logging after confirmation
- ✅ Update documentation

If the fix doesn't work:
- 📋 Collect all logs and error messages
- 📋 Note which step failed
- 📋 Check if there are additional parameters needed
