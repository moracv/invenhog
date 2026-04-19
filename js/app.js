// InvenHogar - Main Application Controller

const App = {
  state: {
    items: [],
    currentSection: 'dashboard',
    editingItem: null,
    filters: { category: '', location: '', stock: '', search: '' },
    selectedLabels: new Set(),
    charts: { category: null, location: null },
    pwaPrompt: null,
    syncInProgress: false,
    confirmCallback: null,
  },

  // ─── INIT ──────────────────────────────────────────────────────────────────
  async init() {
    this.setupPWA();
    this.populateCategoryOptions();
    this.populateLocationFilters();
    await this.loadData();
    const hash = location.hash.replace('#', '') || 'dashboard';
    this.navigate(hash);
    this.updateSyncStatus();
  },

  // ─── NAVIGATION ───────────────────────────────────────────────────────────
  navigate(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    const el = document.getElementById(`section-${section}`);
    if (el) el.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
      const active = btn.dataset.section === section;
      btn.classList.toggle('nav-active', active);
    });

    this.state.currentSection = section;
    location.hash = section;
    this.closeSidebar();

    switch (section) {
      case 'dashboard':  this.renderDashboard(); break;
      case 'inventory':  this.renderInventory(); break;
      case 'form':       this.renderForm(this.state.editingItem); this.showVoiceContainer(); break;
      case 'voice':      this.renderVoiceForm(); break;
      case 'labels':     this.renderLabels(); break;
      case 'settings':   this.renderSettings(); break;
    }
  },

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('overlay').classList.toggle('hidden');
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('overlay').classList.add('hidden');
  },

  // ─── DATA MANAGEMENT ──────────────────────────────────────────────────────
  async loadData() {
    this.showLoading(true);
    const remote = await API.getAll();
    if (remote) {
      Store.setFromSheets(remote);
      this.state.items = remote;
      this.setSyncStatus('synced');
    } else {
      this.state.items = Store.getItems();
      if (API.scriptUrl) this.setSyncStatus('error');
    }
    this.showLoading(false);
    this.updateInventoryBadge();
  },

  async saveItem(item) {
    let saved;
    if (!item.id) {
      saved = Store.addItem(item);
    } else {
      saved = Store.updateItem(item);
    }
    this.state.items = Store.getItems();
    this.updateInventoryBadge();

    this.setSyncStatus('syncing');
    const result = await API.save(saved);
    if (result.success) {
      this.setSyncStatus('synced');
      if (result.id && !item.id) {
        // Update local ID from server if provided
        const local = this.state.items.find(i => i.id === saved.id);
        if (local && result.id !== saved.id) {
          local.id = result.id;
          local.codigo = result.id;
          Store.setItems(this.state.items);
        }
      }
    } else if (result.reason !== 'no_url') {
      this.setSyncStatus('error');
      this.showToast('Guardado local. Sincronizar cuando haya conexión.', 'warning');
    }
  },

  async deleteItem(id) {
    Store.deleteItem(id);
    this.state.items = Store.getItems();
    this.updateInventoryBadge();

    const result = await API.delete(id);
    if (result.success) {
      this.setSyncStatus('synced');
    } else if (result.reason !== 'no_url') {
      this.setSyncStatus('error');
    }
  },

  async syncNow() {
    if (this.state.syncInProgress) return;
    this.state.syncInProgress = true;
    const btn = document.getElementById('sync-btn');
    if (btn) btn.innerHTML = '<i class="fas fa-rotate fa-spin text-blue-500"></i>';
    await this.loadData();
    this.state.syncInProgress = false;
    if (btn) btn.innerHTML = '<i class="fas fa-cloud-arrow-up text-gray-500"></i>';
    this.showToast('Sincronización completada', 'success');
    if (this.state.currentSection === 'dashboard') this.renderDashboard();
    if (this.state.currentSection === 'inventory') this.renderInventory();
  },

  // ─── DASHBOARD ────────────────────────────────────────────────────────────
  renderDashboard() {
    this.renderStats();
    this.renderCharts();
    this.renderLowStock();
    this.renderRecentItems();
  },

  renderStats() {
    const items = this.state.items;
    const lowStock = items.filter(i => parseFloat(i.cantidad) <= parseFloat(i.stockmin || 1) && parseFloat(i.cantidad) >= 0);
    const outStock = items.filter(i => parseFloat(i.cantidad) <= 0);
    const totalValue = items.reduce((s, i) => s + (parseFloat(i.cantidad || 0) * parseFloat(i.precio || 0)), 0);
    const cats = new Set(items.map(i => i.categoria).filter(Boolean)).size;

    const stats = [
      { label: 'Total Productos', value: items.length, icon: 'fa-boxes-stacked', color: 'blue', sub: `${cats} categorías` },
      { label: 'Stock Bajo', value: lowStock.length, icon: 'fa-triangle-exclamation', color: lowStock.length > 0 ? 'amber' : 'green', sub: `${outStock.length} sin stock` },
      { label: 'Valor Total', value: `$${totalValue.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: 'fa-coins', color: 'green', sub: 'estimado' },
      { label: 'Ubicaciones', value: new Set(items.map(i => i.ubicacion).filter(Boolean)).size, icon: 'fa-location-dot', color: 'purple', sub: 'distintas' },
    ];

    const colorMap = {
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      amber: 'bg-amber-50 text-amber-600 border-amber-100',
      green: 'bg-green-50 text-green-600 border-green-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-100',
    };

    document.getElementById('stats-grid').innerHTML = stats.map(s => `
      <div class="card p-5 flex items-start gap-4">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${colorMap[s.color]}">
          <i class="fas ${s.icon} text-lg"></i>
        </div>
        <div class="min-w-0">
          <p class="text-2xl font-bold text-gray-900 leading-none">${s.value}</p>
          <p class="text-sm font-medium text-gray-600 mt-1">${s.label}</p>
          <p class="text-xs text-gray-400 mt-0.5">${s.sub}</p>
        </div>
      </div>
    `).join('');
  },

  renderCharts() {
    const items = this.state.items;

    // Category chart
    const catCounts = {};
    items.forEach(i => { if (i.categoria) catCounts[i.categoria] = (catCounts[i.categoria] || 0) + 1; });
    const catLabels = Object.keys(catCounts).map(k => CATEGORIES[k]?.label || k);
    const catData = Object.values(catCounts);
    const catColors = Object.keys(catCounts).map(k => CATEGORIES[k]?.color || '#6B7280');

    if (this.state.charts.category) this.state.charts.category.destroy();
    const ctxCat = document.getElementById('chart-category');
    if (ctxCat && catData.length > 0) {
      this.state.charts.category = new Chart(ctxCat, {
        type: 'doughnut',
        data: { labels: catLabels, datasets: [{ data: catData, backgroundColor: catColors, borderWidth: 2, borderColor: '#fff' }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10, usePointStyle: true } } },
          cutout: '60%',
        },
      });
    } else if (ctxCat) {
      ctxCat.parentElement.innerHTML = '<p class="text-sm text-gray-400 text-center py-16">Sin datos aún</p>';
    }

    // Location chart
    const locCounts = {};
    items.forEach(i => { if (i.ubicacion) locCounts[i.ubicacion] = (locCounts[i.ubicacion] || 0) + 1; });
    const topLocs = Object.entries(locCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (this.state.charts.location) this.state.charts.location.destroy();
    const ctxLoc = document.getElementById('chart-location');
    if (ctxLoc && topLocs.length > 0) {
      this.state.charts.location = new Chart(ctxLoc, {
        type: 'bar',
        data: {
          labels: topLocs.map(l => l[0]),
          datasets: [{ data: topLocs.map(l => l[1]), backgroundColor: '#3B82F6', borderRadius: 6, borderSkipped: false }],
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: { grid: { display: false }, ticks: { font: { size: 11 } } },
          },
        },
      });
    } else if (ctxLoc) {
      ctxLoc.parentElement.innerHTML = '<p class="text-sm text-gray-400 text-center py-16">Sin datos aún</p>';
    }
  },

  renderLowStock() {
    const low = this.state.items
      .filter(i => parseFloat(i.cantidad) <= parseFloat(i.stockmin || 1))
      .sort((a, b) => parseFloat(a.cantidad) - parseFloat(b.cantidad))
      .slice(0, 6);

    const el = document.getElementById('low-stock-list');
    if (!el) return;
    if (low.length === 0) {
      el.innerHTML = '<p class="text-sm text-gray-400 text-center py-6"><i class="fas fa-check-circle text-green-400 block text-2xl mb-2"></i>Todo el stock está OK</p>';
      return;
    }
    el.innerHTML = low.map(i => {
      const cat = CATEGORIES[i.categoria];
      const qty = parseFloat(i.cantidad);
      const color = qty <= 0 ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50';
      return `
        <div class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer" onclick="App.editItem('${i.id}')">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-lg">${cat ? `<i class="fas ${cat.icon}" style="color:${cat.color}"></i>` : '📦'}</span>
            <span class="text-sm font-medium text-gray-800 truncate">${this.esc(i.nombre)}</span>
          </div>
          <span class="text-xs font-bold px-2 py-1 rounded-full ${color} flex-shrink-0">${qty} ${i.unidad || ''}</span>
        </div>`;
    }).join('');
  },

  renderRecentItems() {
    const recent = [...this.state.items]
      .sort((a, b) => new Date(b.fechacreacion || 0) - new Date(a.fechacreacion || 0))
      .slice(0, 6);

    const el = document.getElementById('recent-items-list');
    if (!el) return;
    if (recent.length === 0) {
      el.innerHTML = '<p class="text-sm text-gray-400 text-center py-6">Agrega tu primer producto</p>';
      return;
    }
    el.innerHTML = recent.map(i => {
      const cat = CATEGORIES[i.categoria];
      const date = i.fechacreacion ? new Date(i.fechacreacion).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : '';
      return `
        <div class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer" onclick="App.editItem('${i.id}')">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style="background:${cat?.bg || '#F3F4F6'}">
              <i class="fas ${cat?.icon || 'fa-box'} text-xs" style="color:${cat?.color || '#6B7280'}"></i>
            </span>
            <span class="text-sm font-medium text-gray-800 truncate">${this.esc(i.nombre)}</span>
          </div>
          <span class="text-xs text-gray-400 flex-shrink-0">${date}</span>
        </div>`;
    }).join('');
  },

  // ─── INVENTORY ────────────────────────────────────────────────────────────
  renderInventory() {
    this.populateLocationFilters();
    this.applyFilters();
  },

  applyFilters() {
    const f = this.state.filters;
    let items = this.state.items;

    if (f.search) {
      const q = f.search.toLowerCase();
      items = items.filter(i =>
        (i.nombre || '').toLowerCase().includes(q) ||
        (i.codigo || '').toLowerCase().includes(q) ||
        (i.ubicacion || '').toLowerCase().includes(q) ||
        (i.subcategoria || '').toLowerCase().includes(q) ||
        (i.notas || '').toLowerCase().includes(q)
      );
    }
    if (f.category) items = items.filter(i => i.categoria === f.category);
    if (f.location) items = items.filter(i => i.ubicacion === f.location);
    if (f.stock === 'low') items = items.filter(i => parseFloat(i.cantidad) <= parseFloat(i.stockmin || 1) && parseFloat(i.cantidad) > 0);
    if (f.stock === 'out') items = items.filter(i => parseFloat(i.cantidad) <= 0);
    if (f.stock === 'ok') items = items.filter(i => parseFloat(i.cantidad) > parseFloat(i.stockmin || 1));

    document.getElementById('results-count').textContent = `${items.length} resultado${items.length !== 1 ? 's' : ''}`;
    this.renderTable(items);
  },

  renderTable(items) {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-12 text-center text-gray-400">
        <i class="fas fa-box-open text-3xl mb-2 block"></i>
        ${this.state.items.length === 0 ? 'No hay productos. <button class="text-blue-600 underline" onclick="App.navigate(\'form\')">Agrega el primero</button>' : 'Sin resultados para los filtros aplicados'}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(item => {
      const cat = CATEGORIES[item.categoria];
      const qty = parseFloat(item.cantidad);
      const min = parseFloat(item.stockmin || 1);
      const stockClass = qty <= 0 ? 'stock-out' : qty <= min ? 'stock-low' : 'stock-ok';
      const stockLabel = qty <= 0 ? 'Sin stock' : qty <= min ? 'Stock bajo' : 'OK';

      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-4 py-3 font-mono text-xs text-gray-500">${this.esc(item.codigo || item.id)}</td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style="background:${cat?.bg || '#F3F4F6'}">
                <i class="fas ${cat?.icon || 'fa-box'} text-xs" style="color:${cat?.color || '#6B7280'}"></i>
              </span>
              <div class="min-w-0">
                <p class="font-medium text-gray-900 truncate max-w-xs">${this.esc(item.nombre)}</p>
                ${item.subcategoria ? `<p class="text-xs text-gray-400">${this.esc(item.subcategoria)}</p>` : ''}
              </div>
            </div>
          </td>
          <td class="px-4 py-3 hidden md:table-cell">
            ${cat ? `<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border" style="background:${cat.bg};color:${cat.color};border-color:${cat.border}">
              <i class="fas ${cat.icon} text-xs"></i>${cat.label}
            </span>` : '—'}
          </td>
          <td class="px-4 py-3 hidden lg:table-cell text-sm text-gray-600">
            ${item.ubicacion ? `<span class="flex items-center gap-1"><i class="fas fa-location-dot text-xs text-gray-400"></i>${this.esc(item.ubicacion)}</span>` : '—'}
          </td>
          <td class="px-4 py-3 text-center">
            <div class="flex flex-col items-center">
              <span class="font-semibold text-gray-900">${qty} <span class="text-xs font-normal text-gray-500">${item.unidad || ''}</span></span>
              <span class="stock-badge ${stockClass}">${stockLabel}</span>
            </div>
          </td>
          <td class="px-4 py-3 text-right">
            <div class="flex items-center justify-end gap-1">
              <button onclick="App.previewLabel('${item.id}')" class="btn-icon-sm" title="Ver etiqueta">
                <i class="fas fa-barcode text-gray-400"></i>
              </button>
              <button onclick="App.editItem('${item.id}')" class="btn-icon-sm" title="Editar">
                <i class="fas fa-pen text-gray-400"></i>
              </button>
              <button onclick="App.confirmDelete('${item.id}', '${this.esc(item.nombre)}')" class="btn-icon-sm" title="Eliminar">
                <i class="fas fa-trash text-red-400"></i>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  },

  search(query) {
    this.state.filters.search = query;
    if (this.state.currentSection === 'inventory') this.applyFilters();
    else if (query) this.navigate('inventory');
  },

  clearFilters() {
    this.state.filters = { category: '', location: '', stock: '', search: '' };
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-location').value = '';
    document.getElementById('filter-stock').value = '';
    document.getElementById('global-search').value = '';
    this.applyFilters();
  },

  // ─── FORM ─────────────────────────────────────────────────────────────────
  openAddForm() {
    this.state.editingItem = null;
    this.navigate('form');
  },

  showVoiceContainer() {
    const container = document.getElementById('voice-container');
    if (container && VoiceInput.recognition) {
      container.classList.remove('hidden');
    }
  },

  renderVoiceForm() {
    const form = document.getElementById('voice-product-form');
    if (!form) return;
    form.reset();

    this.populateCategoryOptions();
    this.populateLocationFilters();

    // Synchronize voice form with regular form on submit
    form.onsubmit = (e) => this.submitVoiceForm(e);

    // Set default values
    document.querySelector('[name="cantidad"]', form).value = '';
    document.querySelector('[name="stockmin"]', form).value = '1';
    document.querySelector('[name="fechacompra"]', form).value = new Date().toISOString().split('T')[0];

    VoiceInput.start();
    this.showToast('Micrófono activado. Habla naturalmente.', 'info');
  },

  async submitVoiceForm(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const item = Object.fromEntries(fd.entries());
    if (!item.id) delete item.id;

    this.showLoading(true);
    await this.saveItem(item);
    this.showLoading(false);
    VoiceInput.stop();
    this.showToast('Producto agregado por voz ✓', 'success');
    this.state.editingItem = null;
    this.navigate('inventory');
  },

  editItem(id) {
    const item = this.state.items.find(i => i.id === id);
    if (!item) return;
    this.state.editingItem = { ...item };
    this.navigate('form');
  },

  renderForm(item) {
    const form = document.getElementById('product-form');
    if (!form) return;
    form.reset();

    document.getElementById('form-title').textContent = item ? 'Editar Producto' : 'Agregar Producto';
    document.getElementById('form-submit-text').textContent = item ? 'Actualizar Producto' : 'Guardar Producto';
    document.getElementById('form-id').value = item?.id || '';
    document.getElementById('form-codigo').value = item?.codigo || '';

    if (item) {
      Object.entries(item).forEach(([key, val]) => {
        const el = form.elements[key];
        if (el) el.value = val || '';
      });
      if (item.categoria) this.updateSubcategories(item.categoria);
      this.showBarcodePreview(item.id);
    }

    // Populate location datalist
    const locs = [...new Set(this.state.items.map(i => i.ubicacion).filter(Boolean))];
    document.getElementById('location-suggestions').innerHTML = locs.map(l => `<option value="${this.esc(l)}">`).join('');

    // Hide barcode section for new items
    document.getElementById('barcode-preview-section').classList.toggle('hidden', !item);

    if (!item) document.querySelector('[name="fechacompra"]').value = new Date().toISOString().split('T')[0];
  },

  async submitForm(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const item = Object.fromEntries(fd.entries());
    if (!item.id) delete item.id;

    this.showLoading(true);
    await this.saveItem(item);
    this.showLoading(false);
    this.showToast(item.id ? 'Producto actualizado' : 'Producto guardado', 'success');
    this.state.editingItem = null;
    this.navigate('inventory');
  },

  updateSubcategories(category) {
    const subs = CATEGORIES[category]?.subcategories || [];
    const dl = document.getElementById('subcategory-suggestions');
    if (dl) dl.innerHTML = subs.map(s => `<option value="${s}">`).join('');
  },

  showBarcodePreview(id) {
    const section = document.getElementById('barcode-preview-section');
    const svg = document.getElementById('form-barcode');
    const label = document.getElementById('form-barcode-id');
    if (!id || !svg) { section.classList.add('hidden'); return; }
    try {
      JsBarcode(svg, id, { format: 'CODE128', width: 2, height: 45, displayValue: true, fontSize: 12, margin: 8 });
      label.textContent = id;
      section.classList.remove('hidden');
    } catch (e) { section.classList.add('hidden'); }
  },

  printSingleLabel() {
    const id = document.getElementById('form-id').value;
    const item = this.state.items.find(i => i.id === id);
    if (item) this.previewLabel(id);
  },

  // ─── LABELS ───────────────────────────────────────────────────────────────
  renderLabels() {
    const grid = document.getElementById('labels-grid');
    if (!grid) return;
    const items = this.state.items;

    if (items.length === 0) {
      grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-12">No hay productos en el inventario</p>';
      return;
    }

    grid.innerHTML = items.map(item => {
      const cat = CATEGORIES[item.categoria];
      const checked = this.state.selectedLabels.has(item.id);
      return `
        <label class="card p-4 cursor-pointer hover:border-blue-300 transition-colors ${checked ? 'border-blue-400 bg-blue-50' : ''}">
          <div class="flex items-start gap-3">
            <input type="checkbox" class="label-check mt-0.5 rounded text-blue-600" data-id="${item.id}" ${checked ? 'checked' : ''}
              onchange="App.toggleLabel('${item.id}', this.checked)">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm text-gray-900 truncate">${this.esc(item.nombre)}</p>
              <p class="text-xs text-gray-500 mt-0.5">${cat?.label || ''} · ${item.ubicacion || '—'}</p>
              <div class="mt-2 flex justify-center">
                <svg class="label-barcode-${item.id}"></svg>
              </div>
            </div>
          </div>
        </label>`;
    }).join('');

    // Generate barcodes
    setTimeout(() => {
      items.forEach(item => {
        const el = document.querySelector(`.label-barcode-${item.id}`);
        if (el) {
          try { JsBarcode(el, item.id || item.codigo, { format: 'CODE128', width: 1.5, height: 35, displayValue: true, fontSize: 10, margin: 4 }); }
          catch (e) {}
        }
      });
    }, 50);

    this.updateSelectedCount();
  },

  toggleLabel(id, checked) {
    if (checked) this.state.selectedLabels.add(id);
    else this.state.selectedLabels.delete(id);
    this.updateSelectedCount();
  },

  toggleSelectAll(checked) {
    this.state.selectedLabels.clear();
    if (checked) this.state.items.forEach(i => this.state.selectedLabels.add(i.id));
    document.querySelectorAll('.label-check').forEach(cb => cb.checked = checked);
    this.updateSelectedCount();
  },

  filterLabels(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#labels-grid > label').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
  },

  updateSelectedCount() {
    const n = this.state.selectedLabels.size;
    document.getElementById('selected-count').textContent = n;
  },

  printLabels() {
    const ids = [...this.state.selectedLabels];
    if (ids.length === 0) { this.showToast('Selecciona al menos una etiqueta', 'warning'); return; }
    const items = ids.map(id => this.state.items.find(i => i.id === id)).filter(Boolean);
    this.doPrint(items);
  },

  previewLabel(id) {
    const item = this.state.items.find(i => i.id === id);
    if (!item) return;
    const cat = CATEGORIES[item.categoria];
    const modal = document.getElementById('modal-barcode');
    const content = document.getElementById('modal-barcode-content');
    content.innerHTML = `
      <div class="label-card p-4 border-2 border-gray-200 rounded-xl text-center w-64">
        <p class="font-bold text-sm text-gray-900 mb-1">${this.esc(item.nombre)}</p>
        <p class="text-xs mb-1" style="color:${cat?.color || '#6B7280'}">${cat?.label || ''}</p>
        <p class="text-xs text-gray-500 mb-2">📍 ${this.esc(item.ubicacion || '—')}</p>
        <svg id="preview-barcode-svg" class="mx-auto"></svg>
        <p class="text-xs text-gray-400 mt-1">${item.cantidad} ${item.unidad || ''}</p>
      </div>`;
    modal.classList.remove('hidden');
    setTimeout(() => {
      try { JsBarcode('#preview-barcode-svg', item.id, { format: 'CODE128', width: 1.8, height: 45, displayValue: true, fontSize: 11, margin: 6 }); }
      catch (e) {}
    }, 50);
    // store for print button
    modal.dataset.itemId = id;
  },

  printModalLabel() {
    const id = document.getElementById('modal-barcode').dataset.itemId;
    const item = this.state.items.find(i => i.id === id);
    if (item) { this.closeModal(); this.doPrint([item]); }
  },

  doPrint(items) {
    const cat = (item) => CATEGORIES[item.categoria];
    const labelsHTML = items.map(item => `
      <div class="print-label">
        <p class="print-label-name">${this.esc(item.nombre)}</p>
        <p class="print-label-sub" style="color:${cat(item)?.color || '#666'}">${cat(item)?.label || ''} · ${this.esc(item.ubicacion || '')}</p>
        <svg class="print-barcode" id="pb-${item.id}"></svg>
        <p class="print-label-qty">${item.cantidad} ${item.unidad || ''}</p>
      </div>`).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Etiquetas - InvenHogar</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #fff; }
        .page { padding: 10mm; }
        .labels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; }
        .print-label { border: 1px solid #ccc; border-radius: 6px; padding: 6px 8px; text-align: center; page-break-inside: avoid; }
        .print-label-name { font-size: 10pt; font-weight: bold; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .print-label-sub { font-size: 7pt; margin-bottom: 4px; }
        .print-barcode { width: 100%; max-width: 160px; height: 40px; }
        .print-label-qty { font-size: 7pt; color: #666; margin-top: 2px; }
        @media print { @page { margin: 10mm; } }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
      </head><body><div class="page"><div class="labels-grid">${labelsHTML}</div></div>
      <script>
        window.onload = function() {
          ${items.map(i => `try { JsBarcode('#pb-${i.id}', '${i.id}', { format:'CODE128', width:1.5, height:38, displayValue:true, fontSize:9, margin:4 }); } catch(e) {}`).join('\n')}
          setTimeout(() => window.print(), 500);
        };
      <\/script></body></html>`);
    win.document.close();
  },

  // ─── SETTINGS ─────────────────────────────────────────────────────────────
  renderSettings() {
    const settings = JSON.parse(localStorage.getItem(CONFIG.SETTINGS_KEY) || '{}');
    const urlEl = document.getElementById('settings-script-url');
    if (urlEl && settings.scriptUrl) urlEl.value = settings.scriptUrl;
  },

  saveSettings() {
    const url = document.getElementById('settings-script-url').value.trim();
    localStorage.setItem(CONFIG.SETTINGS_KEY, JSON.stringify({ scriptUrl: url }));
    this.showToast('Configuración guardada', 'success');
    this.updateSyncStatus();
  },

  async testConnection() {
    const url = document.getElementById('settings-script-url').value.trim();
    const el = document.getElementById('connection-test-result');
    if (!url) { this.showToast('Ingresa la URL primero', 'warning'); return; }
    el.className = 'p-3 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200';
    el.innerHTML = '<i class="fas fa-rotate fa-spin mr-2"></i>Probando conexión...';
    el.classList.remove('hidden');
    const result = await API.test(url);
    if (result.ok) {
      el.className = 'p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200';
      el.innerHTML = `<i class="fas fa-check-circle mr-2"></i>Conexión exitosa. ${result.count} productos encontrados.`;
    } else {
      el.className = 'p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200';
      el.innerHTML = `<i class="fas fa-circle-xmark mr-2"></i>Error: ${result.error}`;
    }
  },

  exportToCSV() {
    const items = Store.getItems();
    const headers = ['ID', 'Nombre', 'Categoría', 'Subcategoría', 'Ubicación', 'Cantidad', 'Unidad', 'Stock Min', 'Precio', 'Fuente', 'Fecha Compra', 'Notas'];
    const rows = items.map(i => [i.id, i.nombre, CATEGORIES[i.categoria]?.label || i.categoria, i.subcategoria, i.ubicacion, i.cantidad, i.unidad, i.stockmin, i.precio, i.fuente, i.fechacompra, i.notas].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`));
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv);
    a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    this.showToast('CSV exportado', 'success');
  },

  clearLocalData() {
    this.confirmAction('¿Eliminar todos los datos locales? (Google Sheets no se modifica)', () => {
      localStorage.removeItem(CONFIG.STORAGE_KEY);
      localStorage.removeItem(CONFIG.ID_COUNTER_KEY);
      this.state.items = [];
      this.showToast('Datos locales eliminados', 'success');
      this.navigate('dashboard');
    });
  },

  // ─── MODALS ────────────────────────────────────────────────────────────────
  confirmDelete(id, name) {
    document.getElementById('modal-confirm-text').textContent = `¿Eliminar "${name}"? Esta acción no se puede deshacer.`;
    document.getElementById('modal-confirm-btn').onclick = async () => {
      this.closeModal();
      this.showLoading(true);
      await this.deleteItem(id);
      this.showLoading(false);
      this.showToast('Producto eliminado', 'success');
      this.renderInventory();
    };
    document.getElementById('modal-confirm').classList.remove('hidden');
  },

  confirmAction(text, cb) {
    document.getElementById('modal-confirm-text').textContent = text;
    document.getElementById('modal-confirm-btn').onclick = () => { this.closeModal(); cb(); };
    document.getElementById('modal-confirm').classList.remove('hidden');
  },

  closeModal() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  },

  // ─── UI HELPERS ────────────────────────────────────────────────────────────
  showLoading(show) {
    document.getElementById('loading-bar').classList.toggle('hidden', !show);
  },

  showToast(message, type = 'success') {
    const colors = {
      success: 'bg-green-600', error: 'bg-red-600',
      warning: 'bg-amber-500', info: 'bg-blue-600',
    };
    const icons = { success: 'fa-check', error: 'fa-xmark', warning: 'fa-triangle-exclamation', info: 'fa-info' };
    const id = 'toast-' + Date.now();
    const el = document.createElement('div');
    el.id = id;
    el.className = `${colors[type] || colors.info} text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-xs transition-all duration-300 translate-y-2 opacity-0`;
    el.innerHTML = `<i class="fas ${icons[type] || icons.info} text-xs"></i><span>${message}</span>`;
    document.getElementById('toast').appendChild(el);
    requestAnimationFrame(() => el.classList.remove('translate-y-2', 'opacity-0'));
    setTimeout(() => { el.classList.add('opacity-0'); setTimeout(() => el.remove(), 300); }, 3000);
  },

  setSyncStatus(status) {
    const el = document.getElementById('sync-status');
    if (!el) return;
    const states = {
      synced: { dot: 'bg-green-400', text: 'Sincronizado' },
      syncing: { dot: 'bg-blue-400 animate-pulse', text: 'Sincronizando...' },
      error: { dot: 'bg-red-400', text: 'Error de sync' },
      offline: { dot: 'bg-gray-300', text: 'Sin conectar' },
    };
    const s = states[status] || states.offline;
    el.innerHTML = `<div class="w-2 h-2 rounded-full ${s.dot}"></div><span>${s.text}</span>`;
    if (status === 'synced') {
      const last = document.getElementById('last-sync');
      if (last) last.textContent = 'Hace un momento';
    }
  },

  updateSyncStatus() {
    this.setSyncStatus(API.scriptUrl ? 'offline' : 'offline');
  },

  updateInventoryBadge() {
    const badge = document.getElementById('badge-inventory');
    if (badge) {
      badge.textContent = this.state.items.length;
      badge.classList.toggle('hidden', this.state.items.length === 0);
    }
  },

  populateCategoryOptions() {
    const selects = document.querySelectorAll('[name="categoria"], #filter-category');
    const options = Object.entries(CATEGORIES).map(([k, v]) =>
      `<option value="${k}">${v.label}</option>`).join('');
    selects.forEach(s => {
      if (s.id === 'filter-category') s.innerHTML = '<option value="">Todas las categorías</option>' + options;
      else s.innerHTML = '<option value="">Seleccionar categoría...</option>' + options;
    });
  },

  populateLocationFilters() {
    const locs = [...new Set(this.state.items.map(i => i.ubicacion).filter(Boolean))].sort();
    const sel = document.getElementById('filter-location');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">Todas las ubicaciones</option>' +
      locs.map(l => `<option value="${l}" ${l === current ? 'selected' : ''}>${this.esc(l)}</option>`).join('');
  },

  esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  // ─── PWA ──────────────────────────────────────────────────────────────────
  setupPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    // Capturar evento de instalación (cuando el navegador lo permite)
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📥 beforeinstallprompt detectado');
      e.preventDefault();
      this.state.pwaPrompt = e;

      // Mostrar botón de instalación
      const btn = document.getElementById('pwa-install-btn');
      if (btn) {
        btn.classList.remove('hidden');
        console.log('✅ Botón de instalación visible');
      }
    });

    // Detectar cuándo ya está instalada
    window.addEventListener('appinstalled', () => {
      console.log('✅ App instalada exitosamente');
      this.state.pwaPrompt = null;
      const btn = document.getElementById('pwa-install-btn');
      if (btn) btn.classList.add('hidden');
      this.showToast('¡InvenHogar instalado! 🎉', 'success');
    });

    // Detectar si está en modo PWA (instalada)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('🏠 Ejecutando como PWA');
    }
  },

  installPWA() {
    if (!this.state.pwaPrompt) {
      this.showToast('Tu navegador no soporta instalación como app', 'warning');
      return;
    }

    this.state.pwaPrompt.prompt();
    this.state.pwaPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Usuario aceptó instalación');
        this.showToast('¡Instalando InvenHogar...', 'success');
      } else {
        console.log('❌ Usuario rechazó instalación');
      }
      this.state.pwaPrompt = null;
    }).catch(err => {
      console.error('❌ Error en instalación:', err);
    });
  },
};

// Bind filter change events
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('filter-category')?.addEventListener('change', (e) => {
    App.state.filters.category = e.target.value;
    App.applyFilters();
  });
  document.getElementById('filter-location')?.addEventListener('change', (e) => {
    App.state.filters.location = e.target.value;
    App.applyFilters();
  });
  document.getElementById('filter-stock')?.addEventListener('change', (e) => {
    App.state.filters.stock = e.target.value;
    App.applyFilters();
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) App.closeModal(); });
  });

  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => App.navigate(btn.dataset.section));
  });

  App.init();
});
