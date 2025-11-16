import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateProductDescription(keywords: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  const prompt = `Write a compelling, SEO-optimized product description for a DTF (Direct-to-Film) transfer product.

Keywords to include: ${keywords}

Requirements:
- 2-3 sentences maximum
- Professional and engaging tone
- Include benefits and use cases
- Naturally incorporate the keywords
- Focus on business value and quality
- No hashtags or promotional language

Product context: This is a DTF transfer gang sheet service for custom apparel printing businesses.

Generate only the description text, no additional formatting or explanations.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return text.trim();
  } catch (error) {
    console.error('Error generating description:', error);
    throw new Error('Failed to generate description');
  }
}

export async function generateProductSEO(productName: string, description: string, keywords: string): Promise<{
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
}> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  const prompt = `Generate SEO metadata for this DTF transfer product:

Product Name: ${productName}
Description: ${description}
Target Keywords: ${keywords}

Generate:
1. Meta Title (50-60 characters, include main keyword)
2. Meta Description (150-160 characters, compelling and keyword-rich)
3. Meta Keywords (5-8 relevant keywords as comma-separated list)

Format your response as JSON:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "metaKeywords": ["keyword1", "keyword2", ...]
}

Respond with ONLY the JSON, no markdown formatting or explanations.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();
    
    // Remove markdown code blocks if present
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Error generating SEO metadata:', error);
    throw new Error('Failed to generate SEO metadata');
  }
}
