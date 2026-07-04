import { sessionService } from "../services/sessionService.js";

export function requireTurnSession(req, res, next) {
  const session = sessionService.authenticateRequest(req);
  if (!session) {
    res.set("Cache-Control", "no-store");
    return res.status(401).json({ error: "Authentication required" });
  }
  req.turnSession = session;
  next();
}
