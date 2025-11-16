import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { productName, description, keywords } = await request.json();

    if (!productName || !description) {
      return NextResponse.json(
        { error: 'Product name and description are required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Generate SEO metadata for this DTF transfer product:

Product: ${productName}
Description: ${description}
${keywords ? `Target Keywords: ${keywords}` : ''}

Generate optimal SEO metadata following these requirements:

1. Meta Title (50-60 characters):
   - Include main keyword naturally
   - Compelling and click-worthy
   - Include product type and benefit

2. Meta Description (150-160 characters):
   - Actionable and persuasive
   - Include 2-3 keywords naturally
   - Include call-to-action
   - Highlight unique value

3. Keywords (comma-separated, 6-8 terms):
   - Mix of short-tail and long-tail keywords
   - Related to DTF transfers, printing, and business use
   - Include location if relevant (Canada, North America)

Return ONLY valid JSON in this exact format:
{
  "metaTitle": "your title here",
  "metaDescription": "your description here",
  "keywords": "keyword1, keyword2, keyword3"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    } else {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
    }
    
    const seoData = JSON.parse(jsonText);

    // Validate response structure
    if (!seoData.metaTitle || !seoData.metaDescription || !seoData.keywords) {
      throw new Error('Invalid SEO data structure from AI');
    }

    return NextResponse.json(seoData);
  } catch (error) {
    console.error('[AI SEO] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate SEO metadata',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
