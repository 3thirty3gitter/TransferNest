import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { topic, style = 'professional', targetLength = 'medium' } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Determine word count based on target length
    const wordCounts: Record<string, string> = {
      short: '600-800',
      medium: '1000-1400',
      long: '1800-2500',
    };
    const wordCount = wordCounts[targetLength] || wordCounts.medium;

    const prompt = `You are an expert blog writer for DTF Wholesale, a company that specializes in DTF (Direct-to-Film) printing services and gang sheet creation tools.

Write a comprehensive, SEO-optimized blog post about the following topic:

TOPIC: ${topic}

REQUIREMENTS:
1. Style: ${style}
2. Length: ${wordCount} words
3. Target audience: Small business owners, custom apparel makers, print-on-demand sellers
4. Include relevant keywords naturally throughout the content
5. Use HTML formatting for the content

COMPANY CONTEXT:
- DTF Wholesale provides wholesale DTF printing services
- They have an innovative online gang sheet builder tool at /nesting-tool
- They offer built-in image tools like background removal
- Target customers save money by using gang sheets efficiently

OUTPUT FORMAT - Return valid JSON with these exact fields:
{
  "title": "SEO-friendly blog title (50-60 characters ideal)",
  "excerpt": "Compelling meta description for search results (150-160 characters)",
  "content": "Full HTML content with <h2>, <h3>, <p>, <ul>, <li>, <strong>, <a>, <blockquote> tags",
  "tags": ["array", "of", "relevant", "tags"],
  "imagePrompt": "A detailed prompt to generate a relevant cover image for this blog post"
}

CONTENT STRUCTURE:
- Start with an engaging introduction paragraph
- Use <h2> for main sections
- Use <h3> for subsections
- Include bullet lists where appropriate
- Add internal links to /nesting-tool and other relevant pages
- End with a call-to-action
- Include a "Pro Tip" or "Expert Insight" blockquote

IMPORTANT:
- Make the content genuinely helpful and informative
- Avoid fluff - every sentence should add value
- Include specific, actionable advice
- Naturally incorporate the company's tools and services where relevant
- Return ONLY valid JSON, no markdown code blocks`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    // Extract text from response
    const text = response.text;
    
    if (!text) {
      throw new Error('No response from AI');
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = text;
    
    // Remove markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    // Try to find JSON object
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
    }

    const blogData = JSON.parse(jsonStr);

    return NextResponse.json(blogData);
  } catch (error) {
    console.error('Blog generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate blog content' },
      { status: 500 }
    );
  }
}
