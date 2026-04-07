import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/index.ts';

export interface PaginationBarProps {
  /** Total row count from the server */
  totalRows: number;
  /** Number of rows currently loaded */
  loadedRows: number;
  /** Current page (1-based) */
  page: number;
  /** Rows per page */
  pageSize: number;
  /** 'simple' = Previous/Next, 'load-more' = append button / infinite scroll */
  mode: 'simple' | 'load-more';
  /** Whether more data is being fetched */
  loading?: boolean;
  /** Is the table saving */
  saving?: boolean;
  /** Called when user navigates */
  onPageChange: (page: number) => void;
}

export function PaginationBar({
  totalRows,
  loadedRows,
  page,
  pageSize,
  mode,
  loading,
  saving,
  onPageChange,
}: PaginationBarProps) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRows);
  const hasMore = loadedRows < totalRows;
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: observe sentinel element
  useEffect(() => {
    if (mode !== 'load-more' || !hasMore || loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onPageChange(page + 1);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [mode, hasMore, loading, page, onPageChange]);

  const barStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '13px',
    color: '#6b7280',
    flexShrink: 0,
  };

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    fontSize: '13px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    background: disabled ? '#f9fafb' : 'white',
    color: disabled ? '#d1d5db' : '#374151',
    cursor: disabled ? 'default' : 'pointer',
  });

  if (mode === 'load-more') {
    return (
      <div style={{ flexShrink: 0 }}>
        <div style={barStyle}>
          <span>
            {t('pagination.rowCount' as any, { count: loadedRows })}
            {totalRows > loadedRows && ` / ${totalRows}`}
          </span>
          {saving && <span>{t('grid.saving')}</span>}
        </div>
        {hasMore && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={loading}
              style={{
                ...btnStyle(!!loading),
                padding: '6px 20px',
              }}
            >
              {loading ? t('pagination.loading' as any) : t('pagination.loadMore' as any)}
            </button>
          </div>
        )}
        {/* Sentinel for infinite scroll */}
        {hasMore && <div ref={sentinelRef} style={{ height: '1px' }} />}
      </div>
    );
  }

  // Simple pagination mode
  return (
    <div style={barStyle}>
      <span>
        {totalRows <= pageSize
          ? t('pagination.showingAll' as any, { total: totalRows })
          : t('pagination.showing' as any, { start, end, total: totalRows })}
        {saving && <span style={{ marginLeft: '12px' }}>{t('grid.saving')}</span>}
      </span>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            style={btnStyle(page <= 1)}
          >
            {t('pagination.previous' as any)}
          </button>
          <span style={{ fontSize: '13px', color: '#374151' }}>
            {t('pagination.page' as any, { current: page, total: totalPages })}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            style={btnStyle(page >= totalPages)}
          >
            {t('pagination.next' as any)}
          </button>
        </div>
      )}
    </div>
  );
}
