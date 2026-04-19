/**
 * InvenHogar - Google Apps Script Backend
 *
 * INSTRUCCIONES DE DESPLIEGUE:
 * 1. Abre la hoja de Google Sheets donde quieres guardar el inventario
 * 2. Ve a Extensiones → Apps Script
 * 3. Reemplaza el código existente con este archivo completo
 * 4. Clic en Implementar → Nueva implementación
 * 5. Tipo: Aplicación web
 *    Ejecutar como: Yo (tu cuenta)
 *    Quién tiene acceso: Cualquier persona
 * 6. Autoriza los permisos y copia la URL generada
 * 7. Pega esa URL en Configuración dentro de InvenHogar
 */

const SHEET_NAME = 'Inventario';
const HEADERS = [
  'ID', 'Nombre', 'Categoria', 'Subcategoria', 'Ubicacion',
  'Cantidad', 'Unidad', 'StockMin', 'Precio', 'Fuente',
  'FechaCompra', 'Notas', 'Codigo', 'FechaCreacion', 'FechaModificacion'
];

// ─── Entrypoints ──────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    const sheet = getSheet();
    const action = (e.parameter && e.parameter.action) || 'GET_ALL';
    let result;
    if (action === 'GET_ALL') result = getAllItems(sheet);
    else result = { error: 'Unknown GET action' };
    return respond(result);
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    const sheet = getSheet();
    let body;
    try { body = JSON.parse(e.postData.contents); }
    catch (_) { body = { action: e.parameter.action, data: JSON.parse(e.parameter.data || '{}') }; }

    const { action, data } = body;
    let result;
    switch (action) {
      case 'GET_ALL': result = getAllItems(sheet); break;
      case 'ADD':     result = addItem(sheet, data); break;
      case 'UPDATE':  result = updateItem(sheet, data); break;
      case 'DELETE':  result = deleteItem(sheet, data.id); break;
      default: result = { error: 'Unknown action: ' + action };
    }
    return respond(result);
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

// ─── Sheet helpers ────────────────────────────────────────────────────────────

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const hRange = sheet.getRange(1, 1, 1, HEADERS.length);
    hRange.setValues([HEADERS]);
    hRange.setBackground('#1E40AF');
    hRange.setFontColor('#FFFFFF');
    hRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 100);
    sheet.setColumnWidth(2, 220);
  }
  return sheet;
}

function getNextId(ss) {
  let cfg = ss.getSheetByName('_Config');
  if (!cfg) {
    cfg = ss.insertSheet('_Config');
    cfg.hideSheet();
    cfg.appendRow(['lastId', '0']);
  }
  const data = cfg.getDataRange().getValues();
  let row = -1, last = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'lastId') { row = i + 1; last = parseInt(data[i][1]) || 0; break; }
  }
  const next = last + 1;
  if (row > 0) cfg.getRange(row, 2).setValue(next);
  else cfg.appendRow(['lastId', next]);
  return 'INV-' + String(next).padStart(5, '0');
}

function rowToItem(headers, row) {
  const item = {};
  headers.forEach((h, i) => { item[h.toLowerCase()] = row[i] instanceof Date ? row[i].toISOString() : String(row[i] ?? ''); });
  return item;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

function getAllItems(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { items: [], count: 0 };
  const headers = data[0];
  const items = data.slice(1)
    .map(row => rowToItem(headers, row))
    .filter(i => i.id && i.id.startsWith('INV-'));
  return { items, count: items.length };
}

function addItem(sheet, item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const id = item.id || getNextId(ss);
  const now = new Date().toISOString();
  item.id = id;
  item.codigo = id;
  item.fechacreacion = item.fechacreacion || now;
  item.fechamodificacion = now;
  const row = HEADERS.map(h => item[h.toLowerCase()] ?? '');
  sheet.appendRow(row);
  // Auto-resize columns
  sheet.autoResizeColumns(1, HEADERS.length);
  return { success: true, id, item };
}

function updateItem(sheet, item) {
  const data = sheet.getDataRange().getValues();
  item.fechamodificacion = new Date().toISOString();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === item.id) {
      const updated = HEADERS.map((h, col) => {
        const key = h.toLowerCase();
        return item[key] !== undefined ? item[key] : data[i][col];
      });
      sheet.getRange(i + 1, 1, 1, HEADERS.length).setValues([updated]);
      return { success: true, item };
    }
  }
  // Item not found — add it
  return addItem(sheet, item);
}

function deleteItem(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Item not found: ' + id };
}

// ─── Response helper ──────────────────────────────────────────────────────────

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
