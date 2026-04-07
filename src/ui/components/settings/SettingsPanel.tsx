import { useState, useRef, useEffect } from 'react';
import type { MonkeyTabSettings, FieldType, RowHeight } from '@monkeytab/core';
import { DEFAULT_SETTINGS } from '@monkeytab/core';
import { useI18n } from '../../i18n/index.ts';

interface SettingsPanelProps {
  settings: MonkeyTabSettings;
  onUpdateSettings: (settings: Partial<MonkeyTabSettings>) => void;
  onClose: () => void;
}

type TabId = 'general' | 'display' | 'formatting' | 'defaults';

const TAB_IDS: TabId[] = ['general', 'display', 'formatting', 'defaults'];

const ROW_HEIGHT_VALUES: RowHeight[] = ['short', 'medium', 'tall', 'extra-tall', 'fit'];

const FIELD_TYPE_VALUES: FieldType[] = ['Text', 'Number', 'Boolean', 'Date', 'SingleSelect'];

export function SettingsPanel({ settings, onUpdateSettings, onClose }: SettingsPanelProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const panelRef = useRef<HTMLDivElement>(null);

  // Merge with defaults for display
  const merged = { ...DEFAULT_SETTINGS, ...settings };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleToggle = (key: keyof MonkeyTabSettings, value: boolean) => {
    onUpdateSettings({ [key]: value });
  };

  const handleSelect = (key: keyof MonkeyTabSettings, value: string | number) => {
    onUpdateSettings({ [key]: value });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '560px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>{t('settings.title')}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#6b7280',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 20px',
        }}>
          {TAB_IDS.map((tabId) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              style={{
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tabId ? '2px solid #2563eb' : '2px solid transparent',
                color: activeTab === tabId ? '#2563eb' : '#6b7280',
                fontWeight: activeTab === tabId ? 600 : 400,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {t(`settings.tab.${tabId}`)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {activeTab === 'general' && (
            <GeneralTab
              settings={merged}
              onToggle={handleToggle}
            />
          )}
          {activeTab === 'display' && (
            <DisplayTab
              settings={merged}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          )}
          {activeTab === 'formatting' && (
            <FormattingTab
              settings={merged}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          )}
          {activeTab === 'defaults' && (
            <DefaultsTab
              settings={merged}
              onSelect={handleSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Toggle component
// =============================================================================

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid #f3f4f6',
    }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{label}</div>
        {description && (
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          border: 'none',
          background: checked ? '#2563eb' : '#d1d5db',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
          marginLeft: '12px',
        }}
      >
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'white',
          position: 'absolute',
          top: '2px',
          left: checked ? '18px' : '2px',
          transition: 'left 0.2s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}

// =============================================================================
// Select component
// =============================================================================

function SelectField({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: string | number) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid #f3f4f6',
    }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{label}</div>
        {description && (
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{description}</div>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          // Try parsing as number
          const num = Number(val);
          onChange(isNaN(num) ? val : num);
        }}
        style={{
          padding: '4px 8px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '13px',
          background: 'white',
          cursor: 'pointer',
          flexShrink: 0,
          marginLeft: '12px',
        }}
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// =============================================================================
// Tab Components
// =============================================================================

function GeneralTab({
  settings,
  onToggle,
}: {
  settings: Required<MonkeyTabSettings>;
  onToggle: (key: keyof MonkeyTabSettings, value: boolean) => void;
}) {
  const { t } = useI18n();
  return (
    <div>
      <Toggle label={t('settings.readOnly')} description={t('settings.readOnly.desc')} checked={settings.readOnly} onChange={(v) => onToggle('readOnly', v)} />
      <Toggle label={t('settings.allowCreateTable')} description={t('settings.allowCreateTable.desc')} checked={settings.allowCreateTable} onChange={(v) => onToggle('allowCreateTable', v)} />
      <Toggle label={t('settings.allowDeleteTable')} description={t('settings.allowDeleteTable.desc')} checked={settings.allowDeleteTable} onChange={(v) => onToggle('allowDeleteTable', v)} />
      <Toggle label={t('settings.allowCreateField')} description={t('settings.allowCreateField.desc')} checked={settings.allowCreateField} onChange={(v) => onToggle('allowCreateField', v)} />
      <Toggle label={t('settings.allowDeleteField')} description={t('settings.allowDeleteField.desc')} checked={settings.allowDeleteField} onChange={(v) => onToggle('allowDeleteField', v)} />
      <Toggle label={t('settings.allowCreateRecord')} description={t('settings.allowCreateRecord.desc')} checked={settings.allowCreateRecord} onChange={(v) => onToggle('allowCreateRecord', v)} />
      <Toggle label={t('settings.confirmBeforeDelete')} description={t('settings.confirmBeforeDelete.desc')} checked={settings.confirmBeforeDelete} onChange={(v) => onToggle('confirmBeforeDelete', v)} />
      <Toggle label={t('settings.allowColumnReorder')} description={t('settings.allowColumnReorder.desc')} checked={settings.allowColumnReorder} onChange={(v) => onToggle('allowColumnReorder', v)} />
      <Toggle label={t('settings.allowMultiColumnDrag')} description={t('settings.allowMultiColumnDrag.desc')} checked={settings.allowMultiColumnDrag} onChange={(v) => onToggle('allowMultiColumnDrag', v)} />
    </div>
  );
}

function DisplayTab({
  settings,
  onToggle,
  onSelect,
}: {
  settings: Required<MonkeyTabSettings>;
  onToggle: (key: keyof MonkeyTabSettings, value: boolean) => void;
  onSelect: (key: keyof MonkeyTabSettings, value: string | number) => void;
}) {
  const { t } = useI18n();
  const rowHeightOptions = ROW_HEIGHT_VALUES.map((v) => ({
    value: v,
    label: t(`toolbar.rowHeight.${v === 'extra-tall' ? 'extraTall' : v}`),
  }));
  return (
    <div>
      <SelectField
        label={t('settings.defaultRowHeight')}
        description={t('settings.defaultRowHeight.desc')}
        value={settings.defaultRowHeight}
        options={rowHeightOptions}
        onChange={(v) => onSelect('defaultRowHeight', v)}
      />
      <Toggle
        label={t('settings.showRowNumbers')}
        description={t('settings.showRowNumbers.desc')}
        checked={settings.defaultShowRowNumbers}
        onChange={(v) => onToggle('defaultShowRowNumbers', v)}
      />
      <Toggle
        label={t('settings.compactMode')}
        description={t('settings.compactMode.desc')}
        checked={settings.defaultCompactMode}
        onChange={(v) => onToggle('defaultCompactMode', v)}
      />
    </div>
  );
}

function FormattingTab({
  settings,
  onToggle,
  onSelect,
}: {
  settings: Required<MonkeyTabSettings>;
  onToggle: (key: keyof MonkeyTabSettings, value: boolean) => void;
  onSelect: (key: keyof MonkeyTabSettings, value: string | number) => void;
}) {
  const { t } = useI18n();
  return (
    <div>
      <SelectField
        label={t('settings.dateDisplayFormat')}
        description={t('settings.dateDisplayFormat.desc')}
        value={settings.dateDisplayFormat}
        options={[
          { value: 'iso', label: t('settings.dateFormat.iso') },
          { value: 'locale', label: t('settings.dateFormat.locale') },
          { value: 'relative', label: t('settings.dateFormat.relative') },
        ]}
        onChange={(v) => onSelect('dateDisplayFormat', v)}
      />
      <SelectField
        label={t('settings.numberDecimalPlaces')}
        description={t('settings.numberDecimalPlaces.desc')}
        value={settings.numberDecimalPlaces}
        options={[
          { value: 0, label: '0' },
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
        ]}
        onChange={(v) => onSelect('numberDecimalPlaces', v)}
      />
      <Toggle
        label={t('settings.thousandsSeparator')}
        description={t('settings.thousandsSeparator.desc')}
        checked={settings.numberThousandsSeparator}
        onChange={(v) => onToggle('numberThousandsSeparator', v)}
      />
    </div>
  );
}

function DefaultsTab({
  settings,
  onSelect,
}: {
  settings: Required<MonkeyTabSettings>;
  onSelect: (key: keyof MonkeyTabSettings, value: string | number) => void;
}) {
  const { t } = useI18n();
  const fieldTypeOptions = FIELD_TYPE_VALUES.map((v) => ({
    value: v,
    label: t(`fieldType.${v}`),
  }));
  return (
    <div>
      <SelectField
        label={t('settings.defaultColumns')}
        description={t('settings.defaultColumns.desc')}
        value={settings.newTableColumns}
        options={[
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
          { value: 6, label: '6' },
          { value: 8, label: '8' },
          { value: 10, label: '10' },
        ]}
        onChange={(v) => onSelect('newTableColumns', v)}
      />
      <SelectField
        label={t('settings.defaultRows')}
        description={t('settings.defaultRows.desc')}
        value={settings.newTableRows}
        options={[
          { value: 0, label: '0' },
          { value: 3, label: '3' },
          { value: 5, label: '5' },
          { value: 10, label: '10' },
          { value: 20, label: '20' },
        ]}
        onChange={(v) => onSelect('newTableRows', v)}
      />
      <SelectField
        label={t('settings.defaultFieldType')}
        description={t('settings.defaultFieldType.desc')}
        value={settings.newTableDefaultFieldType}
        options={fieldTypeOptions}
        onChange={(v) => onSelect('newTableDefaultFieldType', v)}
      />
    </div>
  );
}
