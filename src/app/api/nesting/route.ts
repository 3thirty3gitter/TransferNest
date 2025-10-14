import { NextRequest, NextResponse } from 'next/server';
import { executeEnhancedNesting, ManagedImage } from '@/lib/nesting-algorithm';

export const runtime = 'edge'; // Use edge runtime for better performance

export async function POST(request: NextRequest) {
  try {
    const { images, sheetWidth, algorithm, options } = await request.json();
    
    const result = executeEnhancedNesting(
      images as ManagedImage[],
      sheetWidth,
      algorithm,
      options
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
