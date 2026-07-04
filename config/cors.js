function configuredOrigins() {
  return (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function isOriginAllowed(origin) {
  if (!origin) return true;
  return configuredOrigins().includes(origin.replace(/\/$/, ""));
}

export const corsOptions = {
  origin(origin, callback) {
    callback(isOriginAllowed(origin) ? null : new Error("Origin is not allowed by CORS"), true);
  },
  methods: ["GET", "POST"],
  credentials: true,
};
