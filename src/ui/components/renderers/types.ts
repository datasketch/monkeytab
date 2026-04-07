import type { FieldSpec, Value } from '@monkeytab/core';

export interface CellRendererProps {
  value: Value;
  field: FieldSpec;
  rowId: string;
  cellHeight?: number;
}
