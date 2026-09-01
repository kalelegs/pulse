import type { RealtimeItem, RealtimeMessageItem } from '@openai/agents/realtime';

/** A content entry of any message role — user, assistant or system. */
type TMessageContentPart = RealtimeMessageItem['content'][number];

/**
 * The oddities the history view calls out by name.
 *
 * Both of them are the SDK behaving as designed, and both look like transcript bugs if they are
 * shown unexplained, so the debug view labels them rather than filtering them away.
 */
export enum EHistoryNoteKind {
  /** A user message the app sent, not something the microphone heard. */
  Injected = 'injected',
  /** A tool call the SDK never marks finished. */
  FrozenToolCall = 'frozenToolCall',
  /** An item whose text has not landed in history yet. */
  AwaitingText = 'awaitingText',
}

/** A short label plus the sentence that explains why the item looks the way it does. */
export type THistoryNote = {
  kind: EHistoryNoteKind;
  label: string;
  detail: string;
};

/** One history item flattened into the fields the debug view prints. */
export type TDescribedHistoryItem = {
  itemId: string;
  /** `user` / `assistant` / `system`, or `—` for items that carry no role. */
  role: string;
  /** `in_progress` / `completed` / `incomplete`, or `—` where the item has no status. */
  status: string;
  /** The SDK's `item.type`. */
  itemType: string;
  /** Transcript, text, or a rendering of the call — whatever this item's readable content is. */
  text: string;
  note?: THistoryNote;
};

const NOTES: Record<EHistoryNoteKind, Omit<THistoryNote, 'kind'>> = {
  [EHistoryNoteKind.Injected]: {
    label: 'app-injected',
    detail:
      'A text-only user message, so it was sent by the app through session.sendMessage() rather than spoken. The greeting primer that opens every session lands here. Expected — our transcript deliberately omits it.',
  },
  [EHistoryNoteKind.FrozenToolCall]: {
    label: 'frozen at in_progress',
    detail:
      'The SDK records a tool call as in_progress with output: null and never revisits it. The result did reach the model over the transport; only this record stays unfinished. Expected — not a lost tool result.',
  },
  [EHistoryNoteKind.AwaitingText]: {
    label: 'no text yet',
    detail:
      'History carries no partial transcripts, so an item stays blank until its conversation.item.done arrives. Our transcript has already been streaming this text for seconds by then.',
  },
};

const noteFor = (kind: EHistoryNoteKind): THistoryNote => ({ kind, ...NOTES[kind] });

const partText = (part: TMessageContentPart): string => {
  switch (part.type) {
    case 'input_text':
    case 'output_text':
      return part.text;
    case 'input_audio':
    case 'output_audio':
      return part.transcript ?? '';
  }
};

const messageText = (item: RealtimeMessageItem): string => {
  const parts: TMessageContentPart[] = item.content;
  return parts
    .map(partText)
    .filter((text) => text.length > 0)
    .join(' ')
    .trim();
};

/** True when every content part is plain text, which in a voice session means "not spoken". */
const isTextOnly = (item: RealtimeMessageItem): boolean => {
  const parts: TMessageContentPart[] = item.content;
  return parts.length > 0 && parts.every((part) => part.type === 'input_text');
};

const describeMessage = (item: RealtimeMessageItem): TDescribedHistoryItem => {
  const text = messageText(item);
  const injected = item.role === 'user' && isTextOnly(item);

  return {
    itemId: item.itemId,
    role: item.role,
    status: item.role === 'system' ? '—' : item.status,
    itemType: item.type,
    text,
    ...(injected
      ? { note: noteFor(EHistoryNoteKind.Injected) }
      : text.length === 0
        ? { note: noteFor(EHistoryNoteKind.AwaitingText) }
        : {}),
  };
};

/**
 * Flattens one `RealtimeItem` into the row the history view renders.
 *
 * Total over the item union — every branch of `RealtimeItem` produces a row, so nothing the SDK
 * reports can silently disappear from a view whose whole job is showing what the SDK reports.
 *
 * @param item An item straight out of `session.history`.
 */
export const describeHistoryItem = (item: RealtimeItem): TDescribedHistoryItem => {
  if (item.type === 'message') {
    return describeMessage(item);
  }

  if (item.type === 'mcp_approval_request') {
    return {
      itemId: item.itemId,
      role: '—',
      status: item.approved === null || item.approved === undefined ? 'pending' : 'answered',
      itemType: item.type,
      text: `${item.name}(${JSON.stringify(item.arguments)})`,
    };
  }

  const call = `${item.name}(${item.arguments.trim()})`;
  return {
    itemId: item.itemId,
    role: '—',
    status: item.status,
    itemType: item.type,
    text: item.output === null ? call : `${call}\n→ ${item.output}`,
    ...(item.output === null ? { note: noteFor(EHistoryNoteKind.FrozenToolCall) } : {}),
  };
};
