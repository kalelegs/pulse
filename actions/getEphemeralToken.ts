'use server';

import { REALTIME_MODEL, TRANSCRIPTION_LANGUAGE, TRANSCRIPTION_MODEL } from '@/lib/utils';

/**
 * This is a server action that returns a short lived token for opening a direct WebRTC Connection to OpenAI
 *
 * The session body is the wire (snake_case) shape of the realtime session object — the same object
 * the service echoes back as `session.created`. Input transcription is nested under
 * `audio.input.transcription`; it is off (`null`) unless asked for, which is why it is set here
 * rather than inherited. `hooks/useSession/fns` sends the same values again on connect, because
 * `@openai/agents-realtime` unconditionally pushes a `session.update` built from its own defaults
 * as soon as the data channel opens.
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
    const error = await response.text();
    throw new Error(`Failed to get ephemeral token: ${response.status} ${error}`);
  }

  const data = (await response.json()) as { value: string };
  return data.value;
};
