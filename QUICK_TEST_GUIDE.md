# 🚀 Quick Test Guide - Stream URL Fix

**Time to test:** 2-5 minutes  
**Priority:** 🔴 Critical

---

## ✅ Step 1: Verify the Fix is Applied

Run this command to confirm the fix is in place:

```bash
grep -A 5 "substring(7)" src/lib/stalker-api.ts | head -20
```

**Expected output:** You should see code that removes the "ffmpeg " prefix.

---

## ✅ Step 2: Start Your Server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Wait for the server to start (usually at http://localhost:3000)

---

## ✅ Step 3: Test Video Playback

1. **Open your browser** to http://localhost:3000
2. **Navigate to your video player** page
3. **Try to play a video/channel**

### What to Look For:

#### ✅ SUCCESS Indicators:
- Video starts playing
- No 404 errors in browser console
- Server logs show full URLs like:
  ```
  [Stream API xxxxx] Stream link created successfully: {
    streamUrl: 'http://portal.com/play/live.php?mac=...',
    ...
  }
  ```

#### ❌ FAILURE Indicators:
- Video doesn't play
- 404 error for `/ffmpeg` in browser console
- Server logs show:
  ```
  streamUrl: 'ffmpeg'
  ```

---

## ✅ Step 4: Check Server Logs

Look for these log entries when playing a video:

```
[Stream API xxxxx] ========== NEW REQUEST ==========
[Stream API xxxxx] Request parameters: { ... }
[Stream API xxxxx] Attempting handshake...
[Stream API xxxxx] Handshake successful, token received
[Stream API xxxxx] Subscription info: { status: 'active', daysRemaining: 60 }
[Stream API xxxxx] Creating stream link...
[Stream API xxxxx] Stream link created successfully: {
  streamUrl: 'http://portal.com/play/live.php?mac=...',  ← Should be full URL!
  urlLength: 150,
  isM3U8: true,
  protocol: 'http'
}
[Stream API xxxxx] ========== REQUEST COMPLETE ==========
```

**Key Check:** The `streamUrl` should be a complete HTTP/HTTPS URL, NOT just "ffmpeg"!

---

## ✅ Step 5: Test Subscription Info (Optional)

If your portal supports it, you should see subscription information in the logs:

```
[Stream API xxxxx] Subscription info: {
  status: 'active',
  expiryDate: '2025-12-31T23:59:59.000Z',
  daysRemaining: 60
}
```

---

## ✅ Step 6: Test MAC Address Generation (Optional)

Test the new MAC testing endpoint:

```bash
curl -X POST http://localhost:3000/api/iptv/stalker/test-macs \
  -H "Content-Type: application/json" \
  -d '{
    "portalUrl": "http://your-portal-url.com",
    "generateCount": 5,
    "timezone": "UTC"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "results": {
    "working": [...],
    "failed": [...]
  },
  "summary": {
    "total": 5,
    "working": 1,
    "failed": 4
  }
}
```

---

## 🐛 Troubleshooting

### Problem: Video still doesn't play

**Check 1:** Verify the fix is applied
```bash
grep "substring(7)" src/lib/stalker-api.ts
```
Should return 3 matches.

**Check 2:** Check the actual stream URL in logs
Look for `streamUrl:` in the server logs. It should be a full URL.

**Check 3:** Check browser console
Open DevTools (F12) → Console tab. Look for any errors.

**Check 4:** Restart the server
```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

---

### Problem: Still seeing "ffmpeg" in logs

This means the fix wasn't applied correctly. Run:

```bash
# Check the exact code
cat src/lib/stalker-api.ts | grep -A 10 "createLink"
```

You should see code that removes the "ffmpeg " prefix.

---

### Problem: 404 error for /ffmpeg

This means the old code is still running. Try:

1. **Hard refresh** the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear browser cache**
3. **Restart the development server**
4. **Check if you're editing the right file** (should be `src/lib/stalker-api.ts`)

---

## 📊 Quick Comparison

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| Stream URL in logs | `"ffmpeg"` | `"http://portal.com/play/..."` |
| Video playback | ❌ Fails | ✅ Works |
| Browser console | 404 error | No errors |
| URL length | ~6 chars | ~100+ chars |

---

## ✅ Success Criteria

You can consider the fix successful if:

1. ✅ Video plays without errors
2. ✅ Server logs show full HTTP/HTTPS URLs
3. ✅ No 404 errors in browser console
4. ✅ Stream URL length is > 50 characters
5. ✅ Subscription info appears in logs (if supported)

---

## 🎯 Next Steps After Testing

Once you confirm the fix works:

1. **Commit the changes:**
   ```bash
   git add src/lib/stalker-api.ts src/app/api/iptv/stalker/stream/route.ts
   git commit -m "Fix stream URL parsing - extract full URL after ffmpeg prefix"
   ```

2. **Test with different channels/videos** to ensure it works consistently

3. **Monitor for any edge cases** in production

4. **Consider testing the MAC address features** if you need backup MACs

---

## 📞 Need Help?

If the fix doesn't work:

1. Check the `STREAM_URL_FIX_SUMMARY.md` for detailed information
2. Review the `STREAM_URL_FIX_DIAGRAM.md` for visual explanation
3. Check the `MAC_ADDRESS_TESTING_GUIDE.md` for advanced features
4. Look at the server logs for specific error messages

---

## 🎉 Expected Timeline

- **Step 1-2:** 30 seconds (verify and start server)
- **Step 3:** 1 minute (test video playback)
- **Step 4:** 30 seconds (check logs)
- **Step 5-6:** 2 minutes (optional tests)

**Total:** ~2-5 minutes for complete testing

---

**Last Updated:** November 1, 2025  
**Status:** ✅ Ready to Test  
**Priority:** 🔴 Critical
