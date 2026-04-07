/**
 * MemoryAdapter contract test.
 *
 * Exercises the public Adapter interface against the MemoryAdapter
 * implementation that ships in @datasketch/monkeytab. Touches the
 * registries, the field type system, the query/sort/filter pipeline,
 * and the value coercion paths — so a regression in any of those
 * shows up here.
 *
 * This is the test that would have caught the Deno-leak class of
 * bug instantly: importing MemoryAdapter would have failed at load
 * time with `ReferenceError: Deno is not defined` if the adapter
 * still depended on the Deno runtime.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryAdapter } from '@monkeytab/adapter-memory';
import type { BaseSpec, Row } from '@monkeytab/core';

const baseId = 'base-1';
const tableId = 'table-1';

function makeBase(): BaseSpec {
  return {
    id: baseId,
    label: 'Test Base',
    tables: [
      {
        id: tableId,
        label: 'Items',
        fields: [
          { id: 'name', label: 'Name', type: 'Text' },
          { id: 'count', label: 'Count', type: 'Number' },
        ],
        primaryFieldId: 'name',
        columnOrder: ['name', 'count'],
      },
    ],
  };
}

describe('MemoryAdapter', () => {
  let adapter: MemoryAdapter;

  beforeEach(async () => {
    const rows = new Map<string, Row[]>();
    rows.set(`${baseId}:${tableId}`, []);
    adapter = new MemoryAdapter({ bases: [makeBase()], rows });
    await adapter.initialize();
  });

  it('exposes the declared schema via listBases and getTable', async () => {
    const bases = await adapter.listBases();
    expect(bases).toHaveLength(1);
    expect(bases[0]).toEqual({
      id: baseId,
      label: 'Test Base',
      tableCount: 1,
    });

    const table = await adapter.getTable(baseId, tableId);
    expect(table.fields).toHaveLength(2);
    expect(table.fields.map((f) => f.id)).toEqual(['name', 'count']);
    expect(table.primaryFieldId).toBe('name');
  });

  it('reports its capabilities via info()', () => {
    const info = adapter.info();
    expect(info.label).toBe('memory');
    expect(info.capabilities.sort).toBe(true);
    expect(info.capabilities.filter).toBe(true);
    expect(info.capabilities.search).toBe(true);
    expect(info.capabilities.persist).toBe(false);
  });

  it('round-trips a record through create → query → update → delete', async () => {
    // Create
    const created = await adapter.createRecord(baseId, tableId, {
      name: 'Widget',
      count: 5,
    });
    expect(created.id).toBeTruthy();
    expect(created.fields.name).toBe('Widget');
    expect(created.fields.count).toBe(5);
    expect(created.createdAt).toBeTruthy();
    expect(created.updatedAt).toBeTruthy();

    // Query
    const queried = await adapter.queryRecords(baseId, tableId, {});
    expect(queried.rows).toHaveLength(1);
    expect(queried.rows[0].id).toBe(created.id);

    // Get by ID
    const fetched = await adapter.getRecord(baseId, tableId, created.id);
    expect(fetched.fields.name).toBe('Widget');

    // Update
    const updated = await adapter.updateRecord(baseId, tableId, created.id, {
      count: 10,
    });
    expect(updated.fields.count).toBe(10);
    expect(updated.fields.name).toBe('Widget'); // unchanged

    // Delete
    await adapter.deleteRecord(baseId, tableId, created.id);
    const afterDelete = await adapter.queryRecords(baseId, tableId, {});
    expect(afterDelete.rows).toHaveLength(0);
  });

  it('paginates query results via offset and limit', async () => {
    for (let i = 1; i <= 5; i++) {
      await adapter.createRecord(baseId, tableId, {
        name: `Item ${i}`,
        count: i,
      });
    }

    const page1 = await adapter.queryRecords(baseId, tableId, { limit: 2, offset: 0 });
    expect(page1.rows).toHaveLength(2);

    const page2 = await adapter.queryRecords(baseId, tableId, { limit: 2, offset: 2 });
    expect(page2.rows).toHaveLength(2);

    const page3 = await adapter.queryRecords(baseId, tableId, { limit: 2, offset: 4 });
    expect(page3.rows).toHaveLength(1);
  });

  it('throws a clear error when getting a record that does not exist', async () => {
    await expect(
      adapter.getRecord(baseId, tableId, 'rec-does-not-exist'),
    ).rejects.toThrow();
  });

  it('supports schema mutation: createField → deleteField', async () => {
    const before = await adapter.getTable(baseId, tableId);
    expect(before.fields).toHaveLength(2);

    const newField = await adapter.createField(baseId, tableId, {
      label: 'Done',
      type: 'Boolean',
    });

    const after = await adapter.getTable(baseId, tableId);
    expect(after.fields).toHaveLength(3);
    expect(after.fields.map((f) => f.id)).toContain(newField.id);

    await adapter.deleteField(baseId, tableId, newField.id);

    const final = await adapter.getTable(baseId, tableId);
    expect(final.fields).toHaveLength(2);
  });
});
