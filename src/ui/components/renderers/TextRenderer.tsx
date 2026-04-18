import type { CellRendererProps } from './types.ts';
import type { TextFieldOptions } from '@monkeytab/core';
import { useI18n } from '../../i18n/index.ts';

// Simple markdown parser for basic formatting
export function parseMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text** or __text__
    let match = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (match) {
      nodes.push(<strong key={key++}>{match[2]}</strong>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Italic: *text* or _text_
    match = remaining.match(/^(\*|_)(.+?)\1/);
    if (match) {
      nodes.push(<em key={key++}>{match[2]}</em>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Inline code: `code`
    match = remaining.match(/^`([^`]+)`/);
    if (match) {
      nodes.push(
        <code
          key={key++}
          style={{
            background: '#f3f4f6',
            padding: '1px 4px',
            borderRadius: '3px',
            fontSize: '0.9em',
            fontFamily: 'monospace',
          }}
        >
          {match[1]}
        </code>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Link: [text](url)
    match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      nodes.push(
        <a
          key={key++}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#2563eb', textDecoration: 'underline' }}
          onClick={(e) => e.stopPropagation()}
        >
          {match[1]}
        </a>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Strikethrough: ~~text~~
    match = remaining.match(/^~~(.+?)~~/);
    if (match) {
      nodes.push(<del key={key++}>{match[1]}</del>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Line break
    if (remaining.startsWith('\n')) {
      nodes.push(<br key={key++} />);
      remaining = remaining.slice(1);
      continue;
    }

    // Regular text - find next special character or end
    const nextSpecial = remaining.search(/[\*_`\[~\n]/);
    if (nextSpecial === -1) {
      nodes.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Special char didn't match a pattern, treat as regular text
      nodes.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      nodes.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return nodes;
}

function isJsonValue(value: unknown): boolean {
  return typeof value === 'object' && value !== null;
}

function tryParseJson(text: string): unknown | null {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch { /* not JSON */ }
  return null;
}

function JsonDisplay({ data }: { data: unknown }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <pre
      style={{
        margin: 0,
        fontSize: '11px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        color: '#374151',
        lineHeight: 1.4,
      }}
    >
      {json}
    </pre>
  );
}

export function TextRenderer({ value, field }: CellRendererProps) {
  const { t } = useI18n();
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  const options = field.options as TextFieldOptions | undefined;
  const isJson = options?.json ?? false;
  const isRichText = options?.richText ?? false;
  const isMultiline = options?.multiline ?? false;

  // JSON mode: explicit option or auto-detect objects
  if (isJson || isJsonValue(value)) {
    const data = isJsonValue(value) ? value : tryParseJson(String(value));
    if (data !== null) {
      return <JsonDisplay data={data} />;
    }
  }

  const text = String(value);

  // If json option is set but value is a string that isn't valid JSON, try parsing
  // (already handled above — fall through to plain text)

  // Rich text: Parse and render markdown
  if (isRichText) {
    return (
      <span
        style={{
          whiteSpace: isMultiline ? 'pre-wrap' : 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
        }}
      >
        {parseMarkdown(text)}
      </span>
    );
  }

  // Multiline: Show with line breaks preserved
  if (isMultiline) {
    return (
      <span
        style={{
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
        }}
      >
        {text}
      </span>
    );
  }

  // Single line text
  return <span style={{ whiteSpace: 'nowrap' }}>{text}</span>;
}
