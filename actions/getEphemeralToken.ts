'use server';

import { REALTIME_MODEL, TRANSCRIPTION_LANGUAGE, TRANSCRIPTION_MODEL } from '@/lib/realtimeConfig';

/**
 * This is a server action that returns a short lived token for opening a direct WebRTC Connection to OpenAI
 *
 * The action is unauthenticated: anyone who can load the page can mint a client secret, which is
 * acceptable for a reference app but is where a session check would go in a real deployment.
 *
 * The session body is the wire (snake_case) shape of the realtime session object — the same object
 * the service echoes back as `session.created`. Input transcription is nested under
 * `audio.input.transcription`; it is off (`null`) unless asked for, which is why it is set here
 * rather than inherited. `hooks/useSession/createSession` sends the same values again on connect, because
 * `@openai/agents-realtime` unconditionally pushes a `session.update` built from its own defaults
 * as soon as the data channel opens.
 *
 * Failures are logged in full on the server before they are thrown: in production Next replaces a
 * thrown Server Action message with an opaque digest, so the status and body from OpenAI would
 * otherwise never be seen anywhere. The throw is kept because `hooks/useSession` already turns it
 * into a user-facing error.
 *
 * @returns string (the actual token itself)
 */
export const getEphemeralToken = async (): Promise<string> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session: {
        type: 'realtime',
        model: REALTIME_MODEL,
        audio: {
          input: {
            transcription: {
              model: TRANSCRIPTION_MODEL,
              language: TRANSCRIPTION_LANGUAGE,
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`[getEphemeralToken] OpenAI responded ${response.status}: ${detail}`);
    throw new Error(`Failed to get ephemeral token: ${response.status} ${detail}`);
  }

  const data: unknown = await response.json();

  if (
    !data ||
    typeof data !== 'object' ||
    typeof (data as { value?: unknown }).value !== 'string'
  ) {
    console.error('[getEphemeralToken] OpenAI response had no string `value`:', data);
    throw new Error('Failed to get ephemeral token: response had no client secret');
  }

  return (data as { value: string }).value;
};
