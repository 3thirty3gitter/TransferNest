import appRoute from '@genkit-ai/next';
import { getCartItemsFlow } from '@/ai/flows/cart-flow';
import '@/lib/firebase-admin';

export const POST = appRoute(getCartItemsFlow);
