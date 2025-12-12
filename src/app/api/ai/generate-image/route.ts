import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('[AI Image] GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured. Please add GEMINI_API_KEY to environment variables.' },
        { status: 503 }
      );
    }

    const { prompt, style, aspectRatio } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('[AI Image] Initializing Gemini for image generation...');
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    // Build enhanced prompt for blog images
    const styleGuide = style || 'professional, modern, clean';
    const enhancedPrompt = `Create a high-quality blog header image for a DTF printing business website.

Subject: ${prompt}

Style requirements:
- ${styleGuide}
- Suitable for a professional business blog
- Modern and clean aesthetic
- Good for web use
- No text or watermarks in the image
- Vibrant colors that work well on dark website backgrounds
- ${aspectRatio === '16:9' ? 'Widescreen landscape format' : aspectRatio === '1:1' ? 'Square format' : 'Standard landscape format'}

The image should feel premium and trustworthy, suitable for a Canadian B2B DTF printing company.`;

    console.log('[AI Image] Generating image with prompt:', prompt.substring(0, 100) + '...');
    
    // Use Gemini's image generation capability
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: enhancedPrompt,
      config: {
        responseModalities: ['image', 'text'],
      },
    });

    // Extract the image from the response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No response generated');
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      throw new Error('No content parts in response');
    }

    // Find the image part
    let imageData: string | null = null;
    let mimeType: string = 'image/png';

    for (const part of parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data;
        mimeType = part.inlineData.mimeType || 'image/png';
        break;
      }
    }

    if (!imageData) {
      // If no image generated, return a helpful error
      console.error('[AI Image] No image data in response');
      return NextResponse.json(
        { 
          error: 'Image generation not available. The model may not support image output.',
          suggestion: 'Try using a different prompt or contact support.'
        },
        { status: 400 }
      );
    }

    console.log('[AI Image] Generated successfully');

    return NextResponse.json({ 
      success: true,
      image: `data:${mimeType};base64,${imageData}`,
      mimeType
    });

  } catch (error) {
    console.error('[AI Image] Error:', error);
    console.error('[AI Image] Error message:', error instanceof Error ? error.message : String(error));
    
    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('not supported') || errorMessage.includes('INVALID_ARGUMENT')) {
      return NextResponse.json(
        { 
          error: 'Image generation is not available with current API configuration',
          details: 'Gemini image generation requires specific API access. Consider using Vertex AI Imagen or an alternative provider.',
          suggestion: 'You may need to enable Imagen API in Google Cloud Console'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
