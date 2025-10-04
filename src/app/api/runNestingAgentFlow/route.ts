import appRoute from '@genkit-ai/next';
import { runNestingAgentFlow } from '@/ai/flows/nesting-flow';
import '@/lib/firebase-admin';

export const POST = appRoute(runNestingAgentFlow);
