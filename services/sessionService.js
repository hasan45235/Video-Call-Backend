import crypto from "node:crypto";

const COOKIE_NAME = "webrtc_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const sessions = new Map();

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }
  return value;
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
      const index = part.indexOf("=");
      return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
    }),
  );
}

function verifySignedId(value) {
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const id = value.slice(0, separator);
  const supplied = Buffer.from(value.slice(separator + 1));
  const expected = Buffer.from(sign(id));
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected) ? id : null;
}

function cookieFor(id) {
  const secure = process.env.NODE_ENV === "production";
  return `${COOKIE_NAME}=${encodeURIComponent(`${id}.${sign(id)}`)}; Path=/; HttpOnly; Max-Age=${SESSION_TTL_MS / 1000}; SameSite=${secure ? "None" : "Lax"}${secure ? "; Secure" : ""}`;
}

export const sessionService = {
  attachToEngine(io) {
    io.engine.on("initial_headers", (headers, request) => {
      const id = crypto.randomBytes(32).toString("base64url");
      request.turnSessionId = id;
      sessions.set(id, { authenticated: false, expiresAt: Date.now() + SESSION_TTL_MS });
      headers["set-cookie"] = cookieFor(id);
    });
  },

  authorizeSocket(socket, username) {
    const id = socket.request.turnSessionId || verifySignedId(parseCookies(socket.request.headers.cookie)[COOKIE_NAME]);
    const session = id && sessions.get(id);
    if (!session || session.expiresAt <= Date.now()) return false;
    Object.assign(session, { authenticated: true, username, socketId: socket.id });
    return true;
  },

  bindSocket(socket) {
    const id = socket.request.turnSessionId || verifySignedId(parseCookies(socket.request.headers.cookie)[COOKIE_NAME]);
    const session = id && sessions.get(id);
    if (session) session.socketId = socket.id;
  },

  revokeSocket(socket) {
    for (const [id, session] of sessions) {
      if (session.socketId === socket.id) sessions.delete(id);
    }
  },

  authenticateRequest(req) {
    const id = verifySignedId(parseCookies(req.headers.cookie)[COOKIE_NAME]);
    const session = id && sessions.get(id);
    if (!session?.authenticated || session.expiresAt <= Date.now()) return null;
    return { id, username: session.username };
  },
};
