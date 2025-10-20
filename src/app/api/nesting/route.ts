import { NextRequest, NextResponse } from 'next/server';
import { executeEnhancedNesting, ManagedImage } from '@/lib/nesting-algorithm';

export const runtime = 'nodejs'; // Use nodejs runtime for maxrects-packer compatibility

export async function POST(request: NextRequest) {
  try {
    const { images, sheetWidth } = await request.json();
    
    const result = executeEnhancedNesting(
      images as ManagedImage[],
      sheetWidth
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Nesting API error:', error);
    return NextResponse.json(
      { error: 'Failed to process nesting' },
      { status: 500 }
    );
  }
}
