import appRoute from '@genkit-ai/next';
import { saveToCartFlow } from '@/ai/flows/cart-flow';
import '@/lib/firebase-admin';

export const POST = appRoute(saveToCartFlow);
