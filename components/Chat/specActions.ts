'use client';

import type { TJsonRenderAction } from '@/lib/json-render/types';

/**
 * Signature `JsonRenderSurface` calls its `onAction` prop with. An alias rather than a second
 * declaration: `TJsonRenderAction` is the one canonical shape, so the chat side cannot drift from
 * the render surface it plugs into.
 */
export type TSpecActionHandler = TJsonRenderAction;

/** Reads a string field out of the loosely typed params a fired action carries. */
const readText = (params: Record<string, unknown> | undefined, key: string): string =>
  typeof params?.[key] === 'string' ? (params[key] as string).trim() : '';

/**
 * Dispatches actions fired by generative-UI blocks. `suggest` hands the chip's text to
 * `sendUserText`, which sends it as a user turn and echoes it only once the send succeeded;
 * `select` is a documented no-op. The reasoning is in `./README.md`, "Generative UI".
 *
 * @param sendUserText Built once per page by `createUserTextSender`; the `'suggestion'` source is
 *   fixed here so callers only supply the transport.
 */
export const createSpecActionHandler =
  (sendUserText: (text: string) => boolean): TSpecActionHandler =>
  (actionName, params) => {
    if (actionName === 'suggest') {
      const text = readText(params, 'text') || readText(params, 'value');
      if (!text) {
        console.warn('[json-render] suggest fired without any text to send', params);
        return;
      }
      sendUserText(text);
      return;
    }

    if (actionName === 'select') {
      console.debug('json-render "select" is not bound to any behaviour yet', params);
      return;
    }

    console.warn('[json-render] unhandled action', actionName, params);
  };
