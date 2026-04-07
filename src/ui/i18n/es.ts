import type { I18nStrings } from './strings.ts';

export const es: I18nStrings = {
  // Toolbar
  'toolbar.search.placeholder': 'Buscar...',
  'toolbar.filter': 'Filtrar',
  'toolbar.rowNumbers': 'Fila #',
  'toolbar.showRowNumbers': 'Mostrar numero de fila',
  'toolbar.addRow': 'Fila',
  'toolbar.addRows': 'Agregar {count} filas',
  'toolbar.adding': 'Agregando...',
  'toolbar.delete': 'Eliminar',
  'toolbar.deleteSelected': 'Eliminar filas seleccionadas',
  'toolbar.records': '{count} registros',
  'toolbar.selected': '{count} seleccionados',
  'toolbar.rowHeight.short': 'Baja',
  'toolbar.rowHeight.medium': 'Media',
  'toolbar.rowHeight.tall': 'Alta',
  'toolbar.rowHeight.extraTall': 'Extra alta',
  'toolbar.rowHeight.fit': 'Ajustar al contenido',

  // Grid / cells
  'grid.empty': '',
  'grid.editing': 'Editando...',
  'grid.loading': 'Cargando...',
  'grid.loadingTable': 'Cargando datos de la tabla...',
  'grid.tableNotFound': 'Tabla no encontrada',
  'grid.saving': 'Guardando...',
  'grid.showing': 'Mostrando {shown} de {total} registros',

  // Column header context menu
  'column.rename': 'Renombrar columna',
  'column.customize': 'Personalizar campo',
  'column.changeType': 'Cambiar tipo',
  'column.sortAZ': 'Ordenar A → Z',
  'column.sortZA': 'Ordenar Z → A',
  'column.sortAsc.Number': 'Ordenar 1 → 9',
  'column.sortDesc.Number': 'Ordenar 9 → 1',
  'column.sortAsc.Date': 'Ordenar más antiguo → más reciente',
  'column.sortDesc.Date': 'Ordenar más reciente → más antiguo',
  'column.sortAsc.Boolean': 'Ordenar falso → verdadero',
  'column.sortDesc.Boolean': 'Ordenar verdadero → falso',
  'column.sortAsc.Rating': 'Ordenar menor → mayor',
  'column.sortDesc.Rating': 'Ordenar mayor → menor',
  'column.sortNone': 'Quitar orden',
  'column.hide': 'Ocultar columna',
  'column.delete': 'Eliminar columna',
  'column.options': 'Opciones de columna',
  'column.back': 'Volver',
  'column.validating': 'Validando...',

  // Column type change confirmation
  'column.convert.title': 'Cambiar tipo de campo',
  'column.convert.message': 'Convertir {field} de {from} a {to}?',
  'column.convert.compatible': '{n} de {total} valores compatibles',
  'column.convert.incompatible': '{n} valor(es) quedarán vacíos',
  'column.convert.cancel': 'Cancelar',
  'column.convert.confirm': 'Convertir',

  // Row actions
  'row.dragToReorder': 'Arrastra para reordenar',
  'row.select': 'Seleccionar fila',
  'row.options': 'Opciones de fila',
  'row.view': 'Ver registro',
  'row.duplicate': 'Duplicar',
  'row.insert': 'Insertar fila',
  'row.delete': 'Eliminar',
  'row.deleteConfirm': 'Seguro que quieres eliminar esta fila?',

  // Undo / redo
  'undo.cellEdit': 'Edición de celda deshecha',
  'redo.cellEdit': 'Edición de celda rehecha',
  'undo.rowCreate': 'Creación de fila deshecha',
  'redo.rowCreate': 'Creación de fila rehecha',
  'undo.rowDelete': 'Eliminación de fila deshecha',
  'redo.rowDelete': 'Eliminación de fila rehecha',
  'undo.fieldCreate': 'Creación de columna deshecha',
  'redo.fieldCreate': 'Creación de columna rehecha',
  'undo.fieldDelete': 'Eliminación de columna deshecha',
  'redo.fieldDelete': 'Eliminación de columna rehecha',

  // Editors (shared)
  'editor.cancel': 'Cancelar',
  'editor.done': 'Listo',
  'editor.save': 'Guardar',
  'editor.escapeToCancel': 'Escape para cancelar',
  'editor.uploading': 'Subiendo...',
  'editor.uploadError': 'Error al subir',

  // Text editor
  'editor.text.title': 'Editar: {field}',
  'editor.text.charCount': '{count} / {max}',

  // Date editor
  'editor.date.placeholder': 'yyyy-mm-dd',
  'editor.date.openPicker': 'Abrir selector de fecha',

  // Bool editor / renderer
  'bool.yes': 'Sí',
  'bool.no': 'No',

  // Select editors
  'select.clear': 'Limpiar selección',
  'select.clearAll': 'Limpiar todo',
  'select.placeholder': 'Seleccionar opciones...',
  'select.selected': '{count} seleccionados',

  // Image editor
  'editor.image.header': 'Imágenes ({count})',
  'editor.image.urlPlaceholder': 'URL de imagen',
  'editor.image.remove': 'Eliminar imagen',
  'editor.image.copyUrl': 'Copiar URL',
  'editor.image.openTab': 'Abrir en nueva pestaña',
  'editor.image.choose': 'Clic para elegir imágenes',
  'editor.image.addMore': 'Agregar más imágenes',
  'editor.image.constraints': 'Solo imágenes. Máx {max}, hasta {size} cada una',
  'editor.image.loadError': 'No se pudo cargar la imagen',

  // Audio editor
  'editor.audio.header': 'Audio ({count})',
  'editor.audio.urlPlaceholder': 'URL de audio',
  'editor.audio.remove': 'Eliminar audio',
  'editor.audio.choose': 'Clic para elegir archivos de audio',
  'editor.audio.addMore': 'Agregar más audio',
  'editor.audio.constraints': 'Solo audio. Máx {max}, hasta {size} cada uno',

  // Video editor
  'editor.video.header': 'Videos ({count})',
  'editor.video.urlPlaceholder': 'URL de video',
  'editor.video.pasteUrl': 'Pega una URL de YouTube, Vimeo o video...',
  'editor.video.addButton': 'Agregar',
  'editor.video.openLink': 'Abrir enlace de video',
  'editor.video.uploadFile': 'O sube un archivo de video',
  'editor.video.remove': 'Eliminar video',
  'editor.video.choose': 'Clic para elegir videos',
  'editor.video.addMore': 'Agregar más videos',
  'editor.video.constraints': 'Máx {max} videos, hasta {size} cada uno',

  // Attachment editor
  'editor.attachment.header': 'Adjuntos ({count})',
  'editor.attachment.fileBadge': 'ARCHIVO',
  'editor.attachment.choose': 'Clic para elegir archivos',
  'editor.attachment.constraints': 'Máx {max} archivos, hasta {size} cada uno',

  // URL editor
  'editor.url.placeholder': 'https://example.com',
  'editor.url.labelPlaceholder': 'Etiqueta (opcional)',
  'editor.url.addLabel': '+ Agregar etiqueta',

  // Color editor
  'editor.color.placeholder': '#000000',
  'editor.color.presets': 'Predefinidos',

  // Rating editor
  'editor.rating.instruction': 'Clic para calificar ({n}/{max})',

  // Date renderer
  'renderer.date.invalid': 'Fecha inválida',

  // Filter builder
  'filter.title': 'Filtros',
  'filter.where': 'Donde',
  'filter.and': 'y',
  'filter.or': 'o',
  'filter.apply': 'Aplicar',
  'filter.clearAll': 'Limpiar todo',
  'filter.add': 'Agregar filtro',
  'filter.remove': 'Eliminar filtro',
  'filter.valuePlaceholder': 'Valor...',
  'filter.true': 'Verdadero',
  'filter.false': 'Falso',
  'filter.op.equals': 'es igual a',
  'filter.op.notEquals': 'no es igual a',
  'filter.op.lt': 'menor que',
  'filter.op.lte': 'menor o igual que',
  'filter.op.gt': 'mayor que',
  'filter.op.gte': 'mayor o igual que',
  'filter.op.contains': 'contiene',
  'filter.op.notContains': 'no contiene',
  'filter.op.startsWith': 'empieza con',
  'filter.op.endsWith': 'termina con',
  'filter.op.isEmpty': 'está vacío',
  'filter.op.isNotEmpty': 'no está vacío',
  'filter.op.isAnyOf': 'es alguno de',
  'filter.op.isNoneOf': 'no es ninguno de',

  // Formula builder
  'formula.title.add': 'Agregar campo calculado',
  'formula.title.edit': 'Editar fórmula',
  'formula.fieldName': 'Nombre del campo',
  'formula.function': 'Función',
  'formula.inputs': 'Columnas de entrada',
  'formula.parameters': 'Parámetros',
  'formula.loading': 'Cargando funciones...',
  'formula.namePlaceholder': 'ej., Nombre completo',
  'formula.selectColumn': 'Seleccionar columna...',
  'formula.addField': 'Agregar campo',
  'formula.update': 'Actualizar',

  // Record detail panel
  'record.title': 'Detalle del registro',
  'record.close': 'Cerrar',
  'record.empty': 'Vacío',
  'record.created': 'Creado: {date}',
  'record.updated': 'Actualizado: {date}',

  // Settings panel
  'settings.title': 'Configuración',
  'settings.tab.general': 'General',
  'settings.tab.display': 'Visualización',
  'settings.tab.formatting': 'Formato',
  'settings.tab.defaults': 'Tablas nuevas',

  // Field type labels
  'fieldType.Text': 'Texto',
  'fieldType.Number': 'Número',
  'fieldType.Boolean': 'Booleano',
  'fieldType.Date': 'Fecha',
  'fieldType.SingleSelect': 'Selección única',
  'fieldType.MultiSelect': 'Selección múltiple',
  'fieldType.Attachment': 'Adjunto',
  'fieldType.Image': 'Imagen',
  'fieldType.Audio': 'Audio',
  'fieldType.Video': 'Video',
  'fieldType.Color': 'Color',
  'fieldType.Rating': 'Calificación',
  'fieldType.Email': 'Correo',
  'fieldType.URL': 'URL',
  'fieldType.Phone': 'Teléfono',
  'fieldType.Computed': 'Calculado',

  // Context menu
  'context.clearCell': 'Limpiar celda',
  'context.copy': 'Copiar...',
  'context.back': 'Volver',

  // Copy format labels
  'copy.value': 'Copiar valor',
  'copy.url': 'Copiar URL',
  'copy.label': 'Copiar etiqueta',
  'copy.both': 'Copiar ambos',
  'copy.markdown': 'Copiar como Markdown',
  'copy.displayText': 'Copiar texto visible',
  'copy.email': 'Copiar correo',
  'copy.mailto': 'Copiar como mailto',
  'copy.number': 'Copiar número',
  'copy.tel': 'Copiar como tel:',
  'copy.names': 'Copiar nombres',
  'copy.json': 'Copiar JSON',

  // Column (additional)
  'column.deleteConfirm': '¿Eliminar esta columna? No se puede deshacer.',
  'column.renamePrompt': 'Nuevo nombre de columna:',
  'column.convert.confirmPrompt': '¿Convertir a {type}? {compatible} de {total} valores compatibles, {incompatible} serán eliminados.',

  // Add field panel
  'addField.title': 'Agregar campo',
  'addField.header': 'Nuevo campo',
  'addField.placeholder': 'Nombre del campo...',
  'addField.typeLabel': 'Tipo',
  'addField.submit': 'Agregar campo',
  'addField.computed': 'Campo calculado...',

  // Hidden columns
  'column.hiddenCount': '+{count} ocultas',
  'column.hiddenHeader': 'Columnas ocultas',

  // Settings labels
  'settings.readOnly': 'Solo lectura',
  'settings.readOnly.desc': 'Impedir todas las modificaciones de datos',
  'settings.allowCreateTable': 'Permitir crear tabla',
  'settings.allowCreateTable.desc': 'Permitir la creación de nuevas tablas',
  'settings.allowDeleteTable': 'Permitir eliminar tabla',
  'settings.allowDeleteTable.desc': 'Permitir la eliminación de tablas',
  'settings.allowCreateField': 'Permitir crear campo',
  'settings.allowCreateField.desc': 'Permitir agregar nuevas columnas',
  'settings.allowDeleteField': 'Permitir eliminar campo',
  'settings.allowDeleteField.desc': 'Permitir eliminar columnas',
  'settings.allowCreateRecord': 'Permitir crear registro',
  'settings.allowCreateRecord.desc': 'Permitir agregar nuevas filas',
  'settings.confirmBeforeDelete': 'Confirmar antes de eliminar',
  'settings.confirmBeforeDelete.desc': 'Mostrar diálogo de confirmación antes de acciones destructivas',
  'settings.allowColumnReorder': 'Permitir reordenar columnas',
  'settings.allowColumnReorder.desc': 'Habilitar arrastrar y soltar para reordenar columnas',
  'settings.allowMultiColumnDrag': 'Arrastre de múltiples columnas',
  'settings.allowMultiColumnDrag.desc': 'Permitir seleccionar y arrastrar varias columnas a la vez',
  'settings.defaultRowHeight': 'Altura de fila predeterminada',
  'settings.defaultRowHeight.desc': 'Altura de fila por defecto para tablas nuevas',
  'settings.showRowNumbers': 'Mostrar números de fila',
  'settings.showRowNumbers.desc': 'Mostrar números de fila por defecto',
  'settings.compactMode': 'Modo compacto',
  'settings.compactMode.desc': 'Reducir espaciado para una visualización más densa',
  'settings.dateDisplayFormat': 'Formato de fecha',
  'settings.dateDisplayFormat.desc': 'Cómo se muestran las fechas en la tabla',
  'settings.dateFormat.iso': 'ISO (2024-01-15)',
  'settings.dateFormat.locale': 'Local (15 ene 2024)',
  'settings.dateFormat.relative': 'Relativo (hace 2 días)',
  'settings.numberDecimalPlaces': 'Decimales',
  'settings.numberDecimalPlaces.desc': 'Cantidad de decimales por defecto',
  'settings.thousandsSeparator': 'Separador de miles',
  'settings.thousandsSeparator.desc': 'Mostrar números con separador de miles (1.000)',
  'settings.defaultColumns': 'Columnas por defecto',
  'settings.defaultColumns.desc': 'Número de columnas al crear una tabla nueva',
  'settings.defaultRows': 'Filas por defecto',
  'settings.defaultRows.desc': 'Número de filas vacías al crear una tabla nueva',
  'settings.defaultFieldType': 'Tipo de campo por defecto',
  'settings.defaultFieldType.desc': 'Tipo predeterminado para nuevas columnas',

  // Confirm dialog
  'confirm.cancel': 'Cancelar',
  'confirm.ok': 'Aceptar',
  'confirm.deleteRow': 'Eliminar fila',
  'confirm.deleteRow.message': '¿Seguro que quieres eliminar esta fila?',
  'confirm.deleteColumn': 'Eliminar columna',
  'confirm.deleteColumn.message': '¿Eliminar la columna "{name}"? No se puede deshacer.',
  'confirm.deleteSelected': 'Eliminar seleccionados',
  'confirm.deleteSelected.message': '¿Eliminar {count} filas seleccionadas?',

  // Pagination
  'pagination.showing': 'Mostrando {start}\u2013{end} de {total}',
  'pagination.showingAll': 'Mostrando las {total} filas',
  'pagination.previous': 'Anterior',
  'pagination.next': 'Siguiente',
  'pagination.page': 'P\u00e1gina {current} de {total}',
  'pagination.loadMore': 'Cargar m\u00e1s',
  'pagination.loading': 'Cargando...',
  'pagination.rowCount': '{count} filas',

  // Formula categories
  'formula.category.text': 'Texto',
  'formula.category.number': 'Número',
  'formula.category.date': 'Fecha',
  'formula.category.logic': 'Lógica',
  'formula.input': 'Entrada {n} ({type})',
};
