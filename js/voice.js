// InvenHogar - Voice Recognition Module
// Basado en Web Speech API (Chrome, Edge, Android)

const VoiceInput = {
  recognition: null,
  isRecording: false,
  interimText: '',
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
      return;
    }

    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'es-ES';

    this.recognition.onstart = () => {
      this.isRecording = true;
      this.updateUI();
    };

    this.recognition.onresult = (e) => this.onResult(e);
    this.recognition.onerror = (e) => this.onError(e);
    this.recognition.onend = () => {
      this.isRecording = false;
      this.updateUI();
    };
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

    this.interimText = interim;

    if (final) {
      this.processCommand(final.toLowerCase());
      this.updateUI();
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
    const form = document.getElementById('voice-product-form').offsetParent !== null
      ? document.getElementById('voice-product-form')
      : document.getElementById('product-form');
    if (!form) return;

    // Normalizar entrada
    const normalized = text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim();

    // Detectar campo basado en palabras clave
    let field = null;
    let value = null;

    // Estrategia: buscar "campo: valor" o "campo es valor"
    const patterns = [
      { regex: /nombre\s*[es:]*\s*(.+?)(?:categoria|ubicacion|cantidad|$)/, field: 'nombre' },
      { regex: /categoria\s*[es:]*\s*(.+?)(?:subcategoria|ubicacion|cantidad|$)/, field: 'categoria' },
      { regex: /subcategoria\s*[es:]*\s*(.+?)(?:ubicacion|cantidad|$)/, field: 'subcategoria' },
      { regex: /ubicacion\s*[es:]*\s*(.+?)(?:cantidad|unidad|$)/, field: 'ubicacion' },
      { regex: /cantidad\s*[es:]*\s*(\d+(?:[.,]\d+)?)\s*(.+?)/, field: 'cantidad', hasUnit: true },
      { regex: /unidad\s*[es:]*\s*(.+?)(?:stock|precio|$)/, field: 'unidad' },
      { regex: /stock\s*(?:minimo|min)\s*[es:]*\s*(\d+)/, field: 'stockmin' },
      { regex: /precio\s*[es:]*\s*(\d+(?:[.,]\d+)?)/, field: 'precio' },
      { regex: /fuente\s*[es:]*\s*(.+?)(?:precio|fecha|$)/, field: 'fuente' },
    ];

    for (const p of patterns) {
      const match = normalized.match(p.regex);
      if (match) {
        field = p.field;
        value = (match[1] || '').trim();
        if (p.hasUnit && match[2]) {
          const el = form.elements['unidad'];
          if (el) el.value = this.normalizeUnit(match[2]);
        }
        break;
      }
    }

    // Fallback: intentar inferir campo por contexto
    if (!field) {
      for (const [f, keywords] of Object.entries(this.normalizedFields)) {
        for (const kw of keywords) {
          if (normalized.includes(kw)) {
            field = f;
            value = normalized.replace(kw, '').replace(/[es:]*/, '').trim();
            break;
          }
        }
        if (field) break;
      }
    }

    // Asignar valor si encontramos el campo
    if (field && value) {
      const el = form.elements[field];
      if (el) {
        if (field === 'categoria') {
          // Intentar coincidir con categoría
          const cat = this.findCategory(value);
          el.value = cat || value;
          if (cat) App.updateSubcategories(cat);
        } else if (field === 'cantidad' || field === 'stockmin' || field === 'precio') {
          el.value = value.replace(',', '.');
        } else {
          el.value = value;
        }
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

  updateUI() {
    const btn = document.getElementById('voice-record-btn');
    const status = document.getElementById('voice-status');
    const interim = document.getElementById('voice-interim');

    if (!btn || !status) return;

    if (this.isRecording) {
      btn.innerHTML = '<i class="fas fa-stop-circle animate-pulse text-red-500"></i> Grabando...';
      btn.classList.add('bg-red-50');
      status.className = 'text-xs text-red-600 font-medium flex items-center gap-1';
      status.innerHTML = '<i class="fas fa-circle-notch fa-spin text-red-500"></i> Escuchando...';
      if (interim) interim.textContent = this.interimText;
    } else {
      btn.innerHTML = '<i class="fas fa-microphone"></i> Grabar por voz';
      btn.classList.remove('bg-red-50');
      status.className = 'text-xs text-gray-500 flex items-center gap-1';
      status.innerHTML = '<i class="fas fa-check-circle text-green-500"></i> Listo para grabar';
      if (interim) interim.textContent = '';
    }
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
