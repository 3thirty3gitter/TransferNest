import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { keywords, productName, sheetSize } = await request.json();

    if (!keywords || typeof keywords !== 'string' || keywords.trim().length === 0) {
      return NextResponse.json(
        { error: 'Keywords are required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text().trim();

    return NextResponse.json({ description });
  } catch (error) {
    console.error('[AI Description] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate description',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
