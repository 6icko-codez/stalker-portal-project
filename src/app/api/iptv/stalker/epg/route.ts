import { NextRequest, NextResponse } from 'next/server';
import { StalkerAPI } from '@/lib/stalker-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portalUrl, macAddress, timezone, channelId, period } = body;

    if (!portalUrl || !macAddress || !channelId) {
      return NextResponse.json(
        { error: 'Portal URL, MAC address, and channelId are required' },
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

    // Get EPG data
    const epgData = await api.getEPG(channelId, period || 7);

    return NextResponse.json({
      success: true,
      epg: epgData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
