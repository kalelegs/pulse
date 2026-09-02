'use client';

import { RiSettings3Line } from '@remixicon/react';
import SettingRow, { TSettingOption } from '@/components/SettingRow';
import { buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useEventLogStore } from '@/hooks';
import { TEventsLogLevel } from '@/types';

const LOG_LEVEL_OPTIONS: readonly TSettingOption<TEventsLogLevel>[] = [
  { value: 'info', label: 'info' },
  { value: 'verbose', label: 'verbose' },
];

const RENDER_TOOL_CALL_OPTIONS: readonly TSettingOption<'true' | 'false'>[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** The settings dialog: the two debug-panel switches that do not belong on the chip row. */
const SettingsPanel = () => {
  const renderToolCalls = useEventLogStore((state) => state.renderToolCalls);
  const setRenderToolCalls = useEventLogStore((state) => state.setRenderToolCalls);
  const eventsLogLevel = useEventLogStore((state) => state.eventsLogLevel);
  const setEventsLogLevel = useEventLogStore((state) => state.setEventsLogLevel);

  return (
    <Dialog>
      <DialogTrigger
        aria-label="Open settings"
        className={buttonVariants({ variant: 'outline', size: 'icon' })}
      >
        <RiSettings3Line className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader className="place-items-start text-left">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure UI behavior for this realtime experience.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <SettingRow
            section="Recording"
            label="Events log level"
            value={eventsLogLevel}
            options={LOG_LEVEL_OPTIONS}
            onChange={setEventsLogLevel}
            help={
              <>
                Decides which transport events are <strong>captured</strong> into the panel.
                <code> info</code> keeps only structural events, so anything it skips is gone for
                good — it is never recorded.
              </>
            }
          />
          <SettingRow
            section="Display"
            label="Render tool calls"
            value={renderToolCalls ? 'true' : 'false'}
            options={RENDER_TOOL_CALL_OPTIONS}
            onChange={(value) => setRenderToolCalls(value === 'true')}
            help="Hides every tool-call event from the list without discarding it: argument deltas, completed arguments, and the function_call / function_call_output items. Wider than the Tools chip, which only covers completed arguments."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsPanel;
