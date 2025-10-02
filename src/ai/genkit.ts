/**
 * @fileOverview Initializes and configures the Genkit AI instance for the application.
 *
 * This file sets up the core `ai` object with the necessary plugins, such as
 * Google AI for generative models. This centralized instance is then used throughout the
 * application to define and execute AI flows. The Genkit/Next.js plugin is initialized
 * in the API route handler.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with the required plugins for the application.
// The `next()` plugin is added in the API route handler.
export const ai = genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
