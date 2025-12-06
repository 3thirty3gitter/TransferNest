import { Metadata } from 'next';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface Product {
  name: string;
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

export async function generateProductMetadata(): Promise<Metadata> {
  try {
    // Load active products for SEO
    const products: Product[] = [];
    
    // Combine all product keywords and descriptions for page SEO
    const allKeywords = new Set<string>();
    const productNames: string[] = [];
    
    products.forEach(product => {
      productNames.push(product.name);
      if (product.metaKeywords) {
        product.metaKeywords.forEach(kw => allKeywords.add(kw));
      }
    });
    
    // Add default DTF transfer keywords
    ['dtf transfers', 'gang sheets', 'direct to film', 'custom transfers', 'dtf printing'].forEach(kw => allKeywords.add(kw));
    
    return {
      title: 'DTF Wholesale - Premium DTF Transfers & Gang Sheets | AI-Powered Nesting',
      description: 'Professional DTF transfers with 90%+ sheet utilization. 17" gang sheets, fast turnaround, premium quality. Order custom Direct-to-Film transfers for your business today.',
      keywords: Array.from(allKeywords).join(', '),
      openGraph: {
        title: 'DTF Wholesale - Premium DTF Transfers & Gang Sheets',
        description: 'Professional DTF transfers with AI-powered nesting technology. 17" gang sheets available.',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'DTF Wholesale - Premium DTF Transfers',
        description: 'Professional DTF transfers with 90%+ sheet utilization',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'DTF Wholesale - Premium DTF Transfers & Gang Sheets',
      description: 'Professional DTF transfers with AI-powered nesting technology',
    };
  }
}
