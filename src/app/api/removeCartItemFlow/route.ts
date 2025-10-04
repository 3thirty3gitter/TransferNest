import appRoute from '@genkit-ai/next';
import { removeCartItemFlow } from '@/ai/flows/cart-flow';
import '@/lib/firebase-admin';

export const POST = appRoute(removeCartItemFlow);
