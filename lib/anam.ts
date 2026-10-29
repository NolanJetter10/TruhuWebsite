/**
 * Server-side settings for the video call on /BryanKleppe: Bryan's Anam avatar
 * and cloned voice, and the short-lived session token the browser starts a
 * call with. Anam only draws him and speaks; what he says comes from the
 * Ensemble agent (see BryanCall), so the session runs with Anam's own model
 * switched off. The API key never leaves this process.
 */

const SESSION_TOKEN_URL = "https://api.anam.ai/v1/auth/session-token";

/** Every minute of video is billed, so a call ends itself after five. */
export const CALL_LIMIT_S = 300;

/** The avatar and voice of the "Bryan" persona in Anam Lab. */
const PERSONA = {
  name: "Bryan Kleppe",
  avatarId: "ec679eaa-c37d-4e73-943e-4bd73bfdd072",
  avatarModel: "cara-4.1-express",
  voiceId: "97d4988d-c389-4b26-b47d-750f4a319f24",
  // Anam's model stays off: the browser streams the Ensemble agent's words in.
  llmId: "CUSTOMER_CLIENT_V1",
  // The browser says the greeting itself, once the call is up.
  skipGreeting: true,
  maxSessionLengthSeconds: CALL_LIMIT_S,
};

export const anamConfigured = () => Boolean(process.env.ANAM_API_KEY);

export async function createSessionToken() {
  const response = await fetch(SESSION_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ANAM_API_KEY}`,
    },
    body: JSON.stringify({ clientLabel: "truhu-bryan-kleppe", personaConfig: PERSONA }),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as { sessionToken?: unknown } | null;
  if (!response.ok || typeof data?.sessionToken !== "string") {
    throw new Error(`Anam session token failed (${response.status})`);
  }
  return data.sessionToken;
}
