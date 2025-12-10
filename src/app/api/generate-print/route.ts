import { NextRequest, NextResponse } from 'next/server';
import { PrintExportGenerator } from '@/lib/print-export';
import { NestedImage } from '@/lib/nesting-algorithm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, sheetSize, paymentId, options } = body;

    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Images array is required' },
        { status: 400 }
      );
    }

    if (!sheetSize || !['11', '13', '17'].includes(sheetSize)) {
      return NextResponse.json(
        { error: 'Valid sheet size (11, 13, or 17) is required' },
        { status: 400 }
      );
    }

    const generator = new PrintExportGenerator();
    
    // Generate the high-quality print file
    const printResult = await generator.generatePrintFile(
      images as NestedImage[],
      sheetSize,
      {
        dpi: 300,
        format: 'png',
        quality: 100,
        ...options
      }
    );

    // Return the file as a downloadable response
    const response = new NextResponse(new Uint8Array(printResult.buffer));
    response.headers.set('Content-Type', 'image/png');
    response.headers.set('Content-Disposition', `attachment; filename="${printResult.filename}"`);
    response.headers.set('Content-Length', printResult.buffer.length.toString());
    
    // Add metadata headers
    response.headers.set('X-Print-Width', printResult.dimensions.width.toString());
    response.headers.set('X-Print-Height', printResult.dimensions.height.toString());
    response.headers.set('X-Print-DPI', printResult.dimensions.dpi.toString());
    response.headers.set('X-Payment-ID', paymentId || '');

    return response;

  } catch (error) {
    console.error('Print generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate print file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('paymentId');

  if (!paymentId) {
    return NextResponse.json(
      { error: 'Payment ID is required' },
      { status: 400 }
    );
  }

  // Here you would typically fetch the order from database
  // For now, return placeholder
  return NextResponse.json({
    message: 'Print file download endpoint',
    paymentId,
    status: 'ready'
  });
}