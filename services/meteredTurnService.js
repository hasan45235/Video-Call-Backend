const ALLOWED_SCHEMES = ["stun:", "stuns:", "turn:", "turns:"];

function parseUrls(urls) {
  const values = Array.isArray(urls) ? urls : [urls];
  if (!values.length || values.some((url) => typeof url !== "string" || !ALLOWED_SCHEMES.some((scheme) => url.startsWith(scheme)))) {
    throw new Error("Every Metered ICE server must use a STUN or TURN URL");
  }
  return urls;
}

export function getMeteredIceServers(value = process.env.METERED_ICE_SERVERS_JSON) {
  if (!value) throw new Error("METERED_ICE_SERVERS_JSON is not configured");

  let servers;
  try {
    servers = JSON.parse(value);
  } catch {
    throw new Error("METERED_ICE_SERVERS_JSON must be valid JSON");
  }

  if (!Array.isArray(servers) || !servers.length || servers.length > 16) {
    throw new Error("METERED_ICE_SERVERS_JSON must contain between 1 and 16 ICE servers");
  }

  return servers.map((server) => {
    if (!server || typeof server !== "object" || !("urls" in server)) {
      throw new Error("Every Metered ICE server must contain urls");
    }
    const result = { urls: parseUrls(server.urls) };
    if (server.username !== undefined) result.username = String(server.username);
    if (server.credential !== undefined) result.credential = String(server.credential);
    return result;
  });
}
