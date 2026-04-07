import type { FieldSpec, Value } from '@monkeytab/core';

export interface CellEditorProps {
  value: Value;
  field: FieldSpec;
  rowId: string;
  onSave: (value: Value) => void;
  onCancel: () => void;
  /** Consumer-provided file upload handler. Returns the permanent URL. */
  onUpload?: (file: File, fieldType: string) => Promise<string>;
}
