import { useState } from 'react';
import type { FieldSpec, FilterGroup, FilterCondition, FilterOperator, Value } from '@monkeytab/core';
import { useI18n } from '../../i18n/index.ts';

interface FilterBuilderProps {
  fields: FieldSpec[];
  filterGroup?: FilterGroup;
  onChange: (filter: FilterGroup | undefined) => void;
  onClose: () => void;
}

const OPERATOR_I18N_KEYS: Record<FilterOperator, string> = {
  eq: 'filter.op.equals',
  neq: 'filter.op.notEquals',
  lt: 'filter.op.lt',
  lte: 'filter.op.lte',
  gt: 'filter.op.gt',
  gte: 'filter.op.gte',
  contains: 'filter.op.contains',
  does_not_contain: 'filter.op.notContains',
  starts_with: 'filter.op.startsWith',
  ends_with: 'filter.op.endsWith',
  is_empty: 'filter.op.isEmpty',
  is_not_empty: 'filter.op.isNotEmpty',
  is_any_of: 'filter.op.isAnyOf',
  is_none_of: 'filter.op.isNoneOf',
  has_any_of: 'filter.op.isAnyOf',
  has_all_of: 'filter.op.isAnyOf',
  has_none_of: 'filter.op.isNoneOf',
};

function getOperatorsForType(type: string): FilterOperator[] {
  switch (type) {
    case 'Text':
      return ['eq', 'neq', 'contains', 'does_not_contain', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'];
    case 'Number':
      return ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'is_empty', 'is_not_empty'];
    case 'Boolean':
      return ['eq', 'neq', 'is_empty', 'is_not_empty'];
    case 'Date':
      return ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'is_empty', 'is_not_empty'];
    case 'SingleSelect':
      return ['eq', 'neq', 'is_empty', 'is_not_empty'];
    case 'MultiSelect':
      return ['contains', 'does_not_contain', 'is_empty', 'is_not_empty'];
    default:
      return ['eq', 'neq', 'is_empty', 'is_not_empty'];
  }
}

function needsValue(op: FilterOperator): boolean {
  return op !== 'is_empty' && op !== 'is_not_empty';
}

interface FilterRow {
  fieldId: string;
  operator: FilterOperator;
  value: string;
}

function conditionToRow(cond: FilterCondition): FilterRow {
  return {
    fieldId: cond.fieldId,
    operator: cond.operator,
    value: cond.value !== null && cond.value !== undefined ? String(cond.value) : '',
  };
}

function rowToCondition(row: FilterRow, fields: FieldSpec[]): FilterCondition {
  const field = fields.find((f) => f.id === row.fieldId);
  let value: Value = row.value;

  if (field) {
    switch (field.type) {
      case 'Number':
        value = row.value === '' ? null : Number(row.value);
        break;
      case 'Boolean':
        value = row.value === 'true';
        break;
      default:
        value = row.value;
    }
  }

  return {
    fieldId: row.fieldId,
    operator: row.operator,
    value: needsValue(row.operator) ? value : undefined,
  };
}

export function FilterBuilder({ fields, filterGroup, onChange, onClose }: FilterBuilderProps) {
  const { t } = useI18n();
  const defaultFieldId = fields.length > 0 ? fields[0].id : '';

  const initialRows: FilterRow[] = filterGroup
    ? (filterGroup.conditions as FilterCondition[]).map(conditionToRow)
    : [];

  const [rows, setRows] = useState<FilterRow[]>(
    initialRows.length > 0 ? initialRows : [{ fieldId: defaultFieldId, operator: 'contains', value: '' }]
  );
  const [conjunction, setConjunction] = useState<'and' | 'or'>(
    filterGroup?.conjunction ?? 'and'
  );

  const handleApply = () => {
    const conditions = rows
      .filter((r) => r.fieldId)
      .map((r) => rowToCondition(r, fields));

    if (conditions.length === 0) {
      onChange(undefined);
    } else {
      onChange({ conjunction, conditions });
    }
  };

  const handleClearAll = () => {
    setRows([{ fieldId: defaultFieldId, operator: 'contains', value: '' }]);
    onChange(undefined);
  };

  const handleAddRow = () => {
    setRows([...rows, { fieldId: defaultFieldId, operator: 'contains', value: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      handleClearAll();
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index: number, updates: Partial<FilterRow>) => {
    setRows(rows.map((r, i) => {
      if (i !== index) return r;
      const updated = { ...r, ...updates };
      // When field changes, reset operator to first valid one
      if (updates.fieldId && updates.fieldId !== r.fieldId) {
        const field = fields.find((f) => f.id === updates.fieldId);
        const ops = getOperatorsForType(field?.type ?? 'Text');
        updated.operator = ops[0];
        updated.value = '';
      }
      return updated;
    }));
  };

  return (
    <div style={{
      padding: '12px 0',
      borderBottom: '1px solid #e5e7eb',
      background: '#fafafa',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        padding: '0 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>{t('filter.title')}</span>
          {rows.length > 1 && (
            <button
              onClick={() => setConjunction(conjunction === 'and' ? 'or' : 'and')}
              style={{
                padding: '2px 8px',
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {conjunction}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleApply}
            style={{
              padding: '4px 12px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t('filter.apply')}
          </button>
          <button
            onClick={handleClearAll}
            style={{
              padding: '4px 8px',
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            {t('filter.clearAll')}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#6b7280',
              padding: '0 4px',
            }}
          >
            &times;
          </button>
        </div>
      </div>

      {/* Filter rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 20px' }}>
        {rows.map((row, index) => {
          const field = fields.find((f) => f.id === row.fieldId);
          const operators = getOperatorsForType(field?.type ?? 'Text');

          return (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {/* Conjunction label for 2nd+ rows */}
              <span style={{
                minWidth: '32px',
                fontSize: '11px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}>
                {index === 0 ? t('filter.where') : conjunction === 'and' ? t('filter.and') : t('filter.or')}
              </span>

              {/* Column selector */}
              <select
                value={row.fieldId}
                onChange={(e) => handleUpdateRow(index, { fieldId: e.target.value })}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  background: 'white',
                  minWidth: '120px',
                }}
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>

              {/* Operator selector */}
              <select
                value={row.operator}
                onChange={(e) => handleUpdateRow(index, { operator: e.target.value as FilterOperator })}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  background: 'white',
                  minWidth: '130px',
                }}
              >
                {operators.map((op) => (
                  <option key={op} value={op}>{t(OPERATOR_I18N_KEYS[op] as any)}</option>
                ))}
              </select>

              {/* Value input */}
              {needsValue(row.operator) && (
                field?.type === 'Boolean' ? (
                  <select
                    value={row.value}
                    onChange={(e) => handleUpdateRow(index, { value: e.target.value })}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '13px',
                      background: 'white',
                      flex: 1,
                    }}
                  >
                    <option value="true">{t('filter.true')}</option>
                    <option value="false">{t('filter.false')}</option>
                  </select>
                ) : (
                  <input
                    type={field?.type === 'Number' ? 'number' : field?.type === 'Date' ? 'date' : 'text'}
                    value={row.value}
                    onChange={(e) => handleUpdateRow(index, { value: e.target.value })}
                    placeholder={t('filter.valuePlaceholder')}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '13px',
                      flex: 1,
                      outline: 'none',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                )
              )}

              {/* Remove button */}
              <button
                onClick={() => handleRemoveRow(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#9ca3af',
                  padding: '0 4px',
                  lineHeight: 1,
                }}
                title={t('filter.remove')}
              >
                &times;
              </button>
            </div>
          );
        })}

        {/* Add filter button */}
        <button
          onClick={handleAddRow}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#2563eb',
            marginTop: '4px',
          }}
        >
          <span>+</span>
          <span>{t('filter.add')}</span>
        </button>
      </div>
    </div>
  );
}
