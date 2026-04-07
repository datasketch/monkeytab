import { useState, useEffect } from 'react';
import type { FieldSpec, ComputedFieldOptions, Value } from '@monkeytab/core';
import { useClient } from '../../client/ClientContext.tsx';
import { useI18n } from '../../i18n/index.ts';

interface FormulaBuilderProps {
  fields: FieldSpec[];
  existingOptions?: ComputedFieldOptions;
  onSave: (label: string, options: ComputedFieldOptions) => void;
  onCancel: () => void;
}

interface FunctionInfo {
  name: string;
  category: string;
  description: string;
  inputTypes: string[];
  params?: Array<{ name: string; type: string; default?: unknown }>;
}

const CATEGORIES = ['text', 'number', 'date', 'logic'];

export function FormulaBuilder({ fields, existingOptions, onSave, onCancel }: FormulaBuilderProps) {
  const { t } = useI18n();
  const client = useClient();
  const [functions, setFunctions] = useState<FunctionInfo[]>([]);
  const [selectedFn, setSelectedFn] = useState<string>(existingOptions?.functionName ?? '');
  const [inputFieldIds, setInputFieldIds] = useState<string[]>(existingOptions?.inputFieldIds ?? []);
  const [params, setParams] = useState<Record<string, unknown>>(existingOptions?.params ?? {});
  const [fieldName, setFieldName] = useState('');
  const [preview, setPreview] = useState<Value[]>([]);
  const [loading, setLoading] = useState(true);

  // Load functions
  useEffect(() => {
    client.listFunctions().then((fns) => {
      const list = Array.isArray(fns) ? fns : [];
      setFunctions(list);
      if (!selectedFn && list.length > 0) {
        setSelectedFn(list[0].name);
      }
      setLoading(false);
    }).catch(() => {
      setFunctions([]);
      setLoading(false);
    });
  }, []);

  const currentFn = functions.find((f) => f.name === selectedFn);

  // Auto-resize input field ids when function changes
  useEffect(() => {
    if (!currentFn) return;
    const needed = currentFn.inputTypes.length;
    if (inputFieldIds.length < needed) {
      const defaultFieldId = fields.length > 0 ? fields[0].id : '';
      setInputFieldIds([
        ...inputFieldIds,
        ...Array(needed - inputFieldIds.length).fill(defaultFieldId),
      ]);
    } else if (inputFieldIds.length > needed && needed > 0) {
      setInputFieldIds(inputFieldIds.slice(0, needed));
    }

    // Set default params
    if (currentFn.params) {
      const newParams: Record<string, unknown> = {};
      for (const p of currentFn.params) {
        newParams[p.name] = params[p.name] ?? p.default ?? '';
      }
      setParams(newParams);
    }
  }, [selectedFn, currentFn]);

  // Auto-generate field name
  useEffect(() => {
    if (!fieldName && currentFn) {
      const inputNames = inputFieldIds
        .map((id) => fields.find((f) => f.id === id)?.label ?? '')
        .filter(Boolean);
      if (inputNames.length > 0) {
        setFieldName(`${currentFn.name}(${inputNames.join(', ')})`);
      } else {
        setFieldName(currentFn.name);
      }
    }
  }, [selectedFn, inputFieldIds]);

  // Compute preview for first 3 rows (simplified — we just show the formula description)
  useEffect(() => {
    if (!selectedFn || inputFieldIds.length === 0) {
      setPreview([]);
      return;
    }
    // Preview is done client-side for now
    setPreview([]);
  }, [selectedFn, inputFieldIds, params]);

  const handleSave = () => {
    if (!selectedFn || !fieldName.trim()) return;
    onSave(fieldName.trim(), {
      functionName: selectedFn,
      inputFieldIds: inputFieldIds.filter(Boolean),
      params: Object.keys(params).length > 0 ? params : undefined,
    });
  };

  if (loading) {
    return <div style={{ padding: '20px', color: '#6b7280' }}>{t('formula.loading')}</div>;
  }

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
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '520px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
            {existingOptions ? t('formula.title.edit') : t('formula.title.add')}
          </h2>
          <button
            onClick={onCancel}
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

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Field name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
              {t('formula.fieldName')}
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder={t('formula.namePlaceholder')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Function picker */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
              {t('formula.function')}
            </label>
            <select
              value={selectedFn}
              onChange={(e) => {
                setSelectedFn(e.target.value);
                setFieldName(''); // Reset to auto-generate
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              {CATEGORIES.map((cat) => {
                const catFns = functions.filter((f) => f.category === cat);
                if (catFns.length === 0) return null;
                return (
                  <optgroup key={cat} label={t(`formula.category.${cat}`)}>
                    {catFns.map((fn) => (
                      <option key={fn.name} value={fn.name}>
                        {fn.name} - {fn.description}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            {currentFn && (
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                {currentFn.description}
              </div>
            )}
          </div>

          {/* Input columns */}
          {currentFn && currentFn.inputTypes.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                {t('formula.inputs')}
              </label>
              {currentFn.inputTypes.map((expectedType, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af', minWidth: '60px' }}>
                    {t('formula.input', { n: i + 1, type: expectedType })}
                  </span>
                  <select
                    value={inputFieldIds[i] ?? ''}
                    onChange={(e) => {
                      const newIds = [...inputFieldIds];
                      newIds[i] = e.target.value;
                      setInputFieldIds(newIds);
                      setFieldName(''); // Reset to auto-generate
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '13px',
                      background: 'white',
                    }}
                  >
                    <option value="">{t('formula.selectColumn')}</option>
                    {fields
                      .filter((f) => f.type !== 'Computed')
                      .map((f) => (
                        <option key={f.id} value={f.id}>{f.label} ({f.type})</option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Params */}
          {currentFn?.params && currentFn.params.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                {t('formula.parameters')}
              </label>
              {currentFn.params.map((p) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af', minWidth: '80px' }}>
                    {p.name}
                  </span>
                  <input
                    type={p.type === 'number' ? 'number' : 'text'}
                    value={String(params[p.name] ?? p.default ?? '')}
                    onChange={(e) => {
                      const val = p.type === 'number' ? Number(e.target.value) : e.target.value;
                      setParams({ ...params, [p.name]: val });
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Preview indicator */}
          {currentFn && (
            <div style={{
              padding: '10px 12px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#6b7280',
            }}>
              <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>fx</span>{' '}
              = {selectedFn}({inputFieldIds.map((id) => fields.find((f) => f.id === id)?.label ?? '?').join(', ')}
              {currentFn.params && currentFn.params.length > 0 && (
                <span>, {currentFn.params.map((p) => `${p.name}=${JSON.stringify(params[p.name] ?? p.default)}`).join(', ')}</span>
              )}
              )
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            {t('editor.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedFn || !fieldName.trim()}
            style={{
              padding: '8px 16px',
              background: !selectedFn || !fieldName.trim() ? '#93c5fd' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: !selectedFn || !fieldName.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {existingOptions ? t('formula.update') : t('formula.addField')}
          </button>
        </div>
      </div>
    </div>
  );
}
