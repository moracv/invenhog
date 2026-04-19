# InvenHogar 📦

**Sistema de Inventario del Hogar** — Captura, gestiona y rastrea todo lo que tienes en casa con sincronización Google Sheets, entrada por voz y códigos de barras.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-PWA-orange)

## ✨ Características

- 🎤 **Entrada por Voz**: Agrega productos hablando naturalmente
- 📊 **Dashboard**: KPIs, gráficos y alertas en tiempo real
- 🏷️ **Códigos de Barras**: Genera etiquetas Code128 para imprimir
- 📍 **Organización**: Categoriza por tipo, ubicación, cantidad
- ☁️ **Google Sheets**: Sincronización automática en tiempo real
- 📱 **PWA Instalable**: Funciona como app nativa en Android/PC
- 🌐 **Offline**: Funciona sin conexión con sincronización automática
- 🎨 **Responsive**: Mobile-first, funciona en cualquier pantalla
- 🚀 **Cloudflare Ready**: Despliega en Cloudflare Pages en 3 minutos

## 🎯 Casos de uso

- **Inventario del hogar**: Ferretería, limpieza, hogar, reparaciones
- **Compras AliExpress**: Rastrea todo lo que ordenaste
- **Bodega/Almacén**: Gestiona stock mínimo con alertas
- **Tienda pequeña**: Control de inventario sin costo

## 🚀 Inicio rápido

### Local (para desarrollo)

```bash
# 1. Clonar o descargar este repositorio
cd C:/programa/Sistema\ de\ inventario

# 2. Iniciar servidor (Python)
python -m http.server 8000

# 3. Abrir en navegador
# http://localhost:8000
```

### En Cloudflare Pages (producción)

Ver [CLOUDFLARE.md](CLOUDFLARE.md) para despliegue en 3 minutos.

## 📝 Uso básico

### 1. Primer producto

1. Clic en **Agregar** (o **Por Voz**)
2. Completa: Nombre, Categoría, Ubicación, Cantidad
3. Clic en **Guardar Producto**

### 2. Agregar por Voz

1. Abre la sección **Agregar por Voz**
2. Presiona el botón de micrófono
3. Di: `"nombre: Cinta de embalaje marrón"`
4. Di: `"ubicacion: Bodega estante 2"`
5. Di: `"cantidad: 5"`
6. Completa lo que falta y guarda

### 3. Configurar Google Sheets

Para sincronizar datos en la nube:

1. Crea una hoja en [Google Sheets](https://sheets.google.com)
2. Ve a **Extensiones → Apps Script**
3. Pega el contenido de `apps-script.gs`
4. **Implementar → Nueva implementación**
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Acceso: **Cualquier persona**
5. Copia la URL generada
6. En InvenHogar → **Configuración** → Pega la URL
7. Clic en **Probar conexión**

### 4. Imprimir etiquetas

1. Sección **Etiquetas**
2. Selecciona productos (o "Seleccionar todos")
3. Clic en **Imprimir**
4. Ajusta tamaño y papel en tu impresora
5. Pega en cada producto

### 5. Dashboard

- **Total Productos**: Cantidad total de artículos
- **Stock Bajo**: Artículos con nivel mínimo
- **Valor Total**: Estimación de inversión
- **Gráficos**: Por categoría y ubicación
- **Alertas**: Productos con poco stock

## 🗂️ Estructura del proyecto

```
Sistema de inventario/
├── index.html          # Interfaz principal (PWA)
├── manifest.json       # Configuración PWA + Android
├── sw.js              # Service Worker (caché offline)
│
├── css/
│   └── app.css        # Estilos personalizados
│
├── js/
│   ├── config.js      # Categorías, unidades, colores
│   ├── api.js         # API Google Sheets + localStorage
│   ├── app.js         # Lógica principal (1500+ líneas)
│   └── voice.js       # Reconocimiento de voz
│
├── icons/
│   ├── icon.svg       # Ícono simple
│   ├── icon-192.svg   # PWA 192x192
│   └── icon-512.svg   # PWA 512x512
│
├── apps-script.gs     # Backend Google Apps Script
├── README.md          # Este archivo
├── CLOUDFLARE.md      # Guía de despliegue en Cloudflare
└── SETUP.md           # Instrucciones de configuración
```

## 🎨 Categorías incluidas

| Categoría | Color | Casos de uso |
|-----------|-------|--------------|
| 🔧 Ferretería | Orange | Tornillos, herramientas, cables |
| 🧹 Limpieza | Cyan | Detergentes, esponjas, bolsas |
| 🏠 Hogar | Green | Muebles, textiles, decoración |
| 🛋️ Protección | Violet | Cubiertas, cera, tapizados |
| 🔨 Reparaciones | Red | Pintura, selladores, masillas |
| 📦 AliExpress | Amber | Gadgets, electrónica, accesorios |
| 📌 Otros | Gray | Categoría flexible |

## 🎤 Reconocimiento de voz

Soporta **Chrome**, **Edge**, **Android Chrome** — usa Web Speech API.

### Comandos de voz soportados

```
"nombre: Cinta de embalaje marrón"
"categoria: Ferretería"
"subcategoria: Cintas y adhesivos"
"ubicacion: Bodega estante 2"
"cantidad: 5"
"unidad: unidades"  // o: pza, caja, rollo, litro, kg, metro, etc.
"stock minimo: 1"
"precio: 5000"
"fuente: AliExpress"
```

El sistema detecta automáticamente qué campo completar basándose en palabras clave.

## 📱 Instalación como PWA

### Android (Chrome)
1. Abre la app en Chrome
2. Menú (⋮) → "Agregar a pantalla de inicio"
3. Elige un nombre y ¡listo!

### PC (Windows/Mac)
1. Abre en Chrome o Edge
2. Busca el ícono de instalación en la barra de direcciones
3. O: Menú → "Instalar InvenHogar"

### iPhone (Safari)
1. Abre en Safari
2. Clic en Compartir → "Agregar a pantalla de inicio"

## 🔐 Seguridad y privacidad

- ✅ **Sin servidor backend**: Todo local en tu navegador
- ✅ **Sin tracking**: No recopilamos datos
- ✅ **Google Sheets es tu opción**: Almacenamiento totalmente controlado por ti
- ✅ **Offline-first**: No necesita conexión constante
- ✅ **HTTPS requerido**: Protección de datos en tránsito (Cloudflare)

## ⚙️ Desarrollo

### Tecnologías

- **Frontend**: HTML5, CSS3 (Tailwind CDN), Vanilla JavaScript
- **Backend**: Google Apps Script (optional)
- **Storage**: localStorage + Google Sheets API
- **Charts**: Chart.js
- **Barcodes**: JsBarcode (Code128)
- **Voice**: Web Speech API

### Requisitos para desarrollo

- Editor de texto (VS Code, Sublime, etc.)
- Navegador moderno (Chrome, Edge, Firefox)
- Servidor HTTP simple (Python, Node, etc.)

### Archivo de configuración del servidor

Para desarrollo local con Python:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (si tienes instalado)
npx http-server
```

Luego abre `http://localhost:8000`

## 🌐 Despliegue

### Opción 1: Cloudflare Pages (recomendado)
- **Costo**: Gratuito
- **Tiempo de deploy**: Automático con cada push
- **Dominio**: `https://tu-nombre.pages.dev` (o tu dominio)
- **Ver**: [CLOUDFLARE.md](CLOUDFLARE.md)

### Opción 2: Vercel
- **Costo**: Gratuito
- **Setup**: Similar a Cloudflare Pages

### Opción 3: GitHub Pages
- **Costo**: Gratuito
- **Limitación**: Requiere HTTPS (GitHub proporciona)
- **Ver configuración**:
  1. Settings → Pages
  2. Source: main branch
  3. Deploy from a branch

### Opción 4: Servidor propio
- Copia los archivos a tu servidor web
- Requiere HTTPS para Service Worker
- Usa Apache, Nginx, etc.

## 📊 Exportar datos

En **Configuración**:
- **Exportar CSV**: Descarga todos los productos en CSV
- **Limpiar datos locales**: Elimina solo datos locales (no Google Sheets)

## 🐛 Troubleshooting

### "La voz no funciona"
- ✅ Verificar permisos de micrófono en Chrome
- ✅ Chrome/Edge solo: Web Speech API no está en Firefox
- ✅ Debe ser HTTPS o localhost

### "Google Sheets no sincroniza"
- ✅ Verificar URL del Apps Script es correcta
- ✅ Verificar que Apps Script esté publicado como "Cualquier persona"
- ✅ Probar conexión en Configuración

### "Los iconos de la PWA no aparecen"
- ✅ Vaciar caché del navegador
- ✅ Verificar que `icons/icon-192.svg` existe
- ✅ En Android, desinstalar y reinstalar la app

### "Service Worker no carga"
- ✅ Requiere HTTPS (no funciona en file://)
- ✅ En localhost está OK
- ✅ Cloudflare Pages proporciona HTTPS automáticamente

## 📄 Licencia

Este proyecto está disponible bajo licencia MIT. ¡Úsalo libremente!

## 🤝 Contribuciones

¿Ideas para mejorar InvenHogar?
- Abre un issue en GitHub
- Sugiere nuevas funciones
- Reporta bugs

## 📞 Soporte

- Documentación: Este README
- Despliegue: [CLOUDFLARE.md](CLOUDFLARE.md)
- Setup: [SETUP.md](SETUP.md)
- Código: Comentarios en el código fuente

---

**InvenHogar** - Gestiona tu hogar con inteligencia 🏡

Hecho con ❤️ para organizar hogares
