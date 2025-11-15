import { NextRequest, NextResponse } from 'next/server';
import type { ShippingIntegration } from '@/lib/company-settings';

export async function POST(request: NextRequest) {
  try {
    const config: ShippingIntegration = await request.json();

    if (config.provider === 'none' || !config.enabled) {
      return NextResponse.json({
        success: false,
        message: 'Shipping integration is not enabled',
      });
    }

    // Test different providers
    switch (config.provider) {
      case 'shipstation':
        return await testShipStation(config);
      case 'easypost':
        return await testEasyPost(config);
      case 'canada-post':
        return await testCanadaPost(config);
      default:
        return NextResponse.json({
          success: false,
          message: 'Unsupported shipping provider',
        });
    }
  } catch (error) {
    console.error('Test shipping error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to test shipping integration',
    });
  }
}

async function testShipStation(config: ShippingIntegration) {
  try {
    if (!config.apiKey || !config.apiSecret) {
      return NextResponse.json({
        success: false,
        message: 'API key and secret are required for ShipStation',
      });
    }

    const auth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64');
    
    const response = await fetch('https://ssapi.shipstation.com/stores', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to ShipStation',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `ShipStation API error: ${response.status} ${response.statusText}`,
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to ShipStation',
    });
  }
}

async function testEasyPost(config: ShippingIntegration) {
  try {
    if (!config.apiKey) {
      return NextResponse.json({
        success: false,
        message: 'API key is required for EasyPost',
      });
    }

    const response = await fetch('https://api.easypost.com/v2/addresses', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok || response.status === 401) {
      // 401 means API key is being checked, which is what we want
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          message: 'Invalid EasyPost API key',
        });
      }
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to EasyPost',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `EasyPost API error: ${response.status} ${response.statusText}`,
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to EasyPost',
    });
  }
}

async function testCanadaPost(config: ShippingIntegration) {
  try {
    if (!config.apiKey) {
      return NextResponse.json({
        success: false,
        message: 'API key is required for Canada Post',
      });
    }

    // Canada Post uses different authentication
    // This is a basic test - actual implementation would be more complex
    return NextResponse.json({
      success: true,
      message: 'Canada Post integration configured (full testing requires additional setup)',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to test Canada Post integration',
    });
  }
}
