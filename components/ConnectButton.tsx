import { Button } from '@/components/ui/button';
import type { TSessionMode } from '@/types';
import { RiKeyboardLine, RiLinkUnlinkM, RiLoader4Line, RiMicLine } from '@remixicon/react';

type TConnectButtonProps = {
  /** The mode this button connects in. */
  mode: TSessionMode;
  /** The mode the session is connecting or connected in, from `useSession`. */
  activeMode?: TSessionMode;
  isLoading: boolean;
  isConnected: boolean;
  onClick: (mode: TSessionMode) => void;
};

const LABELS: Record<TSessionMode, { connect: string; icon: typeof RiMicLine }> = {
  voice: { connect: 'Connect with voice', icon: RiMicLine },
  text: { connect: 'Connect with text', icon: RiKeyboardLine },
};

/**
 * One connect/disconnect control per session mode. Only the button for the active mode changes
 * state; the other is disabled while a session is up so there is exactly one way to hang up.
 */
const ConnectButton = ({
  mode,
  activeMode,
  isLoading,
  isConnected,
  onClick,
}: TConnectButtonProps) => {
  const isActive = activeMode === mode;
  const { connect, icon: Icon } = LABELS[mode];

  return (
    <Button
      onClick={() => onClick(mode)}
      disabled={isLoading || (isConnected && !isActive)}
      variant={isConnected && isActive ? 'default' : 'outline'}
    >
      {isLoading && isActive ? (
        <>
          <RiLoader4Line data-icon="inline-start" className="size-4 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : isConnected && isActive ? (
        <>
          <RiLinkUnlinkM data-icon="inline-start" className="size-4" />
          <span>Disconnect</span>
        </>
      ) : (
        <>
          <Icon data-icon="inline-start" className="size-4" />
          <span>{connect}</span>
        </>
      )}
    </Button>
  );
};

export default ConnectButton;
