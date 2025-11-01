# MAC Address Testing & Backup Guide

## Quick Start

This guide shows you how to use the new MAC address testing features to find working MAC addresses for your Stalker portal.

---

## 🎯 Use Cases

1. **Find Working MAC Addresses:** Test multiple MAC addresses to find ones that work with your portal
2. **Backup MAC Addresses:** Keep a list of working MAC addresses in case one stops working
3. **Check Subscription Status:** See expiry dates and remaining days for each working MAC
4. **Automate Testing:** Generate and test MAC addresses programmatically

---

## 🔧 Method 1: Using the API Endpoint

### Test Generated MAC Addresses

```bash
curl -X POST http://localhost:3000/api/iptv/stalker/test-macs \
  -H "Content-Type: application/json" \
  -d '{
    "portalUrl": "http://your-portal.com",
    "generateCount": 10,
    "timezone": "UTC"
  }'
```

### Test Specific MAC Addresses

```bash
curl -X POST http://localhost:3000/api/iptv/stalker/test-macs \
  -H "Content-Type: application/json" \
  -d '{
    "portalUrl": "http://your-portal.com",
    "macAddresses": [
      "00:1A:79:A3:B2:C1",
      "00:1A:79:D4:E5:F6",
      "00:1A:78:11:22:33"
    ],
    "timezone": "UTC"
  }'
```

### Response Example

```json
{
  "success": true,
  "results": {
    "working": [
      {
        "mac": "00:1A:79:A3:B2:C1",
        "profile": {
          "id": "12345",
          "stb_type": "MAG250",
          "sn": "ABCD1234567890"
        },
        "subscription": {
          "status": "active",
          "expiryDate": "2025-12-31T23:59:59.000Z",
          "daysRemaining": 60,
          "accountInfo": {
            "expire_date": "2025-12-31T23:59:59.000Z",
            "status": "1"
          }
        }
      }
    ],
    "failed": [
      "00:1A:79:D4:E5:F6",
      "00:1A:78:11:22:33"
    ]
  },
  "summary": {
    "total": 3,
    "working": 1,
    "failed": 2
  }
}
```

---

## 💻 Method 2: Using the StalkerAPI Class

### Generate MAC Addresses

```typescript
import { StalkerAPI } from '@/lib/stalker-api';

// Generate a single MAC address
const mac = StalkerAPI.generateMAC();
console.log(mac); // "00:1A:79:A3:B2:C1"

// Generate with custom prefix
const customMac = StalkerAPI.generateMAC('00:50:C2:');
console.log(customMac); // "00:50:C2:D4:E5:F6"

// Generate multiple MAC addresses
const macs = StalkerAPI.generateMultipleMACs(5);
console.log(macs);
// [
//   "00:1A:79:A3:B2:C1",
//   "00:1A:78:D4:E5:F6",
//   "00:50:C2:11:22:33",
//   "00:E0:4C:44:55:66",
//   "00:0D:97:77:88:99"
// ]
```

### Test MAC Addresses

```typescript
import { StalkerAPI } from '@/lib/stalker-api';

const portalUrl = 'http://your-portal.com';
const macsToTest = StalkerAPI.generateMultipleMACs(10);

const results = await StalkerAPI.testMultipleMACs(
  portalUrl,
  macsToTest,
  'UTC'
);

console.log(`Found ${results.workingMACs.length} working MAC addresses`);

// Display working MACs with subscription info
results.workingMACs.forEach(({ mac, subscription }) => {
  console.log(`\n✅ ${mac}`);
  console.log(`   Status: ${subscription?.status || 'unknown'}`);
  console.log(`   Expires: ${subscription?.expiryDate || 'unknown'}`);
  console.log(`   Days Remaining: ${subscription?.daysRemaining || 'unknown'}`);
});

// Display failed MACs
console.log(`\n❌ Failed MACs: ${results.failedMACs.join(', ')}`);
```

### Get Subscription Info for Existing Connection

```typescript
import { StalkerAPI } from '@/lib/stalker-api';

const api = new StalkerAPI({
  portalUrl: 'http://your-portal.com',
  macAddress: '00:1A:79:A3:B2:C1',
  timezone: 'UTC'
});

// Authenticate
await api.handshake();

// Get subscription info
const subscription = await api.getSubscriptionInfo();

if (subscription) {
  console.log('Subscription Status:', subscription.status);
  console.log('Expiry Date:', subscription.expiryDate);
  console.log('Days Remaining:', subscription.daysRemaining);
  
  if (subscription.daysRemaining && subscription.daysRemaining < 7) {
    console.warn('⚠️ Subscription expires soon!');
  }
}
```

---

## 🎨 Frontend Integration Example

### React Component

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function MacTester() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testMACs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/iptv/stalker/test-macs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portalUrl: 'http://your-portal.com',
          generateCount: 10,
          timezone: 'UTC',
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error testing MACs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={testMACs} disabled={loading}>
        {loading ? 'Testing...' : 'Test MAC Addresses'}
      </Button>

      {results && (
        <div className="space-y-2">
          <h3 className="font-bold">
            Found {results.summary.working} working MAC addresses
          </h3>
          
          {results.results.working.map((item: any) => (
            <div key={item.mac} className="p-4 border rounded">
              <p className="font-mono">{item.mac}</p>
              <p className="text-sm text-muted-foreground">
                Status: {item.subscription?.status || 'unknown'}
              </p>
              {item.subscription?.daysRemaining && (
                <p className="text-sm text-muted-foreground">
                  {item.subscription.daysRemaining} days remaining
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Common MAC Address Prefixes

The system uses these common MAG device prefixes when generating MAC addresses:

| Prefix | Device Type |
|--------|-------------|
| `00:1A:79:` | MAG200/250/254/256 (most common) |
| `00:1A:78:` | MAG alternative |
| `00:50:C2:` | IEEE registered |
| `00:E0:4C:` | Realtek chipset |
| `00:0D:97:` | Hitachi chipset |

---

## 🔒 Security Best Practices

1. **Rate Limiting:** The API limits testing to 20 MAC addresses per request
2. **Server-Side Only:** MAC testing should be done server-side to protect portal URLs
3. **Store Securely:** Save working MAC addresses in a secure database, not in client-side code
4. **Rotate Regularly:** Test and rotate MAC addresses periodically
5. **Monitor Expiry:** Set up alerts for subscriptions expiring soon

---

## 🐛 Troubleshooting

### No Working MACs Found

```typescript
// Try different prefixes
const customMACs = [
  StalkerAPI.generateMAC('00:1A:79:'),
  StalkerAPI.generateMAC('00:1A:78:'),
  StalkerAPI.generateMAC('00:50:C2:'),
];

const results = await StalkerAPI.testMultipleMACs(
  portalUrl,
  customMACs,
  timezone
);
```

### Subscription Info Not Available

Some portals may not provide subscription information. The API will return `null` for subscription data in these cases, but streaming will still work.

### Connection Timeouts

```typescript
// The API has a 10-second timeout per request
// If testing many MACs, consider batching:

const allMACs = StalkerAPI.generateMultipleMACs(50);
const batchSize = 10;

for (let i = 0; i < allMACs.length; i += batchSize) {
  const batch = allMACs.slice(i, i + batchSize);
  const results = await StalkerAPI.testMultipleMACs(portalUrl, batch);
  console.log(`Batch ${i / batchSize + 1}: ${results.workingMACs.length} working`);
}
```

---

## 📝 Saving Working MACs

### Example: Save to Database

```typescript
import { prisma } from '@/lib/prisma';

async function saveWorkingMACs(portalUrl: string, results: any) {
  for (const item of results.workingMACs) {
    await prisma.macAddress.upsert({
      where: { mac: item.mac },
      update: {
        lastTested: new Date(),
        status: item.subscription?.status || 'unknown',
        expiryDate: item.subscription?.expiryDate,
      },
      create: {
        mac: item.mac,
        portalUrl,
        status: item.subscription?.status || 'unknown',
        expiryDate: item.subscription?.expiryDate,
        lastTested: new Date(),
      },
    });
  }
}
```

### Example: Save to JSON File

```typescript
import fs from 'fs/promises';

async function saveWorkingMACsToFile(results: any) {
  const data = {
    lastUpdated: new Date().toISOString(),
    macs: results.workingMACs.map((item: any) => ({
      mac: item.mac,
      status: item.subscription?.status,
      expiryDate: item.subscription?.expiryDate,
      daysRemaining: item.subscription?.daysRemaining,
    })),
  };

  await fs.writeFile(
    'working-macs.json',
    JSON.stringify(data, null, 2)
  );
}
```

---

## 🚀 Advanced Usage

### Automatic MAC Rotation

```typescript
class MACRotator {
  private workingMACs: string[] = [];
  private currentIndex = 0;

  async initialize(portalUrl: string) {
    const macs = StalkerAPI.generateMultipleMACs(20);
    const results = await StalkerAPI.testMultipleMACs(portalUrl, macs);
    this.workingMACs = results.workingMACs.map(m => m.mac);
  }

  getNextMAC(): string {
    if (this.workingMACs.length === 0) {
      throw new Error('No working MACs available');
    }
    const mac = this.workingMACs[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.workingMACs.length;
    return mac;
  }
}

// Usage
const rotator = new MACRotator();
await rotator.initialize('http://your-portal.com');

// Get a different MAC for each request
const mac1 = rotator.getNextMAC();
const mac2 = rotator.getNextMAC();
```

---

**Last Updated:** November 1, 2025  
**Version:** 1.0.0
