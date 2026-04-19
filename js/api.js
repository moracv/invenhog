// InvenHogar - Google Sheets API Layer

const API = {
  get scriptUrl() {
    return (JSON.parse(localStorage.getItem(CONFIG.SETTINGS_KEY) || '{}')).scriptUrl || '';
  },

  async getAll() {
    const url = this.scriptUrl;
    if (!url) return null;
    try {
      const res = await fetch(`${url}?action=GET_ALL`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.items || [];
    } catch (e) {
      console.warn('API getAll failed:', e.message);
      return null;
    }
  },

  async save(item) {
    const url = this.scriptUrl;
    if (!url) return { success: false, reason: 'no_url' };
    try {
      const isNew = !item.id;
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: isNew ? 'ADD' : 'UPDATE', data: item }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('API save failed:', e.message);
      return { success: false, reason: e.message };
    }
  },

  async delete(id) {
    const url = this.scriptUrl;
    if (!url) return { success: false, reason: 'no_url' };
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'DELETE', data: { id } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('API delete failed:', e.message);
      return { success: false, reason: e.message };
    }
  },

  async test(url) {
    try {
      const res = await fetch(`${url}?action=GET_ALL`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (typeof data.items !== 'undefined') return { ok: true, count: data.count };
      throw new Error('Respuesta inesperada');
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
};

// Local Storage helpers
const Store = {
  getItems() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
    } catch { return []; }
  },

  setItems(items) {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(items));
  },

  nextId() {
    const counter = parseInt(localStorage.getItem(CONFIG.ID_COUNTER_KEY) || '0') + 1;
    localStorage.setItem(CONFIG.ID_COUNTER_KEY, counter);
    return 'INV-' + String(counter).padStart(5, '0');
  },

  addItem(item) {
    item.id = this.nextId();
    item.codigo = item.id;
    item.fechacreacion = new Date().toISOString();
    item.fechamodificacion = new Date().toISOString();
    const items = this.getItems();
    items.unshift(item);
    this.setItems(items);
    return item;
  },

  updateItem(item) {
    item.fechamodificacion = new Date().toISOString();
    const items = this.getItems();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx !== -1) items[idx] = item;
    else items.unshift(item);
    this.setItems(items);
    return item;
  },

  deleteItem(id) {
    const items = this.getItems().filter(i => i.id !== id);
    this.setItems(items);
  },

  setFromSheets(items) {
    this.setItems(items);
    // Update ID counter to prevent collisions
    const maxId = items.reduce((max, item) => {
      const num = parseInt((item.id || '').replace('INV-', '')) || 0;
      return Math.max(max, num);
    }, 0);
    const current = parseInt(localStorage.getItem(CONFIG.ID_COUNTER_KEY) || '0');
    if (maxId > current) localStorage.setItem(CONFIG.ID_COUNTER_KEY, maxId);
  },
};
