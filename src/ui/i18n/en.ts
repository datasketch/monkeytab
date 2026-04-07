import type { I18nStrings } from './strings.ts';

export const en: I18nStrings = {
  // Toolbar
  'toolbar.search.placeholder': 'Search...',
  'toolbar.filter': 'Filter',
  'toolbar.rowNumbers': 'Row #',
  'toolbar.showRowNumbers': 'Show row numbers',
  'toolbar.addRow': 'Row',
  'toolbar.addRows': 'Add {count} rows',
  'toolbar.adding': 'Adding...',
  'toolbar.delete': 'Delete',
  'toolbar.deleteSelected': 'Delete selected rows',
  'toolbar.records': '{count} records',
  'toolbar.selected': '{count} selected',
  'toolbar.rowHeight.short': 'Short',
  'toolbar.rowHeight.medium': 'Medium',
  'toolbar.rowHeight.tall': 'Tall',
  'toolbar.rowHeight.extraTall': 'Extra Tall',
  'toolbar.rowHeight.fit': 'Fit to content',

  // Grid / cells
  'grid.empty': '',
  'grid.editing': 'Editing...',
  'grid.loading': 'Loading...',
  'grid.loadingTable': 'Loading table data...',
  'grid.tableNotFound': 'Table not found',
  'grid.saving': 'Saving...',
  'grid.showing': 'Showing {shown} of {total} records',

  // Column header context menu
  'column.rename': 'Rename column',
  'column.customize': 'Customize field',
  'column.changeType': 'Change type',
  'column.sortAZ': 'Sort A → Z',
  'column.sortZA': 'Sort Z → A',
  'column.sortAsc.Number': 'Sort 1 → 9',
  'column.sortDesc.Number': 'Sort 9 → 1',
  'column.sortAsc.Date': 'Sort oldest → newest',
  'column.sortDesc.Date': 'Sort newest → oldest',
  'column.sortAsc.Boolean': 'Sort false → true',
  'column.sortDesc.Boolean': 'Sort true → false',
  'column.sortAsc.Rating': 'Sort lowest → highest',
  'column.sortDesc.Rating': 'Sort highest → lowest',
  'column.sortNone': 'Remove sort',
  'column.hide': 'Hide column',
  'column.delete': 'Delete column',
  'column.options': 'Column options',
  'column.back': 'Back',
  'column.validating': 'Validating...',

  // Column type change confirmation
  'column.convert.title': 'Change field type',
  'column.convert.message': 'Convert {field} from {from} to {to}?',
  'column.convert.compatible': '{n} of {total} values compatible',
  'column.convert.incompatible': '{n} value(s) will be set to empty',
  'column.convert.cancel': 'Cancel',
  'column.convert.confirm': 'Convert',

  // Row actions
  'row.dragToReorder': 'Drag to reorder',
  'row.select': 'Select row',
  'row.options': 'Row options',
  'row.view': 'View record',
  'row.duplicate': 'Duplicate',
  'row.insert': 'Insert row',
  'row.delete': 'Delete',
  'row.deleteConfirm': 'Are you sure you want to delete this row?',

  // Undo / redo
  'undo.cellEdit': 'Undid cell edit',
  'redo.cellEdit': 'Redid cell edit',
  'undo.rowCreate': 'Undid row creation',
  'redo.rowCreate': 'Redid row creation',
  'undo.rowDelete': 'Undid row deletion',
  'redo.rowDelete': 'Redid row deletion',
  'undo.fieldCreate': 'Undid column creation',
  'redo.fieldCreate': 'Redid column creation',
  'undo.fieldDelete': 'Undid column deletion',
  'redo.fieldDelete': 'Redid column deletion',

  // Editors (shared)
  'editor.cancel': 'Cancel',
  'editor.done': 'Done',
  'editor.save': 'Save',
  'editor.escapeToCancel': 'Escape to cancel',
  'editor.uploading': 'Uploading...',
  'editor.uploadError': 'Upload failed',

  // Text editor
  'editor.text.title': 'Edit: {field}',
  'editor.text.charCount': '{count} / {max}',

  // Date editor
  'editor.date.placeholder': 'yyyy-mm-dd',
  'editor.date.openPicker': 'Open date picker',

  // Bool editor / renderer
  'bool.yes': 'Yes',
  'bool.no': 'No',

  // Select editors
  'select.clear': 'Clear selection',
  'select.clearAll': 'Clear all',
  'select.placeholder': 'Select options...',
  'select.selected': '{count} selected',

  // Image editor
  'editor.image.header': 'Images ({count})',
  'editor.image.urlPlaceholder': 'Image URL',
  'editor.image.remove': 'Remove image',
  'editor.image.copyUrl': 'Copy URL',
  'editor.image.openTab': 'Open in new tab',
  'editor.image.choose': 'Click to choose images',
  'editor.image.addMore': 'Add more images',
  'editor.image.constraints': 'Images only. Max {max}, up to {size} each',
  'editor.image.loadError': 'Image could not be loaded',

  // Audio editor
  'editor.audio.header': 'Audio ({count})',
  'editor.audio.urlPlaceholder': 'Audio URL',
  'editor.audio.remove': 'Remove audio',
  'editor.audio.choose': 'Click to choose audio files',
  'editor.audio.addMore': 'Add more audio',
  'editor.audio.constraints': 'Audio only. Max {max}, up to {size} each',

  // Video editor
  'editor.video.header': 'Videos ({count})',
  'editor.video.urlPlaceholder': 'Video URL',
  'editor.video.pasteUrl': 'Paste YouTube, Vimeo, or video URL...',
  'editor.video.addButton': 'Add',
  'editor.video.openLink': 'Open video link',
  'editor.video.uploadFile': 'Or upload a video file',
  'editor.video.remove': 'Remove video',
  'editor.video.choose': 'Click to choose videos',
  'editor.video.addMore': 'Add more videos',
  'editor.video.constraints': 'Max {max} videos, up to {size} each',

  // Attachment editor
  'editor.attachment.header': 'Attachments ({count})',
  'editor.attachment.fileBadge': 'FILE',
  'editor.attachment.choose': 'Click to choose files',
  'editor.attachment.constraints': 'Max {max} files, up to {size} each',

  // URL editor
  'editor.url.placeholder': 'https://example.com',
  'editor.url.labelPlaceholder': 'Display label (optional)',
  'editor.url.addLabel': '+ Add label',

  // Color editor
  'editor.color.placeholder': '#000000',
  'editor.color.presets': 'Presets',

  // Rating editor
  'editor.rating.instruction': 'Click to rate ({n}/{max})',

  // Date renderer
  'renderer.date.invalid': 'Invalid date',

  // Filter builder
  'filter.title': 'Filters',
  'filter.where': 'Where',
  'filter.and': 'and',
  'filter.or': 'or',
  'filter.apply': 'Apply',
  'filter.clearAll': 'Clear all',
  'filter.add': 'Add filter',
  'filter.remove': 'Remove filter',
  'filter.valuePlaceholder': 'Value...',
  'filter.true': 'True',
  'filter.false': 'False',
  'filter.op.equals': 'equals',
  'filter.op.notEquals': 'not equals',
  'filter.op.lt': 'less than',
  'filter.op.lte': 'less than or equal',
  'filter.op.gt': 'greater than',
  'filter.op.gte': 'greater than or equal',
  'filter.op.contains': 'contains',
  'filter.op.notContains': 'does not contain',
  'filter.op.startsWith': 'starts with',
  'filter.op.endsWith': 'ends with',
  'filter.op.isEmpty': 'is empty',
  'filter.op.isNotEmpty': 'is not empty',
  'filter.op.isAnyOf': 'is any of',
  'filter.op.isNoneOf': 'is none of',

  // Formula builder
  'formula.title.add': 'Add Computed Field',
  'formula.title.edit': 'Edit Formula',
  'formula.fieldName': 'Field Name',
  'formula.function': 'Function',
  'formula.inputs': 'Input Columns',
  'formula.parameters': 'Parameters',
  'formula.loading': 'Loading functions...',
  'formula.namePlaceholder': 'e.g., Full Name',
  'formula.selectColumn': 'Select column...',
  'formula.addField': 'Add Field',
  'formula.update': 'Update',

  // Record detail panel
  'record.title': 'Record Details',
  'record.close': 'Close',
  'record.empty': 'Empty',
  'record.created': 'Created: {date}',
  'record.updated': 'Updated: {date}',

  // Settings panel
  'settings.title': 'Settings',
  'settings.tab.general': 'General',
  'settings.tab.display': 'Display',
  'settings.tab.formatting': 'Formatting',
  'settings.tab.defaults': 'New Tables',

  // Field type labels
  'fieldType.Text': 'Text',
  'fieldType.Number': 'Number',
  'fieldType.Boolean': 'Boolean',
  'fieldType.Date': 'Date',
  'fieldType.SingleSelect': 'Single Select',
  'fieldType.MultiSelect': 'Multi Select',
  'fieldType.Attachment': 'Attachment',
  'fieldType.Image': 'Image',
  'fieldType.Audio': 'Audio',
  'fieldType.Video': 'Video',
  'fieldType.Color': 'Color',
  'fieldType.Rating': 'Rating',
  'fieldType.Email': 'Email',
  'fieldType.URL': 'URL',
  'fieldType.Phone': 'Phone',
  'fieldType.Computed': 'Computed',

  // Context menu
  'context.clearCell': 'Clear cell',
  'context.copy': 'Copy...',
  'context.back': 'Back',

  // Copy format labels
  'copy.value': 'Copy value',
  'copy.url': 'Copy URL',
  'copy.label': 'Copy label',
  'copy.both': 'Copy both',
  'copy.markdown': 'Copy as Markdown',
  'copy.displayText': 'Copy display text',
  'copy.email': 'Copy email',
  'copy.mailto': 'Copy as mailto',
  'copy.number': 'Copy number',
  'copy.tel': 'Copy as tel:',
  'copy.names': 'Copy names',
  'copy.json': 'Copy JSON',

  // Column (additional)
  'column.deleteConfirm': 'Delete this column? This cannot be undone.',
  'column.renamePrompt': 'New column name:',
  'column.convert.confirmPrompt': 'Convert to {type}? {compatible} of {total} values compatible, {incompatible} will be cleared.',

  // Add field panel
  'addField.title': 'Add field',
  'addField.header': 'New field',
  'addField.placeholder': 'Field name...',
  'addField.typeLabel': 'Type',
  'addField.submit': 'Add field',
  'addField.computed': 'Computed field...',

  // Hidden columns
  'column.hiddenCount': '+{count} hidden',
  'column.hiddenHeader': 'Hidden columns',

  // Settings labels
  'settings.readOnly': 'Read Only',
  'settings.readOnly.desc': 'Prevent all data modifications',
  'settings.allowCreateTable': 'Allow Create Table',
  'settings.allowCreateTable.desc': 'Allow creating new tables',
  'settings.allowDeleteTable': 'Allow Delete Table',
  'settings.allowDeleteTable.desc': 'Allow deleting tables',
  'settings.allowCreateField': 'Allow Create Field',
  'settings.allowCreateField.desc': 'Allow adding new columns',
  'settings.allowDeleteField': 'Allow Delete Field',
  'settings.allowDeleteField.desc': 'Allow removing columns',
  'settings.allowCreateRecord': 'Allow Create Record',
  'settings.allowCreateRecord.desc': 'Allow adding new rows',
  'settings.confirmBeforeDelete': 'Confirm Before Delete',
  'settings.confirmBeforeDelete.desc': 'Show confirmation dialog before destructive actions',
  'settings.allowColumnReorder': 'Allow Column Reorder',
  'settings.allowColumnReorder.desc': 'Enable drag-and-drop reordering of columns',
  'settings.allowMultiColumnDrag': 'Allow Multi-Column Drag',
  'settings.allowMultiColumnDrag.desc': 'Enable selecting and dragging multiple columns at once',
  'settings.defaultRowHeight': 'Default Row Height',
  'settings.defaultRowHeight.desc': 'Default row height for new tables',
  'settings.showRowNumbers': 'Show Row Numbers',
  'settings.showRowNumbers.desc': 'Display row numbers by default',
  'settings.compactMode': 'Compact Mode',
  'settings.compactMode.desc': 'Reduce spacing for denser display',
  'settings.dateDisplayFormat': 'Date Display Format',
  'settings.dateDisplayFormat.desc': 'How dates are displayed in the grid',
  'settings.dateFormat.iso': 'ISO (2024-01-15)',
  'settings.dateFormat.locale': 'Locale (Jan 15, 2024)',
  'settings.dateFormat.relative': 'Relative (2 days ago)',
  'settings.numberDecimalPlaces': 'Number Decimal Places',
  'settings.numberDecimalPlaces.desc': 'Default decimal places for numbers',
  'settings.thousandsSeparator': 'Thousands Separator',
  'settings.thousandsSeparator.desc': 'Display numbers with thousands separators (1,000)',
  'settings.defaultColumns': 'Default Columns',
  'settings.defaultColumns.desc': 'Number of columns when creating a new table',
  'settings.defaultRows': 'Default Rows',
  'settings.defaultRows.desc': 'Number of empty rows when creating a new table',
  'settings.defaultFieldType': 'Default Field Type',
  'settings.defaultFieldType.desc': 'Default type for new columns',

  // Confirm dialog
  'confirm.cancel': 'Cancel',
  'confirm.ok': 'OK',
  'confirm.deleteRow': 'Delete row',
  'confirm.deleteRow.message': 'Are you sure you want to delete this row?',
  'confirm.deleteColumn': 'Delete column',
  'confirm.deleteColumn.message': 'Delete column "{name}"? This cannot be undone.',
  'confirm.deleteSelected': 'Delete selected',
  'confirm.deleteSelected.message': 'Delete {count} selected rows?',

  // Pagination
  'pagination.showing': 'Showing {start}\u2013{end} of {total}',
  'pagination.showingAll': 'Showing all {total} rows',
  'pagination.previous': 'Previous',
  'pagination.next': 'Next',
  'pagination.page': 'Page {current} of {total}',
  'pagination.loadMore': 'Load more',
  'pagination.loading': 'Loading...',
  'pagination.rowCount': '{count} rows',

  // Formula categories
  'formula.category.text': 'Text',
  'formula.category.number': 'Number',
  'formula.category.date': 'Date',
  'formula.category.logic': 'Logic',
  'formula.input': 'Input {n} ({type})',
};
