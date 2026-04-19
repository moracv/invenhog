// InvenHogar - Voice Recognition Module
// Basado en Web Speech API (Chrome, Edge, Android)

const VoiceInput = {
  recognition: null,
  isRecording: false,
  interimText: '',
  finalText: '',
  allTranscripts: [],

  normalizedFields: {
    nombre: ['nombre', 'producto', 'articulo', 'item'],
    categoria: ['categoria', 'tipo', 'clase'],
    subcategoria: ['subcategoria', 'sub', 'especifico'],
    ubicacion: ['ubicacion', 'lugar', 'donde', 'guardado', 'ubicado'],
    cantidad: ['cantidad', 'cuanto', 'cuantos', 'cuanta', 'numero'],
    unidad: ['unidad', 'tipo unidad', 'medida'],
    stockmin: ['stock minimo', 'minimo', 'alerta', 'reserva'],
    precio: ['precio', 'costo', 'valor'],
    fuente: ['fuente', 'donde compre', 'comprado', 'tienda', 'origen'],
  },

  init() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('Speech Recognition no soportado');
      const btn = document.getElementById('voice-record-btn');
      if (btn) btn.disabled = true;
      App.showToast('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.', 'error');
      return false;
    }

    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'es-ES';

    this.recognition.onstart = () => {
      this.isRecording = true;
      this.allTranscripts = [];
      this.updateUI();
    };

    this.recognition.onresult = (e) => this.onResult(e);
    this.recognition.onerror = (e) => this.onError(e);
    this.recognition.onend = () => {
      this.isRecording = false;
      this.updateUI();
    };

    return true;
  },

  onResult(event) {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i].transcript.trim();
      if (event.results[i].isFinal) {
        final += transcript + ' ';
      } else {
        interim += transcript;
      }
    }

    // Actualizar texto interim (lo que se está diciendo ahora)
    this.interimText = interim;
    this.updateLiveText();

    // Procesar texto final
    if (final.trim()) {
      this.finalText = final.trim();
      this.allTranscripts.push(this.finalText);
      this.processCommand(this.finalText.toLowerCase());
    }
  },

  onError(event) {
    const messages = {
      'network': 'Error de red',
      'no-speech': 'Sin entrada de voz',
      'audio-capture': 'Micrófono no disponible',
    };
    App.showToast(messages[event.error] || `Error: ${event.error}`, 'error');
  },

  processCommand(text) {
    // Detectar qué formulario está activo
    const voiceForm = document.getElementById('voice-product-form');
    const regularForm = document.getElementById('product-form');
    const form = voiceForm && voiceForm.offsetParent !== null ? voiceForm : regularForm;

    if (!form || !form.elements) return;

    // Normalizar entrada
    const normalized = text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim();

    // Detectar campo basado en palabras clave
    let field = null;
    let value = null;

    // Patrones mejorados con mejor captura de valores
    const patterns = [
      { regex: /nombre\s*[es:]*\s*(.+?)(?:\s+(?:categoria|ubicacion|cantidad|unidad|precio|fuente)|$)/, field: 'nombre' },
      { regex: /categoria\s*[es:]*\s*(.+?)(?:\s+(?:subcategoria|ubicacion|cantidad|unidad)|$)/, field: 'categoria' },
      { regex: /subcategoria\s*[es:]*\s*(.+?)(?:\s+(?:ubicacion|cantidad)|$)/, field: 'subcategoria' },
      { regex: /ubicacion\s*[es:]*\s*(.+?)(?:\s+(?:cantidad|unidad|precio)|$)/, field: 'ubicacion' },
      { regex: /cantidad\s*[es:]*\s*(\d+(?:[.,]\d+)?)\s*(?:de\s+)?(.+?)(?:\s+(?:stock|precio|fuente)|$)/, field: 'cantidad', hasUnit: true },
      { regex: /unidad\s*[es:]*\s*(.+?)(?:\s+(?:stock|precio|fuente)|$)/, field: 'unidad' },
      { regex: /stock\s*(?:minimo|min)\s*[es:]*\s*(\d+)/, field: 'stockmin' },
      { regex: /precio\s*[es:]*\s*(\d+(?:[.,]\d+)?)/, field: 'precio' },
      { regex: /fuente\s*[es:]*\s*(.+?)(?:\s+(?:precio|fecha|notas)|$)/, field: 'fuente' },
      { regex: /notas\s*[es:]*\s*(.+)/, field: 'notas' },
    ];

    for (const p of patterns) {
      const match = normalized.match(p.regex);
      if (match) {
        field = p.field;
        value = (match[1] || '').trim();

        // Manejar unidad si está presente
        if (p.hasUnit && match[2]) {
          const unitStr = (match[2] || '').trim();
          const el = form.elements['unidad'];
          if (el) {
            const normalizedUnit = this.normalizeUnit(unitStr);
            el.value = normalizedUnit;
            this.showFieldHint('unidad', normalizedUnit);
          }
        }
        break;
      }
    }

    // Asignar valor si encontramos el campo
    if (field && value && form.elements[field]) {
      const el = form.elements[field];

      if (field === 'categoria') {
        const cat = this.findCategory(value);
        if (cat) {
          el.value = cat;
          // Trigger change event para actualizar subcategorías
          const event = new Event('change', { bubbles: true });
          el.dispatchEvent(event);
          App.updateSubcategories(cat);
          this.showFieldHint(field, CATEGORIES[cat]?.label || value);
        } else {
          el.value = value;
          this.showFieldHint(field, value);
        }
      } else if (field === 'cantidad' || field === 'stockmin' || field === 'precio') {
        el.value = value.replace(',', '.');
        this.showFieldHint(field, el.value);
      } else {
        el.value = value;
        this.showFieldHint(field, value);
      }
    }
  },

  findCategory(voiceInput) {
    const norm = voiceInput.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const keys = Object.keys(CATEGORIES);
    for (const k of keys) {
      const label = CATEGORIES[k].label.toLowerCase();
      if (norm.includes(label) || label.includes(norm)) return k;
    }
    return null;
  },

  normalizeUnit(voiceUnit) {
    const norm = voiceUnit.toLowerCase().trim();
    const units = UNITS.map(u => u.value);
    for (const u of units) {
      if (norm.includes(u) || u.includes(norm)) return u;
    }
    return 'unidad';
  },

  showFieldHint(field, value) {
    const hints = {
      nombre: '✓ Nombre del producto agregado',
      categoria: '✓ Categoría detectada',
      ubicacion: '✓ Ubicación registrada',
      cantidad: '✓ Cantidad ingresada',
      unidad: '✓ Unidad configurada',
      precio: '✓ Precio registrado',
    };
    const msg = hints[field] || `✓ ${field} actualizado`;
    App.showToast(`${msg}: "${value}"`, 'success');
  },

  start() {
    if (!this.recognition) this.init();
    if (this.recognition) {
      this.isRecording = true;
      this.recognition.start();
      this.updateUI();
    }
  },

  stop() {
    if (this.recognition) {
      this.recognition.stop();
      this.isRecording = false;
    }
    this.updateUI();
  },

  updateLiveText() {
    // Mostrar el texto que se está escribiendo en tiempo real
    const interimEl = document.getElementById('voice-interim');
    const recordingTextEl = document.getElementById('voice-recording-text');

    if (interimEl) {
      interimEl.textContent = this.interimText || '(escuchando...)';
      interimEl.style.color = this.interimText ? '#2563EB' : '#9CA3AF';
    }

    if (recordingTextEl) {
      const allText = [...this.allTranscripts, this.finalText, this.interimText].filter(Boolean).join(' ');
      recordingTextEl.innerHTML = `
        <span style="color: #111827; font-weight: 500;">${this.escapeHtml(allText)}</span>
        ${this.interimText ? `<span style="color: #9CA3AF; font-style: italic;">${this.escapeHtml(this.interimText)}</span>` : ''}
      `;
    }
  },

  updateUI() {
    const btn = document.getElementById('voice-record-btn');
    const mainBtn = document.getElementById('voice-main-record-btn');
    const status = document.getElementById('voice-status');
    const indicator = document.getElementById('voice-recording-indicator');

    if (!btn && !mainBtn) return;

    if (this.isRecording) {
      if (btn) {
        btn.innerHTML = '<i class="fas fa-stop-circle animate-pulse text-red-500"></i> Grabando...';
        btn.classList.add('bg-red-50');
      }
      if (mainBtn) {
        mainBtn.innerHTML = '<i class="fas fa-stop-circle animate-pulse text-white"></i> Grabando... Presiona para detener';
        mainBtn.style.background = 'linear-gradient(to right, #DC2626, #EF4444)';
      }
      if (status) {
        status.className = 'text-xs text-red-600 font-medium flex items-center gap-1.5';
        status.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Escuchando tu voz...';
      }
      if (indicator) {
        indicator.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div><span class="text-xs font-medium text-red-600">Grabando</span>';
      }
    } else {
      if (btn) {
        btn.innerHTML = '<i class="fas fa-microphone"></i> Grabar por voz';
        btn.classList.remove('bg-red-50');
      }
      if (mainBtn) {
        mainBtn.innerHTML = '<i class="fas fa-microphone text-2xl"></i><span>Presiona para grabar</span>';
        mainBtn.style.background = 'linear-gradient(to right, #A855F7, #3B82F6)';
      }
      if (status) {
        status.className = 'text-xs text-green-600 font-medium flex items-center gap-1.5';
        status.innerHTML = '<i class="fas fa-check-circle"></i> Listo para grabar';
      }
      if (indicator) {
        indicator.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-green-500"></div><span class="text-xs font-medium text-green-600">Listo</span>';
      }
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  toggleRecording() {
    if (!this.recognition) this.init();
    if (!this.recognition) {
      App.showToast('Speech Recognition no disponible en tu navegador', 'error');
      return;
    }

    if (this.isRecording) {
      this.stop();
      App.showToast('Grabación detenida', 'info');
    } else {
      this.start();
    }
  },
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => VoiceInput.init());
} else {
  VoiceInput.init();
}
