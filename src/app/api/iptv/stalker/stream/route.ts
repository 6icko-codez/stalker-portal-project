import { NextRequest, NextResponse } from 'next/server';
import { StalkerAPI } from '@/lib/stalker-api';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n[Stream API ${requestId}] ========== NEW REQUEST ==========`);
  
  try {
    const body = await request.json();
    const { portalUrl, macAddress, timezone, cmd, channelId } = body;

    console.log(`[Stream API ${requestId}] Request parameters:`, {
      portalUrl,
      macAddress,
      timezone: timezone || 'UTC',
      cmd: cmd?.substring(0, 100) + (cmd?.length > 100 ? '...' : ''),
      channelId,
    });

    // Validate required parameters
    if (!portalUrl || !macAddress || !cmd || !channelId) {
      const missingParams = [];
      if (!portalUrl) missingParams.push('portalUrl');
      if (!macAddress) missingParams.push('macAddress');
      if (!cmd) missingParams.push('cmd');
      if (!channelId) missingParams.push('channelId');
      
      console.error(`[Stream API ${requestId}] Missing required parameters:`, missingParams);
      
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          details: `Required: ${missingParams.join(', ')}`,
        },
        { status: 400 }
      );
    }

    console.log(`[Stream API ${requestId}] Initializing Stalker API...`);
    const api = new StalkerAPI({ portalUrl, macAddress, timezone });
    
    // Authenticate first
    console.log(`[Stream API ${requestId}] Attempting handshake...`);
    const handshakeSuccess = await api.handshake();
    
    if (!handshakeSuccess) {
      console.error(`[Stream API ${requestId}] Handshake failed`);
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          details: 'Could not authenticate with the portal. Please check your portal URL and MAC address.',
        },
        { status: 401 }
      );
    }

    console.log(`[Stream API ${requestId}] Handshake successful, token received`);
    
    // Try to get subscription info
    let subscriptionInfo = null;
    try {
      subscriptionInfo = await api.getSubscriptionInfo();
      if (subscriptionInfo) {
        console.log(`[Stream API ${requestId}] Subscription info:`, {
          status: subscriptionInfo.status,
          expiryDate: subscriptionInfo.expiryDate,
          daysRemaining: subscriptionInfo.daysRemaining,
        });
      }
    } catch (error) {
      console.log(`[Stream API ${requestId}] Could not fetch subscription info (non-critical)`);
    }
    
    console.log(`[Stream API ${requestId}] Creating stream link...`);

    // Create stream link
    const streamUrl = await api.createLink(cmd, channelId);

    if (!streamUrl) {
      console.error(`[Stream API ${requestId}] Failed to create stream link - no URL returned`);
      return NextResponse.json(
        { 
          error: 'Failed to create stream link',
          details: 'The portal did not return a valid stream URL. The channel may be unavailable.',
        },
        { status: 500 }
      );
    }

    console.log(`[Stream API ${requestId}] Stream link created successfully:`, {
      streamUrl: streamUrl.substring(0, 100) + (streamUrl.length > 100 ? '...' : ''),
      urlLength: streamUrl.length,
      isM3U8: streamUrl.includes('.m3u8'),
      protocol: streamUrl.split(':')[0],
    });

    // Validate stream URL format
    if (!streamUrl.startsWith('http://') && !streamUrl.startsWith('https://')) {
      console.warn(`[Stream API ${requestId}] Stream URL has unexpected protocol:`, streamUrl.substring(0, 50));
    }

    console.log(`[Stream API ${requestId}] ========== REQUEST COMPLETE ==========\n`);

    return NextResponse.json({
      success: true,
      streamUrl,
      metadata: {
        isM3U8: streamUrl.includes('.m3u8'),
        protocol: streamUrl.split(':')[0],
      },
      subscription: subscriptionInfo,
    });
  } catch (error: any) {
    console.error(`[Stream API ${requestId}] ========== ERROR ==========`);
    console.error(`[Stream API ${requestId}] Error type:`, error.constructor.name);
    console.error(`[Stream API ${requestId}] Error message:`, error.message);
    console.error(`[Stream API ${requestId}] Error stack:`, error.stack);
    console.error(`[Stream API ${requestId}] ========== ERROR END ==========\n`);
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: 'An unexpected error occurred while processing your request. Check server logs for details.',
        type: error.constructor.name,
      },
      { status: 500 }
    );
  }
}
