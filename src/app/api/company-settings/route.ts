import { NextRequest, NextResponse } from 'next/server';
import { getCompanySettings } from '@/lib/company-settings';

/**
 * Public API endpoint to fetch company settings
 * Returns only public-facing information (no API keys or sensitive data)
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await getCompanySettings();
    
    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Settings not found' },
        { status: 404 }
      );
    }

    // Return only public information
    const publicSettings = {
      companyInfo: {
        name: settings.companyInfo.name,
        tagline: settings.companyInfo.tagline,
        description: settings.companyInfo.description,
        email: settings.companyInfo.email,
        phone: settings.companyInfo.phone,
        address: settings.companyInfo.address,
        pickupInfo: settings.companyInfo.pickupInfo,
      },
      socialMedia: settings.socialMedia,
    };

    return NextResponse.json({
      success: true,
      data: publicSettings,
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
