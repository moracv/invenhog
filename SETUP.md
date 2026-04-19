# InvenHogar - Guía de Configuración

Sigue estos pasos para configurar completamente InvenHogar con sincronización Google Sheets.

## 📋 Checklist de configuración

- [ ] Descargar/clonar el proyecto
- [ ] Iniciar servidor HTTP local
- [ ] Abrir InvenHogar en el navegador
- [ ] Crear hoja Google Sheets
- [ ] Configurar Apps Script
- [ ] Conectar URL en InvenHogar
- [ ] Probar sincronización
- [ ] Instalar como PWA (opcional)

---

## Paso 1: Obtener el proyecto

### Opción A: Descargar ZIP
1. Haz clic en **Code** en GitHub
2. Selecciona **Download ZIP**
3. Extrae en tu carpeta deseada

### Opción B: Git
```bash
git clone https://github.com/TU_USUARIO/invenhog.git
cd invenhog
```

---

## Paso 2: Iniciar servidor HTTP local

### Windows (PowerShell)
```powershell
cd C:\programa\Sistema de inventario
python -m http.server 8000
```

### macOS / Linux (Terminal)
```bash
cd ~/Sistema de inventario
python3 -m http.server 8000
```

### Con Node.js (alternativa)
```bash
npx http-server
```

**Resultado esperado:**
```
Serving HTTP on 0.0.0.0 port 8000
```

---

## Paso 3: Abrir InvenHogar

1. Abre tu navegador
2. Ve a: **http://localhost:8000**
3. Deberías ver la interfaz de InvenHogar

Si no aparece:
- Verifica que el puerto 8000 esté disponible
- Intenta otro puerto: `python -m http.server 8080`
- Actualiza la página (Ctrl+F5)

---

## Paso 4: Crear hoja Google Sheets

1. Ve a [https://sheets.google.com](https://sheets.google.com)
2. Clic en **Crear** (botón rojo)
3. Selecciona **Hoja de cálculo en blanco**
4. Dale un nombre: "InvenHogar" (o el que prefieras)
5. Clic en **Crear**

Abre la hoja que acabas de crear (la necesitarás en el siguiente paso).

---

## Paso 5: Configurar Google Apps Script

### 5.1 Abrir Apps Script

1. En tu hoja de Google Sheets
2. Ve a **Extensiones** (menú superior)
3. Selecciona **Apps Script**
4. Se abrirá una nueva pestaña

### 5.2 Reemplazar el código

1. En el editor de Apps Script, verás una función `myFunction()`
2. **Selecciona TODO el código** (Ctrl+A)
3. **Borra** (Delete)
4. **Copia el contenido** de `apps-script.gs` de este proyecto
5. **Pega** en el editor
6. Clic en **Guardar** (Ctrl+S)

### 5.3 Publicar como Web App

1. Haz clic en **Implementar** (botón azul, arriba a la derecha)
2. Selecciona **Nueva implementación**
3. Haz clic en el ícono de engranaje → **Aplicación web**
4. Configura:
   - **Ejecutar como**: Tu cuenta de Google
   - **Acceso de los usuarios**: Cualquier persona (even anonymous)
5. Clic en **Implementar**

**IMPORTANTE**: Puede pedir que autorices. Haz clic en **Autorizar** y da los permisos.

### 5.4 Copiar URL

1. Verás una pantalla con "Implementación de la aplicación web"
2. Busca la **URL de implementación** (algo como: `https://script.google.com/macros/s/AKfycb.../exec`)
3. **Copia esta URL** (icono de copiar)
4. Guarda en un bloc de notas (la necesitarás en el siguiente paso)

---

## Paso 6: Conectar en InvenHogar

1. Vuelve a InvenHogar (http://localhost:8000)
2. Haz clic en el menú **Configuración** (engranaje, abajo a la izquierda)
3. En la sección **Google Sheets — Base de Datos**
4. **Pega la URL** en el campo **URL del Apps Script**
5. Clic en **Probar conexión**

**Debería mostrar**: "Conexión exitosa. X productos encontrados."

Si hay error:
- Verifica que la URL sea correcta
- Verifica que el Apps Script esté publicado como "Cualquier persona"
- Vuelve a desplegar el Apps Script

6. Clic en **Guardar**

---

## Paso 7: Prueba

1. Haz clic en **Agregar Producto**
2. Completa un producto de prueba
3. Clic en **Guardar Producto**
4. Verifica que aparezca en **Inventario**
5. Abre tu hoja de Google Sheets
6. Deberías ver el producto en la fila 2

Si funciona correctamente, ¡ya está todo configurado! 🎉

---

## Paso 8: Agregar más productos (opcional)

### Por formulario (manual)
1. Clic en **Agregar Producto**
2. Completa los campos
3. Clic en **Guardar**

### Por voz
1. Clic en **Por voz** (micrófono, en la barra superior)
2. Presiona el botón de grabación
3. Di los datos: "nombre: Cinta de embalaje", etc.
4. Guarda el producto

### Importar desde CSV (futuro)
Por ahora, el método más rápido es agregar manualmente.

---

## Paso 9: Imprimir etiquetas (opcional)

1. Haz clic en **Etiquetas**
2. Selecciona los productos que quieres etiquetar
3. Clic en **Imprimir X etiquetas**
4. Ajusta el tamaño de papel en tu impresora
5. Imprime y pega en cada producto

---

## Paso 10: Instalar como PWA (opcional)

### Android
1. Abre InvenHogar en **Chrome** en tu Android
2. Presiona el menú (3 puntos)
3. Selecciona **Agregar a pantalla de inicio**
4. Elige un nombre
5. ¡Listo! Aparecerá como app nativa

### PC (Windows/Mac)
1. Abre InvenHogar en **Chrome** o **Edge**
2. Busca el ícono de instalación (esquina superior derecha)
3. O ve a Menú → **Instalar InvenHogar**
4. Elige dónde instalarlo
5. ¡Úsalo como una app de escritorio!

---

## ✅ Verificación final

- [ ] InvenHogar se abre en http://localhost:8000
- [ ] Puedes agregar productos
- [ ] Los productos aparecen en Google Sheets
- [ ] Las sincronizaciones funcionan
- [ ] La entrada por voz captura datos
- [ ] Las etiquetas se imprimen correctamente
- [ ] La app se puede instalar como PWA

---

## 🚀 Siguiente paso: Despliegue en la nube

Una vez todo funciona localmente, puedes:

1. **Cloudflare Pages** (recomendado) - Ver [CLOUDFLARE.md](CLOUDFLARE.md)
2. **GitHub Pages** - Coloca los archivos en `gh-pages`
3. **Vercel** - Conecta tu repositorio
4. **Servidor propio** - Copia los archivos a tu servidor

---

## 🆘 Troubleshooting

### "El servidor no inicia"
```bash
# Si el puerto 8000 está en uso:
python -m http.server 8080  # usa otro puerto
```

### "Voz no funciona"
- Verificar micrófono conectado
- Permitir acceso a micrófono en navegador
- Solo funciona en Chrome/Edge
- Requiere HTTPS o localhost

### "Google Sheets no sincroniza"
- Verificar URL correcta en Configuración
- Verificar que Apps Script esté publicado como "Cualquier persona"
- Volver a desplegar el Apps Script
- Probar la conexión en Configuración

### "No puedo instalar como PWA"
- Requiere HTTPS (localhost está OK)
- Usar Chrome o Edge
- En Android usar Chrome

---

## 📞 ¿Necesitas ayuda?

1. **Revisión rápida**: Lee nuevamente este documento
2. **Errores específicos**: Busca en README.md
3. **Despliegue**: Ve a CLOUDFLARE.md

---

**¡Disfruta usando InvenHogar!** 🎉

Recordatorio: Todos tus datos se sincronizan con Google Sheets, que es totalmente tuyo.
