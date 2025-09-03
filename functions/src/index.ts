// functions/src/index.ts
import {onRequest} from "firebase-functions/v2/https";
import type {Request, Response} from "express";
import {multiAgentRespond} from "../../src/ai/middleware";

export const aiGateway = onRequest(
  {cors: true},
  async (req: Request, res: Response): Promise<void> => {
    try {
      const bodyPrompt = (req.body?.prompt as string) || "";
      const queryPrompt = (req.query?.prompt as string) || "";
      const userInput = req.method === "POST" ? bodyPrompt : queryPrompt;

      if (!userInput) {
        res.status(400).json({error: "Missing prompt"});
        return;
      }

      const json = await multiAgentRespond({userInput});
      res.status(200).json(json);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error("Unknown error");
      // eslint-disable-next-line no-console
      console.error(err);
      res.status(500).json({error: err.message});
    }
  }
);
