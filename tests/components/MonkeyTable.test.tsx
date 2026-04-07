/**
 * MonkeyTable component test (mounted via React Testing Library).
 *
 * This is a real mount via @testing-library/react — not a renderToString
 * smoke test. That matters for two reasons:
 *
 *   1. It actually verifies behavior. The component runs through its
 *      full mount lifecycle: useEffect fires, the MemoryAdapter
 *      initializes, the loading spinner is replaced by the real grid
 *      shell (toolbar, headers, footer), and registerDefaults() loads
 *      every renderer/editor into the component registry.
 *
 *   2. It exercises hundreds of functions across the UI layer in one
 *      mount — Grid, GridHeader, GridToolbar, PaginationBar, the
 *      pagination footer, the i18n provider, the GridStore zustand,
 *      the React Query client, all the toolbar sub-components.
 *      That's what carries function coverage past the 15% floor the
 *      team enforces in vitest.config.ts.
 *
 * Note on assertions: jsdom doesn't run a real layout engine, so
 * TanStack Virtual measures the scroll container as 0×0 and renders
 * zero visible row cells. Headers, toolbar, and the "Showing N of M
 * records" footer all render fine — they don't go through the row
 * virtualizer — so we assert against those instead of cell content.
 * Cell-level rendering is deeper component territory that belongs in
 * the upstream private suite, where a real browser is available.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MonkeyTable } from '@monkeytab/browser';

describe('<MonkeyTable>', () => {
  it('mounts the full grid shell after adapter initialization', async () => {
    render(
      <MonkeyTable
        columns={[
          { id: 'Name' },
          { id: 'Score', type: 'Number', options: { precision: 1 } },
        ]}
        rows={[
          { Name: 'Alpha', Score: 9.5 },
          { Name: 'Beta', Score: 7.2 },
        ]}
        height={500}
      />,
    );

    // The pagination footer waits on the row count from the adapter.
    // If this appears, useEffect fired, the adapter initialized, the
    // BrowserClient resolved, and the React Query cache populated.
    await screen.findByText('Showing 2 of 2 records');
  });

  it('renders column headers for an empty rows array', async () => {
    render(
      <MonkeyTable
        columns={[{ id: 'Name' }, { id: 'Score', type: 'Number' }]}
        rows={[]}
      />,
    );

    // findAllByText is safer than findByText for header text — the
    // column label can show up in multiple aria contexts (header cell,
    // column menu) and getByText would throw on multiple matches.
    const matches = await screen.findAllByText('Name');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('mounts cleanly when a column declares a custom render prop', async () => {
    render(
      <MonkeyTable
        columns={[
          {
            id: 'Name',
            render: (value) => <strong>{String(value)}</strong>,
          },
        ]}
        rows={[{ Name: 'Custom Alice' }]}
      />,
    );

    // We can't assert on the rendered cell (jsdom virtualization caveat
    // above) — but we CAN assert that the column-config processing path
    // didn't throw when wrapping the user's render function.
    await screen.findByText('Showing 1 of 1 records');
  });

  it('mounts in read-only mode with editable=false', async () => {
    render(
      <MonkeyTable
        columns={[{ id: 'Name' }]}
        rows={[{ Name: 'Read Only' }]}
        editable={false}
      />,
    );

    await screen.findByText('Showing 1 of 1 records');
  });
});
