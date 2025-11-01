import { NextRequest, NextResponse } from 'next/server';
import { StalkerAPI } from '@/lib/stalker-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portalUrl, macAddress, timezone } = body;

    if (!portalUrl || !macAddress) {
      return NextResponse.json(
        { error: 'Portal URL and MAC address are required' },
        { status: 400 }
      );
    }

    const api = new StalkerAPI({ portalUrl, macAddress, timezone });
    const success = await api.handshake();

    if (success) {
      const profile = await api.getProfile();
      return NextResponse.json({
        success: true,
        token: api.getToken(),
        profile,
      });
    }

    return NextResponse.json(
      { error: 'Handshake failed' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
