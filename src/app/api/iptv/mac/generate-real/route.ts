import { NextRequest, NextResponse } from 'next/server';
import { StalkerAPI } from '@/lib/stalker-api';

const MAX_ATTEMPTS = 100;
const TIMEOUT_PER_ATTEMPT = 5000; // 5 seconds per attempt

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portalUrl, timezone = 'UTC' } = body;

    if (!portalUrl) {
      return NextResponse.json(
        { error: 'Portal URL is required' },
        { status: 400 }
      );
    }

    // Validate portal URL format
    try {
      new URL(portalUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid portal URL format' },
        { status: 400 }
      );
    }

    let attempts = 0;
    let foundMAC: string | null = null;
    const testedMACs: string[] = [];

    console.log(`Starting MAC address search for portal: ${portalUrl}`);

    // Try to find a working MAC address
    while (attempts < MAX_ATTEMPTS && !foundMAC) {
      attempts++;
      
      // Generate a random MAC address
      const macAddress = StalkerAPI.generateMAC();
      testedMACs.push(macAddress);

      console.log(`Attempt ${attempts}/${MAX_ATTEMPTS}: Testing MAC ${macAddress}`);

      try {
        // Create API instance with the generated MAC
        const api = new StalkerAPI({ portalUrl, macAddress, timezone });

        // Test the connection with timeout
        const handshakePromise = api.handshake();
        const timeoutPromise = new Promise<boolean>((resolve) => 
          setTimeout(() => resolve(false), TIMEOUT_PER_ATTEMPT)
        );

        const success = await Promise.race([handshakePromise, timeoutPromise]);

        if (success) {
          // Verify by getting profile
          const profile = await api.getProfile();
          if (profile) {
            foundMAC = macAddress;
            console.log(`✓ Found working MAC: ${macAddress} after ${attempts} attempts`);
            break;
          }
        }
      } catch (error: any) {
        // Continue to next attempt on error
        console.log(`✗ MAC ${macAddress} failed: ${error.message}`);
      }

      // Small delay between attempts to avoid overwhelming the server
      if (!foundMAC && attempts < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (foundMAC) {
      return NextResponse.json({
        success: true,
        macAddress: foundMAC,
        attempts,
        message: `Found working MAC address after ${attempts} attempt(s)`,
      });
    } else {
      return NextResponse.json(
        {
          error: `No working MAC address found after ${attempts} attempts`,
          attempts,
          testedMACs: testedMACs.slice(0, 10), // Return first 10 tested MACs for debugging
        },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('MAC generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
