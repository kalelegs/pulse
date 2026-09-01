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

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Recording
            </p>
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
            <p className="text-muted-foreground text-xs">
              Decides which transport events are <strong>captured</strong> into the panel.
              <code> info</code> keeps only structural events, so anything it skips is gone for good
              — it is never recorded.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Display
            </p>
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
            <p className="text-muted-foreground text-xs">
              Hides tool-call events from the list without discarding them. Per-category filtering
              lives on the chips in the Events panel itself.
            </p>
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
