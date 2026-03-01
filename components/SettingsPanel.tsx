'use client';

import { buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChatStore } from '@/hooks';
import { Label } from '@/components/ui/label';
import { RiSettings3Line } from '@remixicon/react';

const SettingsPanel = () => {
  const renderToolCalls = useChatStore((state) => state.renderToolCalls);
  const setRenderToolCalls = useChatStore((state) => state.setRenderToolCalls);
  const eventsLogLevel = useChatStore((state) => state.eventsLogLevel);
  const setEventsLogLevel = useChatStore((state) => state.setEventsLogLevel);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        aria-label="Open settings"
        className={buttonVariants({ variant: 'outline', size: 'icon' })}
      >
        <RiSettings3Line className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle>Settings</AlertDialogTitle>
          <AlertDialogDescription>
            Configure UI behavior for this realtime experience.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Render tool calls</Label>
            <Select
              value={renderToolCalls ? 'true' : 'false'}
              onValueChange={(value) => setRenderToolCalls(value === 'true')}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Events log level</Label>
            <Select
              value={eventsLogLevel}
              onValueChange={(value) => setEventsLogLevel(value === 'verbose' ? 'verbose' : 'info')}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">info</SelectItem>
                <SelectItem value="verbose">verbose</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SettingsPanel;
