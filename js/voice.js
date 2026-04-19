// InvenHogar - Voice Recognition Module
// Web Speech API para entrada de voz en tiempo real

const VoiceInput = {
  recognition: null,
  isRecording: false,
  interimText: '',
  finalText: '',
  lastProcessedText: '',

  // Campos y palabras clave
  fieldKeywords: {
    nombre: ['nombre', 'producto', 'articulo', 'item', 'cosa'],
    categoria: ['categoria', 'tipo', 'clase'],
    subcategoria: ['subcategoria', 'sub'],
    ubicacion: ['ubicacion', 'lugar', 'donde', 'guardado', 'ubicado', 'piso', 'estante'],
    cantidad: ['cantidad', 'cuanto', 'cuantos', 'cuanta', 'numero', 'hay'],
    unidad: ['unidad', 'unidades', 'piezas', 'cajas', 'rollos', 'litros', 'kilos', 'metros'],
    stockmin: ['stock minimo', 'minimo', 'alerta', 'reserva'],
    precio: ['precio', 'costo', 'valor', 'cuesta', 'paga'],
    fuente: ['fuente', 'tienda', 'comprado', 'compre', 'origen'],
    notas: ['nota', 'notas', 'comentario'],
  },

  /**
   * Inicializar reconocimiento de voz
   */
  init() {
    // Verificar soporte del navegador
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.error('❌ Speech Recognition no soportado en este navegador');
      this.disableVoiceButtons('Tu navegador no soporta voz. Usa Chrome, Edge o Safari.');
      return false;
    }

    try {
      this.recognition = new SR();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES';
      this.recognition.maxAlternatives = 1;

      // Eventos
      this.recognition.onstart = () => this.onStart();
      this.recognition.onresult = (e) => this.onResult(e);
      this.recognition.onerror = (e) => this.onError(e);
      this.recognition.onend = () => this.onEnd();

      console.log('✅ Voice Recognition iniciado correctamente');
      return true;
    } catch (err) {
      console.error('❌ Error al inicializar Voice Recognition:', err);
      this.disableVoiceButtons('Error al inicializar micrófono');
      return false;
    }
  },

  /**
   * Deshabilitar botones de voz
   */
  disableVoiceButtons(reason) {
    const buttons = document.querySelectorAll('[id*="voice"], [id*="record"]');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.title = reason;
    });
  },

  /**
   * Cuando inicia la grabación
   */
  onStart() {
    this.isRecording = true;
    this.interimText = '';
    this.finalText = '';
    this.lastProcessedText = '';
    this.updateUI();
    console.log('🎤 Grabación iniciada');
  },

  /**
   * Cuando termina la grabación
   */
  onEnd() {
    this.isRecording = false;
    this.updateUI();
    console.log('⏹️ Grabación detenida');
  },

  /**
   * Procesar resultados de reconocimiento
   */
  onResult(event) {
    if (!event || !event.results) {
      console.warn('⚠️ Evento sin resultados');
      return;
    }

    let interim = '';
    let final = '';

    try {
      // Procesar cada resultado
      for (let i = event.resultIndex; i < event.results.length; i++) {
        // Validar que existe el resultado
        if (!event.results[i]) {
          console.warn(`⚠️ Resultado[${i}] es undefined`);
          continue;
        }

        // event.results[i] es un SpeechRecognitionResult (array de alternativas)
        // Acceder a la primera alternativa [0] y su propiedad transcript
        const result = event.results[i];
        const isFinal = result.isFinal || false;

        // Obtener el transcript de la primera alternativa
        let transcript = '';
        if (result && result.length > 0 && result[0] && result[0].transcript) {
          transcript = result[0].transcript.trim();
        }

        if (!transcript) {
          console.warn(`⚠️ Sin transcript en Resultado[${i}]`);
          continue;
        }

        if (isFinal) {
          // Texto final (confirmado por el navegador)
          final += transcript + ' ';
          console.log(`✅ Final: "${transcript}"`);
        } else {
          // Texto interim (se está diciendo)
          interim += transcript + ' ';
          console.log(`📝 Interim: "${transcript}"`);
        }
      }

      // Actualizar texto interim en tiempo real
      this.interimText = interim.trim();
      this.updateDisplayText();

      // Procesar texto final
      if (final.trim() && final.trim() !== this.lastProcessedText) {
        this.finalText = final.trim();
        this.lastProcessedText = final.trim();
        this.processVoiceCommand(this.finalText);
      }
    } catch (err) {
      console.error('❌ Error procesando resultado:', err);
    }
  },

  /**
   * Manejar errores de micrófono
   */
  onError(event) {
    const errorMessages = {
      'network': '❌ Error de conexión de red',
      'no-speech': '⚠️ No se detectó voz. Intenta de nuevo.',
      'audio-capture': '❌ Micrófono no disponible. Revisa permisos.',
      'not-allowed': '❌ Acceso al micrófono denegado. Revisa permisos en tu navegador.',
      'permission-denied': '❌ Permiso denegado. Necesitas permitir acceso al micrófono.',
      'bad-grammar': '⚠️ No se entiendió bien. Habla más claro.',
      'service-not-allowed': '❌ Servicio no permitido en esta URL. Usa HTTPS o localhost.',
    };

    const message = errorMessages[event.error] || `❌ Error: ${event.error}`;
    console.error(message);

    if (App && App.showToast) {
      App.showToast(message, 'error');
    }

    // Intentar reintentar si es un error transitorio
    if (event.error === 'no-speech' || event.error === 'audio-capture') {
      setTimeout(() => {
        if (this.isRecording) {
          console.log('🔄 Reintentando captura de audio...');
          this.recognition.abort();
          this.start();
        }
      }, 500);
    }
  },

  /**
   * Actualizar display de texto en tiempo real
   */
  updateDisplayText() {
    try {
      const displayEl = document.getElementById('voice-recording-text');
      if (!displayEl) {
        return; // Elemento no existe, no es crítico
      }

      let html = '';

      // Texto final (ya procesado)
      if (this.finalText && this.finalText.length > 0) {
        html += `<span style="color: #111827; font-weight: 500;">${this.escapeHtml(this.finalText)}</span>`;
        if (this.interimText && this.interimText.length > 0) {
          html += ' ';
        }
      }

      // Texto interim (se está diciendo ahora)
      if (this.interimText && this.interimText.length > 0) {
        html += `<span style="color: #3B82F6; font-style: italic; font-weight: 500;">${this.escapeHtml(this.interimText)}</span>`;
      }

      // Si no hay texto
      if (!html || html.length === 0) {
        html = '<span style="color: #9CA3AF; font-style: italic;">(escuchando...)</span>';
      }

      displayEl.innerHTML = html;
    } catch (err) {
      console.error('❌ Error actualizando display:', err);
    }
  },

  /**
   * Procesar comando de voz y llenar campos
   */
  processVoiceCommand(text) {
    if (!text || text.length < 2) return;

    try {
      // Obtener formulario activo
      const voiceForm = document.getElementById('voice-product-form');
      const regularForm = document.getElementById('product-form');
      const form = (voiceForm && voiceForm.offsetParent !== null) ? voiceForm : regularForm;

      if (!form || !form.elements) {
        console.warn('⚠️ Formulario no encontrado');
        return;
      }

      const normalized = this.normalize(text);
      console.log('📝 Procesando:', normalized);

      // Detectar y procesar campos
      let fieldsFound = 0;

      for (const [fieldName, keywords] of Object.entries(this.fieldKeywords)) {
        const formElement = form.elements[fieldName];
        if (!formElement) continue;

        // Buscar palabra clave
        for (const keyword of keywords) {
          if (normalized.includes(keyword)) {
            // Extraer valor después de la palabra clave
            const value = this.extractValue(normalized, keyword, fieldName);

            if (value && value.length > 0) {
              this.setFieldValue(formElement, fieldName, value);
              console.log(`✅ "${fieldName}" = "${value}"`);
              fieldsFound++;

              // Mostrar notificación (validar que App existe)
              if (typeof App !== 'undefined' && App.showToast) {
                App.showToast(`✓ ${fieldName}: ${value}`, 'success');
              }
            }
            break;
          }
        }
      }

      if (fieldsFound === 0 && text.length > 5) {
        console.log('ℹ️ No se detectaron campos en:', text);
      }
    } catch (err) {
      console.error('❌ Error en processVoiceCommand:', err);
    }
  },

  /**
   * Extraer valor después de una palabra clave
   */
  extractValue(normalized, keyword, fieldName) {
    try {
      const regex = new RegExp(`${keyword}\\s*[es:]?\\s*([^\\s][^a-z]*?)(?:\\s+(?:${Object.values(this.fieldKeywords).flat().join('|')})|$)`, 'i');
      const match = normalized.match(regex);

      if (match && match[1]) {
        let value = match[1].trim();

        // Limpiar valor
        value = value.replace(/[es:]+$/, '').trim();
        value = value.substring(0, 100); // Limitar longitud

        return value;
      }
    } catch (err) {
      console.error(`❌ Error extrayendo valor para ${fieldName}:`, err);
    }

    return null;
  },

  /**
   * Asignar valor a un campo del formulario
   */
  setFieldValue(element, fieldName, value) {
    try {
      if (!element || !value) return;

      switch (fieldName) {
        case 'categoria':
          const catKey = this.findCategory(value);
          element.value = catKey || value;
          // Trigger change para actualizar subcategorías
          if (element.dispatchEvent) {
            const event = new Event('change', { bubbles: true });
            element.dispatchEvent(event);
          }
          if (typeof App !== 'undefined' && App.updateSubcategories) {
            App.updateSubcategories(catKey || value);
          }
          break;

        case 'cantidad':
        case 'stockmin':
        case 'precio':
          // Normalizar números
          const numValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
          element.value = numValue || '';
          break;

        default:
          element.value = value;
      }

      // Trigger input event para validación
      if (element.dispatchEvent) {
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
      }

    } catch (err) {
      console.error(`❌ Error en setFieldValue:`, err);
    }
  },

  /**
   * Encontrar categoría por nombre
   */
  findCategory(voiceInput) {
    if (!CATEGORIES) return null;

    const norm = this.normalize(voiceInput);

    for (const [key, cat] of Object.entries(CATEGORIES)) {
      const catLabel = this.normalize(cat.label);
      if (norm.includes(catLabel) || catLabel.includes(norm)) {
        return key;
      }
    }

    return null;
  },

  /**
   * Normalizar texto para comparación
   */
  normalize(text) {
    try {
      if (!text || typeof text !== 'string') return '';
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
        .replace(/[^\w\s]/g, ' ')         // Solo letras, números, espacios
        .replace(/\s+/g, ' ')             // Espacios múltiples a uno
        .trim();
    } catch (err) {
      console.error('❌ Error en normalize:', err);
      return '';
    }
  },

  /**
   * Escapar HTML
   */
  escapeHtml(text) {
    try {
      if (!text || typeof text !== 'string') return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    } catch (err) {
      console.error('❌ Error en escapeHtml:', err);
      return text || '';
    }
  },

  /**
   * Actualizar UI (botones, indicadores)
   */
  updateUI() {
    const buttons = {
      'voice-record-btn': document.getElementById('voice-record-btn'),
      'voice-main-record-btn': document.getElementById('voice-main-record-btn'),
      'quick-voice-btn': document.getElementById('quick-voice-btn'),
    };

    const status = document.getElementById('voice-status');
    const indicator = document.getElementById('voice-recording-indicator');

    if (this.isRecording) {
      // Estado grabando
      if (buttons['voice-record-btn']) {
        buttons['voice-record-btn'].innerHTML = '<i class="fas fa-stop-circle animate-pulse text-red-500"></i> Detener';
        buttons['voice-record-btn'].classList.add('bg-red-50', 'border-red-300');
        buttons['voice-record-btn'].classList.remove('border-blue-300', 'bg-blue-50');
      }

      if (buttons['voice-main-record-btn']) {
        buttons['voice-main-record-btn'].innerHTML = '<i class="fas fa-stop-circle animate-pulse text-white"></i> Deteniendo...';
        buttons['voice-main-record-btn'].style.background = 'linear-gradient(to right, #DC2626, #EF4444)';
      }

      if (status) {
        status.innerHTML = '<i class="fas fa-microphone animate-pulse text-red-500"></i> Escuchando tu voz...';
        status.className = 'text-xs text-red-600 font-semibold flex items-center gap-1.5';
      }

      if (indicator) {
        indicator.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div><span class="text-xs font-semibold text-red-600">Grabando</span>';
      }
    } else {
      // Estado listo
      if (buttons['voice-record-btn']) {
        buttons['voice-record-btn'].innerHTML = '<i class="fas fa-microphone"></i> Grabar';
        buttons['voice-record-btn'].classList.remove('bg-red-50', 'border-red-300');
        buttons['voice-record-btn'].classList.add('border-blue-300', 'bg-blue-50');
      }

      if (buttons['voice-main-record-btn']) {
        buttons['voice-main-record-btn'].innerHTML = '<i class="fas fa-microphone text-2xl"></i><span>Presiona para grabar</span>';
        buttons['voice-main-record-btn'].style.background = 'linear-gradient(to right, #A855F7, #3B82F6)';
      }

      if (status) {
        status.innerHTML = '<i class="fas fa-check-circle text-green-500"></i> Listo para grabar';
        status.className = 'text-xs text-green-600 font-semibold flex items-center gap-1.5';
      }

      if (indicator) {
        indicator.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-green-500"></div><span class="text-xs font-semibold text-green-600">Listo</span>';
      }
    }
  },

  /**
   * Iniciar grabación
   */
  start() {
    if (!this.recognition) {
      if (!this.init()) {
        console.error('❌ No se pudo inicializar Speech Recognition');
        return;
      }
    }

    try {
      this.recognition.start();
      console.log('▶️ Grabación iniciada');
    } catch (err) {
      if (err.name !== 'InvalidStateError') {
        console.error('❌ Error iniciando grabación:', err);
      }
    }
  },

  /**
   * Detener grabación
   */
  stop() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
      console.log('⏹️ Grabación detenida');
    } catch (err) {
      console.error('❌ Error deteniendo grabación:', err);
    }
  },

  /**
   * Alternar grabación (play/pause)
   */
  toggleRecording() {
    if (this.isRecording) {
      this.stop();
    } else {
      this.start();
    }
  },
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando VoiceInput...');
    VoiceInput.init();
  });
} else {
  console.log('🚀 Inicializando VoiceInput...');
  VoiceInput.init();
}
