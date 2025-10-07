
'use server';
import { ai } from '@/ai/genkit';
import '@/ai/flows/cart-flow';
import '@/ai/flows/print-sheet-flow';

export const { GET, POST } = ai;
