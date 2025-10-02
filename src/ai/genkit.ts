'use server';
/**
 * @fileOverview Initializes and configures the Genkit AI instance for the application.
 *
 * This file sets up the core `ai` object with the necessary plugins, such as
 * Google AI for generative models and the Next.js plugin for integration with
 * the Next.js framework. This centralized instance is then used throughout the
 * application to define and execute AI flows.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import next from '@genkit-ai/next';

// Initialize Genkit with the required plugins for the application.
// This `ai` instance is exported and used throughout the app to define and run flows.
export const ai = genkit({
  plugins: [googleAI(), next()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
