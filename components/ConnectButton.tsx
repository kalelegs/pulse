import { Button } from '@/components/ui/button';
import { RiLinkUnlinkM, RiLoader4Line, RiPlugLine } from '@remixicon/react';

type TConnectButtonProps = {
  isLoading: boolean;
  isConnected: boolean;
  onClick: () => void;
};

const ConnectButton = ({ isLoading, isConnected, onClick }: TConnectButtonProps) => {
  return (
    <Button onClick={onClick} disabled={isLoading}>
      {isLoading ? (
        <>
          <RiLoader4Line data-icon="inline-start" className="size-4 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : isConnected ? (
        <>
          <RiLinkUnlinkM data-icon="inline-start" className="size-4" />
          <span>Disconnect</span>
        </>
      ) : (
        <>
          <RiPlugLine data-icon="inline-start" className="size-4" />
          <span>Connect</span>
        </>
      )}
    </Button>
  );
};

export default ConnectButton;
