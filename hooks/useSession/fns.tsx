import { getEphemeralToken } from '@/actions/getEphemeralToken';
import initialAgent from '@/agents/initial';
import { OpenAIRealtimeWebRTC, RealtimeSession, TransportEvent } from '@openai/agents/realtime';
import { TSessionContext, TUseSessionOptions } from '@/types';
import { REALTIME_MODEL } from '@/lib/utils';

const createSession = async (
  options: TUseSessionOptions,
): Promise<RealtimeSession<TSessionContext>> => {
  const audioElement = options.audioRef?.current;
  const apiKey = await getEphemeralToken();

  const session = new RealtimeSession<TSessionContext>(initialAgent, {
    model: REALTIME_MODEL,
    transport: new OpenAIRealtimeWebRTC(audioElement ? { audioElement } : undefined),
    context: options.context,
  });

  // events ref: https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/#transport_event
  session.on('transport_event', (te: TransportEvent) => {
    console.debug('transport event', te);
    // call upstream
    options.onTransportEvent?.(te);
  });
  await session.connect({ apiKey });
  return session;
};

export { createSession };
