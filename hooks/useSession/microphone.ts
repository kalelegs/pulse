/**
 * How long we wait for the browser microphone prompt to be answered. An unanswered prompt leaves
 * `getUserMedia` pending *forever* (it never rejects), which is what used to hang `connect()`.
 */
export const MIC_PERMISSION_TIMEOUT_MS = 15_000;

/** Stops every track of a microphone stream. Safe to call repeatedly and with `undefined`. */
export const stopMediaStream = (stream?: MediaStream) => {
  stream?.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch (error) {
      console.error('failed to stop microphone track', error);
    }
  });
};

/** Turns a `getUserMedia` rejection into something a user can act on. */
export const micErrorMessage = (error: unknown): string => {
  const name = error instanceof Error ? error.name : '';

  switch (name) {
    case 'NotAllowedError':
      return 'Microphone permission was denied or the prompt was dismissed. Allow microphone access for this site (chrome://settings/content/microphone) and try again.';
    case 'NotFoundError':
      return 'No microphone was found. Connect a microphone and try again.';
    case 'NotReadableError':
      return 'The microphone is already in use by another application. Close the other app and try again.';
    default:
      return `Could not access the microphone${name ? ` (${name})` : ''}. Check your browser microphone settings and try again.`;
  }
};

/**
 * Requests the microphone ourselves rather than letting the transport do it, so that failures carry
 * a precise message and so that an unanswered permission prompt cannot hang forever.
 */
export const requestMicrophone = async (
  timeoutMs = MIC_PERMISSION_TIMEOUT_MS,
): Promise<MediaStream> => {
  const pending = navigator.mediaDevices.getUserMedia({ audio: true });

  const timeoutError = new Error(
    'Microphone permission was not granted in time. Answer the browser microphone prompt, then try connecting again.',
  );
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => reject(timeoutError), timeoutMs);
  });

  try {
    return await Promise.race([pending, timeout]);
  } catch (error) {
    if (error === timeoutError) {
      // We gave up waiting, but `pending` may still resolve later with a live microphone that
      // nobody holds a handle to. Stop it as soon as it shows up.
      void pending.then(stopMediaStream, () => undefined);
      throw timeoutError;
    }
    throw new Error(micErrorMessage(error), { cause: error });
  } finally {
    clearTimeout(timeoutId);
  }
};
