/**
 * I18nStrings — all user-facing UI strings in MonkeyTab.
 * Every key must have a value in en.ts. Translation files provide
 * the same keys in other languages.
 *
 * Interpolation uses {paramName} placeholders.
 */
export interface I18nStrings {
  // Toolbar
  'toolbar.search.placeholder': string;
  'toolbar.filter': string;
  'toolbar.rowNumbers': string;
  'toolbar.showRowNumbers': string;
  'toolbar.addRow': string;
  'toolbar.addRows': string;
  'toolbar.adding': string;
  'toolbar.delete': string;
  'toolbar.deleteSelected': string;
  'toolbar.records': string;
  'toolbar.selected': string;
  'toolbar.rowHeight.short': string;
  'toolbar.rowHeight.medium': string;
  'toolbar.rowHeight.tall': string;
  'toolbar.rowHeight.extraTall': string;
  'toolbar.rowHeight.fit': string;

  // Grid / cells
  'grid.empty': string;
  'grid.editing': string;
  'grid.loading': string;
  'grid.loadingTable': string;
  'grid.tableNotFound': string;
  'grid.saving': string;
  'grid.showing': string;

  // Column header context menu
  'column.rename': string;
  'column.customize': string;
  'column.changeType': string;
  'column.sortAZ': string;
  'column.sortZA': string;
  'column.sortAsc.Number': string;
  'column.sortDesc.Number': string;
  'column.sortAsc.Date': string;
  'column.sortDesc.Date': string;
  'column.sortAsc.Boolean': string;
  'column.sortDesc.Boolean': string;
  'column.sortAsc.Rating': string;
  'column.sortDesc.Rating': string;
  'column.sortNone': string;
  'column.hide': string;
  'column.delete': string;
  'column.options': string;
  'column.back': string;
  'column.validating': string;

  // Column type change confirmation
  'column.convert.title': string;
  'column.convert.message': string;
  'column.convert.compatible': string;
  'column.convert.incompatible': string;
  'column.convert.cancel': string;
  'column.convert.confirm': string;

  // Row actions
  'row.dragToReorder': string;
  'row.select': string;
  'row.options': string;
  'row.view': string;
  'row.duplicate': string;
  'row.insert': string;
  'row.delete': string;
  'row.deleteConfirm': string;

  // Undo / redo
  'undo.cellEdit': string;
  'redo.cellEdit': string;
  'undo.rowCreate': string;
  'redo.rowCreate': string;
  'undo.rowDelete': string;
  'redo.rowDelete': string;
  'undo.fieldCreate': string;
  'redo.fieldCreate': string;
  'undo.fieldDelete': string;
  'redo.fieldDelete': string;

  // Editors (shared)
  'editor.cancel': string;
  'editor.done': string;
  'editor.save': string;
  'editor.escapeToCancel': string;
  'editor.uploading': string;
  'editor.uploadError': string;

  // Text editor
  'editor.text.title': string;
  'editor.text.charCount': string;

  // Date editor
  'editor.date.placeholder': string;
  'editor.date.openPicker': string;

  // Bool editor / renderer
  'bool.yes': string;
  'bool.no': string;

  // Select editors
  'select.clear': string;
  'select.clearAll': string;
  'select.placeholder': string;
  'select.selected': string;

  // Image editor
  'editor.image.header': string;
  'editor.image.urlPlaceholder': string;
  'editor.image.remove': string;
  'editor.image.copyUrl': string;
  'editor.image.openTab': string;
  'editor.image.choose': string;
  'editor.image.addMore': string;
  'editor.image.constraints': string;
  'editor.image.loadError': string;

  // Audio editor
  'editor.audio.header': string;
  'editor.audio.urlPlaceholder': string;
  'editor.audio.remove': string;
  'editor.audio.choose': string;
  'editor.audio.addMore': string;
  'editor.audio.constraints': string;

  // Video editor
  'editor.video.header': string;
  'editor.video.urlPlaceholder': string;
  'editor.video.pasteUrl': string;
  'editor.video.addButton': string;
  'editor.video.openLink': string;
  'editor.video.uploadFile': string;
  'editor.video.remove': string;
  'editor.video.choose': string;
  'editor.video.addMore': string;
  'editor.video.constraints': string;

  // Attachment editor
  'editor.attachment.header': string;
  'editor.attachment.fileBadge': string;
  'editor.attachment.choose': string;
  'editor.attachment.constraints': string;

  // URL editor
  'editor.url.placeholder': string;
  'editor.url.labelPlaceholder': string;
  'editor.url.addLabel': string;

  // Color editor
  'editor.color.placeholder': string;
  'editor.color.presets': string;

  // Rating editor
  'editor.rating.instruction': string;

  // Date renderer
  'renderer.date.invalid': string;

  // Filter builder
  'filter.title': string;
  'filter.where': string;
  'filter.and': string;
  'filter.or': string;
  'filter.apply': string;
  'filter.clearAll': string;
  'filter.add': string;
  'filter.remove': string;
  'filter.valuePlaceholder': string;
  'filter.true': string;
  'filter.false': string;
  'filter.op.equals': string;
  'filter.op.notEquals': string;
  'filter.op.lt': string;
  'filter.op.lte': string;
  'filter.op.gt': string;
  'filter.op.gte': string;
  'filter.op.contains': string;
  'filter.op.notContains': string;
  'filter.op.startsWith': string;
  'filter.op.endsWith': string;
  'filter.op.isEmpty': string;
  'filter.op.isNotEmpty': string;
  'filter.op.isAnyOf': string;
  'filter.op.isNoneOf': string;

  // Formula builder
  'formula.title.add': string;
  'formula.title.edit': string;
  'formula.fieldName': string;
  'formula.function': string;
  'formula.inputs': string;
  'formula.parameters': string;
  'formula.loading': string;
  'formula.namePlaceholder': string;
  'formula.selectColumn': string;
  'formula.addField': string;
  'formula.update': string;

  // Record detail panel
  'record.title': string;
  'record.close': string;
  'record.empty': string;
  'record.created': string;
  'record.updated': string;

  // Settings panel
  'settings.title': string;
  'settings.tab.general': string;
  'settings.tab.display': string;
  'settings.tab.formatting': string;
  'settings.tab.defaults': string;

  // Field type labels
  'fieldType.Text': string;
  'fieldType.Number': string;
  'fieldType.Boolean': string;
  'fieldType.Date': string;
  'fieldType.SingleSelect': string;
  'fieldType.MultiSelect': string;
  'fieldType.Attachment': string;
  'fieldType.Image': string;
  'fieldType.Audio': string;
  'fieldType.Video': string;
  'fieldType.Color': string;
  'fieldType.Rating': string;
  'fieldType.Email': string;
  'fieldType.URL': string;
  'fieldType.Phone': string;
  'fieldType.Computed': string;

  // Context menu
  'context.clearCell': string;
  'context.copy': string;
  'context.back': string;

  // Copy format labels
  'copy.value': string;
  'copy.url': string;
  'copy.label': string;
  'copy.both': string;
  'copy.markdown': string;
  'copy.displayText': string;
  'copy.email': string;
  'copy.mailto': string;
  'copy.number': string;
  'copy.tel': string;
  'copy.names': string;
  'copy.json': string;

  // Column (additional)
  'column.deleteConfirm': string;
  'column.renamePrompt': string;
  'column.convert.confirmPrompt': string;

  // Add field panel
  'addField.title': string;
  'addField.header': string;
  'addField.placeholder': string;
  'addField.typeLabel': string;
  'addField.submit': string;
  'addField.computed': string;

  // Hidden columns
  'column.hiddenCount': string;
  'column.hiddenHeader': string;

  // Settings labels
  'settings.readOnly': string;
  'settings.readOnly.desc': string;
  'settings.allowCreateTable': string;
  'settings.allowCreateTable.desc': string;
  'settings.allowDeleteTable': string;
  'settings.allowDeleteTable.desc': string;
  'settings.allowCreateField': string;
  'settings.allowCreateField.desc': string;
  'settings.allowDeleteField': string;
  'settings.allowDeleteField.desc': string;
  'settings.allowCreateRecord': string;
  'settings.allowCreateRecord.desc': string;
  'settings.confirmBeforeDelete': string;
  'settings.confirmBeforeDelete.desc': string;
  'settings.allowColumnReorder': string;
  'settings.allowColumnReorder.desc': string;
  'settings.allowMultiColumnDrag': string;
  'settings.allowMultiColumnDrag.desc': string;
  'settings.defaultRowHeight': string;
  'settings.defaultRowHeight.desc': string;
  'settings.showRowNumbers': string;
  'settings.showRowNumbers.desc': string;
  'settings.compactMode': string;
  'settings.compactMode.desc': string;
  'settings.dateDisplayFormat': string;
  'settings.dateDisplayFormat.desc': string;
  'settings.dateFormat.iso': string;
  'settings.dateFormat.locale': string;
  'settings.dateFormat.relative': string;
  'settings.numberDecimalPlaces': string;
  'settings.numberDecimalPlaces.desc': string;
  'settings.thousandsSeparator': string;
  'settings.thousandsSeparator.desc': string;
  'settings.defaultColumns': string;
  'settings.defaultColumns.desc': string;
  'settings.defaultRows': string;
  'settings.defaultRows.desc': string;
  'settings.defaultFieldType': string;
  'settings.defaultFieldType.desc': string;

  // Confirm dialog
  'confirm.cancel': string;
  'confirm.ok': string;
  'confirm.deleteRow': string;
  'confirm.deleteRow.message': string;
  'confirm.deleteColumn': string;
  'confirm.deleteColumn.message': string;
  'confirm.deleteSelected': string;
  'confirm.deleteSelected.message': string;

  // Pagination
  'pagination.showing': string;
  'pagination.showingAll': string;
  'pagination.previous': string;
  'pagination.next': string;
  'pagination.page': string;
  'pagination.loadMore': string;
  'pagination.loading': string;
  'pagination.rowCount': string;

  // Formula categories
  'formula.category.text': string;
  'formula.category.number': string;
  'formula.category.date': string;
  'formula.category.logic': string;
  'formula.input': string;
}
