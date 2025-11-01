import { NextRequest, NextResponse } from 'next/server';
import { StalkerAPI } from '@/lib/stalker-api';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n[Test MACs API ${requestId}] ========== NEW REQUEST ==========`);
  
  try {
    const body = await request.json();
    const { portalUrl, macAddresses, timezone, generateCount } = body;

    console.log(`[Test MACs API ${requestId}] Request parameters:`, {
      portalUrl,
      macAddressesProvided: macAddresses?.length || 0,
      generateCount: generateCount || 0,
      timezone: timezone || 'UTC',
    });

    // Validate required parameters
    if (!portalUrl) {
      console.error(`[Test MACs API ${requestId}] Missing portalUrl`);
      return NextResponse.json(
        { 
          error: 'Missing required parameter: portalUrl',
        },
        { status: 400 }
      );
    }

    let macsToTest: string[] = [];

    // Use provided MAC addresses or generate new ones
    if (macAddresses && Array.isArray(macAddresses) && macAddresses.length > 0) {
      macsToTest = macAddresses;
      console.log(`[Test MACs API ${requestId}] Testing ${macsToTest.length} provided MAC addresses`);
    } else if (generateCount && generateCount > 0) {
      const count = Math.min(generateCount, 20); // Limit to 20 to avoid abuse
      macsToTest = StalkerAPI.generateMultipleMACs(count);
      console.log(`[Test MACs API ${requestId}] Generated ${count} MAC addresses to test`);
    } else {
      // Default: generate 5 MAC addresses
      macsToTest = StalkerAPI.generateMultipleMACs(5);
      console.log(`[Test MACs API ${requestId}] Generated 5 default MAC addresses to test`);
    }

    console.log(`[Test MACs API ${requestId}] Testing MAC addresses:`, macsToTest);

    // Test all MAC addresses
    const results = await StalkerAPI.testMultipleMACs(portalUrl, macsToTest, timezone);

    console.log(`[Test MACs API ${requestId}] Test results:`, {
      workingCount: results.workingMACs.length,
      failedCount: results.failedMACs.length,
    });

    // Log details of working MACs
    for (const working of results.workingMACs) {
      console.log(`[Test MACs API ${requestId}] Working MAC: ${working.mac}`, {
        hasProfile: !!working.profile,
        subscriptionStatus: working.subscription?.status,
        expiryDate: working.subscription?.expiryDate,
        daysRemaining: working.subscription?.daysRemaining,
      });
    }

    console.log(`[Test MACs API ${requestId}] ========== REQUEST COMPLETE ==========\n`);

    return NextResponse.json({
      success: true,
      results: {
        working: results.workingMACs.map(w => ({
          mac: w.mac,
          profile: w.profile,
          subscription: w.subscription,
        })),
        failed: results.failedMACs,
      },
      summary: {
        total: macsToTest.length,
        working: results.workingMACs.length,
        failed: results.failedMACs.length,
      },
    });
  } catch (error: any) {
    console.error(`[Test MACs API ${requestId}] ========== ERROR ==========`);
    console.error(`[Test MACs API ${requestId}] Error type:`, error.constructor.name);
    console.error(`[Test MACs API ${requestId}] Error message:`, error.message);
    console.error(`[Test MACs API ${requestId}] Error stack:`, error.stack);
    console.error(`[Test MACs API ${requestId}] ========== ERROR END ==========\n`);
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: 'An unexpected error occurred while testing MAC addresses. Check server logs for details.',
        type: error.constructor.name,
      },
      { status: 500 }
    );
  }
}
