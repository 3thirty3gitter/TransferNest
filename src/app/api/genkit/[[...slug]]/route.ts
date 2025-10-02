/**
 * @fileOverview The main API route for Genkit flows.
 *
 * This file is the entry point for all Genkit flows when they are called from the
 * client. It also initializes the Firebase Admin SDK, ensuring that it is only

 * initialized once in a pure server-side context, which prevents SDK conflicts.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import next from '@genkit-ai/next';
import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// This is the ONLY place where firebase-admin should be initialized.
if (getApps().length === 0) {
  admin.initializeApp();
}

export const ai = genkit({
  plugins: [googleAI(), next()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

// All flows are automatically exposed as API endpoints by the `next()` plugin.
// We just need to import them here so they are registered with Genkit.
import '@/ai/flows/cart-flow';
import '@/ai/flows/nesting-flow';

export { GET, POST } from '@genkit-ai/next';
