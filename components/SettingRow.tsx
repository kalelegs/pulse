'use client';

import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type TSettingOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type TSettingRowProps<TValue extends string> = {
  /** Small uppercase group heading above the row (e.g. "Recording"). */
  section: string;
  label: string;
  value: TValue;
  options: readonly TSettingOption<TValue>[];
  onChange: (value: TValue) => void;
  /** One or two sentences on what the setting actually does. */
  help: ReactNode;
};

/** One labelled select in the settings dialog, with its section heading and help copy. */
const SettingRow = <TValue extends string>({
  section,
  label,
  value,
  options,
  onChange,
  help,
}: TSettingRowProps<TValue>) => {
  const onValueChange = (next: string | null) => {
    const match = options.find((option) => option.value === next);
    if (match) {
      onChange(match.value);
    }
  };

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {section}
      </p>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-xs">{help}</p>
    </div>
  );
};

export default SettingRow;
