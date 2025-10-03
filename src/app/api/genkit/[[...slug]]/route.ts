/**
 * @fileOverview The main API route for Genkit flows.
 *
 * This file is the entry point for all Genkit flows when they are called from the
 * client. It also initializes the Firebase Admin SDK, ensuring that it is only
 * initialized once in a pure server-side context, which prevents SDK conflicts.
 */

import { ai as coreAi } from '@/ai/genkit';
import next from '@genkit-ai/next';
import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// This is the ONLY place where firebase-admin should be initialized.
if (getApps().length === 0) {
  admin.initializeApp();
}

// Augment the core AI instance with the Next.js plugin for API route handling.
export const ai = coreAi.configure({
  plugins: [next()],
});

// All flows are automatically exposed as API endpoints by the `next()` plugin.
// We just need to import them here so they are registered with Genkit.
import '@/ai/flows/cart-flow';
import '@/ai/flows/nesting-flow';

export const { GET, POST } = ai;
