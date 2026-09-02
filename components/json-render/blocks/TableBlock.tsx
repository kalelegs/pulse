'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { TBlockComponent } from '@/lib/json-render/blocks';

export const TableBlock: TBlockComponent<'TableBlock'> = ({ props, loading }) => {
  const columns = props.columns ?? [];
  const rows = props.rows ?? [];

  if (loading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (columns.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <Table>
        {/*
          A real `<caption>` rather than a sibling `<p>`: it is what associates
          the description with the table for assistive tech. The default
          `mt-4 text-sm` centred treatment floats it far enough from the last row
          to read as unrelated body copy, so it is pulled in tight and aligned to
          the first column.
        */}
        {props.caption ? (
          <TableCaption className="mt-2 text-left text-xs">{props.caption}</TableCaption>
        ) : null}
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={`${column}-${index}`}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={`row-${rowIndex}-${row[0] ?? ''}`}>
              {columns.map((column, cellIndex) => (
                <TableCell key={`${column}-${cellIndex}`}>{row[cellIndex] ?? ''}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
