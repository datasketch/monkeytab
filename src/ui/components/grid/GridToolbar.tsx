import { useState, useRef, useEffect } from 'react';
import type { RowHeightOption } from './Grid.tsx';
import { useI18n } from '../../i18n/index.ts';

const ROW_HEIGHT_ICONS: Record<RowHeightOption, string> = {
  short: '▬',
  medium: '▬▬',
  tall: '▬▬▬',
  'extra-tall': '▬▬▬▬',
  fit: '↕',
};

interface GridToolbarProps {
  onAddRow?: (count?: number) => void;
  isAdding?: boolean;
  rowHeight?: RowHeightOption;
  onRowHeightChange?: (height: RowHeightOption) => void;
  showRowNumbers?: boolean;
  onShowRowNumbersChange?: (show: boolean) => void;
  selectedCount?: number;
  onDeleteSelected?: () => void;
  totalRecords?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeFilterCount?: number;
  filterOpen?: boolean;
  onFilterToggle?: () => void;
}

export function GridToolbar({
  onAddRow,
  isAdding,
  rowHeight = 'medium',
  onRowHeightChange,
  showRowNumbers = false,
  onShowRowNumbersChange,
  selectedCount = 0,
  onDeleteSelected,
  totalRecords,
  searchQuery = '',
  onSearchChange,
  activeFilterCount = 0,
  filterOpen = false,
  onFilterToggle,
}: GridToolbarProps) {
  const { t } = useI18n();
  const [heightMenuOpen, setHeightMenuOpen] = useState(false);
  const [addRowMenuOpen, setAddRowMenuOpen] = useState(false);
  const heightMenuRef = useRef<HTMLDivElement>(null);
  const addRowMenuRef = useRef<HTMLDivElement>(null);

  const ROW_HEIGHT_OPTIONS: { value: RowHeightOption; label: string; icon: string }[] = [
    { value: 'short', label: t('toolbar.rowHeight.short'), icon: ROW_HEIGHT_ICONS.short },
    { value: 'medium', label: t('toolbar.rowHeight.medium'), icon: ROW_HEIGHT_ICONS.medium },
    { value: 'tall', label: t('toolbar.rowHeight.tall'), icon: ROW_HEIGHT_ICONS.tall },
    { value: 'extra-tall', label: t('toolbar.rowHeight.extraTall'), icon: ROW_HEIGHT_ICONS['extra-tall'] },
    { value: 'fit', label: t('toolbar.rowHeight.fit'), icon: ROW_HEIGHT_ICONS.fit },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (heightMenuRef.current && !heightMenuRef.current.contains(e.target as Node)) {
        setHeightMenuOpen(false);
      }
    };
    if (heightMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [heightMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addRowMenuRef.current && !addRowMenuRef.current.contains(e.target as Node)) {
        setAddRowMenuOpen(false);
      }
    };
    if (addRowMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [addRowMenuOpen]);

  const currentOption = ROW_HEIGHT_OPTIONS.find(opt => opt.value === rowHeight);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
      }}
    >
      {/* Add Row button with dropdown */}
      {onAddRow && (
        <div ref={addRowMenuRef} style={{ position: 'relative', display: 'flex' }}>
          <button
            onClick={() => onAddRow(1)}
            disabled={isAdding}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              background: 'transparent',
              color: isAdding ? '#9ca3af' : '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '6px 0 0 6px',
              borderRight: 'none',
              fontSize: '13px',
              cursor: isAdding ? 'not-allowed' : 'pointer',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 500 }}>+</span>
            <span>{isAdding ? t('toolbar.adding') : t('toolbar.addRow')}</span>
          </button>
          <button
            onClick={() => setAddRowMenuOpen(!addRowMenuOpen)}
            disabled={isAdding}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 6px',
              background: 'transparent',
              color: isAdding ? '#9ca3af' : '#9ca3af',
              border: '1px solid #e5e7eb',
              borderRadius: '0 6px 6px 0',
              fontSize: '10px',
              cursor: isAdding ? 'not-allowed' : 'pointer',
            }}
          >
            ▼
          </button>
          {addRowMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '120px',
                overflow: 'hidden',
                padding: '4px 0',
              }}
            >
              {[1, 5, 10].map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    onAddRow(count);
                    setAddRowMenuOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '7px 14px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#374151',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {t('toolbar.addRows', { count })}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Total records count */}
      {totalRecords !== undefined && (
        <span
          style={{
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          {t('toolbar.records', { count: totalRecords })}
        </span>
      )}

      {/* Selected rows indicator and bulk actions */}
      {selectedCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#1d4ed8',
          }}
        >
          <span style={{ fontWeight: 500 }}>{t('toolbar.selected', { count: selectedCount })}</span>
          {onDeleteSelected && (
            <button
              onClick={onDeleteSelected}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              title={t('toolbar.deleteSelected')}
            >
              {t('toolbar.delete')}
            </button>
          )}
        </div>
      )}

      {/* Search */}
      {onSearchChange && (
        <SearchInput
          initialValue={searchQuery}
          onSearchChange={onSearchChange}
          placeholder={t('toolbar.search.placeholder')}
        />
      )}

      {/* Filter button */}
      {onFilterToggle && (
        <button
          onClick={onFilterToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: filterOpen || activeFilterCount > 0 ? '#eff6ff' : 'white',
            border: `1px solid ${filterOpen || activeFilterCount > 0 ? '#bfdbfe' : '#e5e7eb'}`,
            borderRadius: '6px',
            fontSize: '13px',
            color: filterOpen || activeFilterCount > 0 ? '#2563eb' : '#374151',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '12px' }}>&#9783;</span>
          <span>{t('toolbar.filter')}</span>
          {activeFilterCount > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              fontSize: '10px',
              fontWeight: 600,
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Row numbers toggle */}
      {onShowRowNumbersChange && (
        <button
          onClick={() => onShowRowNumbersChange(!showRowNumbers)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: showRowNumbers ? '#eff6ff' : 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '13px',
            color: showRowNumbers ? '#2563eb' : '#374151',
            cursor: 'pointer',
          }}
          title={t('toolbar.showRowNumbers')}
        >
          <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>#</span>
          <span>{t('toolbar.rowNumbers')}</span>
        </button>
      )}

      {/* Row Height selector */}
      {onRowHeightChange && (
        <div ref={heightMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setHeightMenuOpen(!heightMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#374151',
              cursor: 'pointer',
            }}
            title="Row height"
          >
            <span style={{ fontSize: '10px', letterSpacing: '-2px', color: '#9ca3af' }}>
              {currentOption?.icon}
            </span>
            <span>{currentOption?.label}</span>
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>▼</span>
          </button>

          {heightMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '180px',
                overflow: 'hidden',
              }}
            >
              {ROW_HEIGHT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onRowHeightChange(option.value);
                    setHeightMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: rowHeight === option.value ? '#eff6ff' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: rowHeight === option.value ? '#2563eb' : '#374151',
                  }}
                  onMouseEnter={(e) => {
                    if (rowHeight !== option.value) {
                      e.currentTarget.style.background = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = rowHeight === option.value ? '#eff6ff' : 'transparent';
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      letterSpacing: '-2px',
                      color: rowHeight === option.value ? '#2563eb' : '#9ca3af',
                      minWidth: '30px',
                    }}
                  >
                    {option.icon}
                  </span>
                  <span>{option.label}</span>
                  {rowHeight === option.value && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Self-contained search input that keeps local state and debounces
 * notifications to the parent, so re-renders from query results
 * never steal focus.
 */
function SearchInput({ initialValue, onSearchChange, placeholder }: { initialValue: string; onSearchChange: (q: string) => void; placeholder: string }) {
  const [localValue, setLocalValue] = useState(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: string) => {
    setLocalValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearchChange(value), 300);
  };

  const handleClear = () => {
    setLocalValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onSearchChange('');
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span style={{
        position: 'absolute',
        left: '8px',
        fontSize: '14px',
        color: '#9ca3af',
        pointerEvents: 'none',
      }}>&#128269;</span>
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '6px 8px 6px 28px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '13px',
          width: '180px',
          outline: 'none',
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
      />
      {localValue && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#9ca3af',
            lineHeight: 1,
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
}
