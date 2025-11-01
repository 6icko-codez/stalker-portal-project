import { NextRequest, NextResponse } from 'next/server';
import { StalkerAPI } from '@/lib/stalker-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portalUrl, macAddress, timezone, cmd, channelId } = body;

    if (!portalUrl || !macAddress || !cmd || !channelId) {
      return NextResponse.json(
        { error: 'Portal URL, MAC address, cmd, and channelId are required' },
        { status: 400 }
      );
    }

    const api = new StalkerAPI({ portalUrl, macAddress, timezone });
    
    // Authenticate first
    const handshakeSuccess = await api.handshake();
    if (!handshakeSuccess) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Create stream link
    const streamUrl = await api.createLink(cmd, channelId);

    if (!streamUrl) {
      return NextResponse.json(
        { error: 'Failed to create stream link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      streamUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
