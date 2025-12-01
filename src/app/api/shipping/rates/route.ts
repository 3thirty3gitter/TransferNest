import { NextResponse } from 'next/server';
import EasyPost from '@easypost/api';
import { getFirestore } from '@/lib/firebase-admin';

const adminDb = getFirestore();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, items } = body;

    if (!address || !items) {
      return NextResponse.json({ success: false, message: 'Missing address or items' }, { status: 400 });
    }

    // 1. Fetch Settings
    const settingsDoc = await adminDb.collection('settings').doc('company-settings').get();
    const settings = settingsDoc.data();

    if (!settings?.shipping?.enabled || settings.shipping.provider !== 'easypost' || !settings.shipping.apiKey) {
      return NextResponse.json({ success: false, message: 'Shipping not configured' });
    }

    const client = new EasyPost(settings.shipping.apiKey);

    // 2. Prepare From Address
    const fromAddress = {
      name: settings.companyInfo.name,
      street1: settings.companyInfo.address.street,
      city: settings.companyInfo.address.city,
      state: settings.companyInfo.address.state,
      zip: settings.companyInfo.address.zipCode,
      country: settings.companyInfo.address.country || 'CA',
      phone: settings.companyInfo.phone,
      email: settings.companyInfo.email,
    };

    // 3. Estimate Parcel Weight & Dimensions
    // Logic: ~2oz per sheet + 5oz packaging
    const totalWeightOz = items.reduce((acc: number, item: any) => {
        return acc + (item.quantity * 2); 
    }, 0) + 5;

    // Logic: Stack height increases by ~0.02 inches per sheet
    const totalSheets = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
    const height = Math.max(1, Math.ceil(totalSheets * 0.02));

    // 4. Fetch Rates
    const shipment = await client.Shipment.create({
      to_address: {
        name: `${address.firstName} ${address.lastName}`,
        street1: address.address,
        city: address.city,
        state: address.state,
        zip: address.zipCode,
        country: address.country || 'CA',
        phone: address.phone,
        email: address.email,
      },
      from_address: fromAddress,
      parcel: {
        length: 15, // Standard mailer size
        width: 12,
        height: height,
        weight: totalWeightOz,
      },
    });

    // Filter and sort rates (cheapest first)
    const rates = shipment.rates
      .map(rate => ({
        id: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: parseFloat(rate.rate),
        currency: rate.currency,
        deliveryDays: rate.delivery_days
      }))
      .sort((a, b) => a.rate - b.rate);

    return NextResponse.json({ success: true, rates });

  } catch (error: any) {
    console.error('Shipping Rates Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
