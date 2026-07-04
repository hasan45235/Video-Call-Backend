import assert from "node:assert/strict";
import test from "node:test";
import { getMeteredIceServers } from "../services/meteredTurnService.js";

test("returns a validated Metered ICE server array", () => {
  const input = JSON.stringify([
    { urls: "stun:stun.relay.metered.ca:80" },
    { urls: "turn:global.relay.metered.ca:443", username: "user", credential: "password" },
  ]);

  assert.deepEqual(getMeteredIceServers(input), JSON.parse(input));
});

test("rejects malformed JSON", () => {
  assert.throws(() => getMeteredIceServers("not-json"), /valid JSON/);
});

test("rejects non-ICE URL schemes", () => {
  assert.throws(() => getMeteredIceServers('[{"urls":"https://example.com"}]'), /STUN or TURN URL/);
});
