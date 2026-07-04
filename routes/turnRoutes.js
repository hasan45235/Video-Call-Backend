import { Router } from "express";
import { requireTurnSession } from "../middleware/turnAuth.js";
import { turnCredentialRateLimit } from "../middleware/rateLimit.js";
import { getMeteredIceServers } from "../services/meteredTurnService.js";

export const turnRouter = Router();

turnRouter.get("/turn-credentials", requireTurnSession, turnCredentialRateLimit, (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json({ iceServers: getMeteredIceServers() });
  } catch (error) {
    console.error("Unable to issue TURN credentials:", error.message);
    res.status(503).json({ error: "TURN service is unavailable" });
  }
});
