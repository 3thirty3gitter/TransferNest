import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('[AI Description] GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured. Please add GEMINI_API_KEY to environment variables.' },
        { status: 503 }
      );
    }

    const { keywords, productName, sheetSize } = await request.json();

    if (!keywords || typeof keywords !== 'string' || keywords.trim().length === 0) {
      return NextResponse.json(
        { error: 'Keywords are required' },
        { status: 400 }
      );
    }

    console.log('[AI Description] Initializing Gemini...');
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const prompt = `Write a compelling, SEO-optimized product description for a DTF (Direct-to-Film) transfer product.

Product: ${productName || 'DTF Transfer Sheet'}
Sheet Size: ${sheetSize || 'various sizes'}
Keywords to include: ${keywords}

Requirements:
- 2-3 sentences maximum
- Natural keyword integration
- Focus on benefits and use cases
- Professional tone for B2B
- Highlight quality and value
- Target small business owners and print shops

Write only the description, no additional text:`;

    console.log('[AI Description] Generating with keywords:', keywords);
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });
    const description = (response.text || '').trim();
    console.log('[AI Description] Generated successfully');

    return NextResponse.json({ description });
  } catch (error) {
    console.error('[AI Description] Error:', error);
    console.error('[AI Description] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[AI Description] Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        error: 'Failed to generate description',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
