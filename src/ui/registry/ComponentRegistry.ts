import type { JSX } from 'react';
import type { FieldType } from '@monkeytab/core';
import type { CellRendererProps } from '../components/renderers/types.ts';
import type { CellEditorProps } from '../components/editors/types.ts';

export type CellRenderer = (props: CellRendererProps) => JSX.Element;
export type CellEditor = (props: CellEditorProps) => JSX.Element;

interface ComponentEntry {
  renderer: CellRenderer;
  editor: CellEditor;
}

class ComponentRegistry {
  private components = new Map<string, ComponentEntry>();

  /**
   * Register a renderer and editor for a field type
   */
  register(fieldType: FieldType | string, renderer: CellRenderer, editor: CellEditor): void {
    this.components.set(fieldType, { renderer, editor });
  }

  /**
   * Get the renderer for a field type
   */
  getRenderer(fieldType: FieldType | string): CellRenderer | undefined {
    return this.components.get(fieldType)?.renderer;
  }

  /**
   * Get the editor for a field type
   */
  getEditor(fieldType: FieldType | string): CellEditor | undefined {
    return this.components.get(fieldType)?.editor;
  }

  /**
   * Check if a field type has registered components
   */
  has(fieldType: FieldType | string): boolean {
    return this.components.has(fieldType);
  }

  /**
   * Get all registered field types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.components.keys());
  }
}

// Singleton instance
export const componentRegistry = new ComponentRegistry();
