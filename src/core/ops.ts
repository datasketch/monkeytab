/**
 * Operation types for batch mutations
 * These represent atomic changes that can be applied to the database
 */

import type { Value } from './types.ts';

// =============================================================================
// Operation Types
// =============================================================================

export type Op = InsertRecordOp | UpdateRecordOp | DeleteRecordOp;

export interface InsertRecordOp {
  type: 'InsertRecord';
  tableId: string;
  recordId: string;
  values: Record<string, Value>;
}

export interface UpdateRecordOp {
  type: 'UpdateRecord';
  tableId: string;
  recordId: string;
  /** Fields to set */
  values: Record<string, Value>;
}

export interface DeleteRecordOp {
  type: 'DeleteRecord';
  tableId: string;
  recordId: string;
}

// =============================================================================
// Operation Builders
// =============================================================================

export function insertRecord(
  tableId: string,
  recordId: string,
  values: Record<string, Value>
): InsertRecordOp {
  return {
    type: 'InsertRecord',
    tableId,
    recordId,
    values,
  };
}

export function updateRecord(
  tableId: string,
  recordId: string,
  values: Record<string, Value>
): UpdateRecordOp {
  return {
    type: 'UpdateRecord',
    tableId,
    recordId,
    values,
  };
}

export function deleteRecord(tableId: string, recordId: string): DeleteRecordOp {
  return {
    type: 'DeleteRecord',
    tableId,
    recordId,
  };
}

// =============================================================================
// Batch Operations
// =============================================================================

export interface ApplyOpsArgs {
  baseId: string;
  ops: Op[];
}

export interface ApplyOpsResult {
  /** Number of operations applied */
  applied: number;
  /** Any errors that occurred (operation index -> error) */
  errors?: Record<number, string>;
}
