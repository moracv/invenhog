# InvenHogar - Despliegue en Cloudflare Pages

## Requisitos
- Cuenta de GitHub (para conectar el repositorio)
- Cuenta de Cloudflare (gratuita)

## Pasos para desplegar

### 1. Preparar el repositorio en GitHub

```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "Initial InvenHogar app"
git branch -M main

# Crear repositorio en GitHub y agregar origen
git remote add origin https://github.com/TU_USUARIO/invenhog
git push -u origin main
```

### 2. Conectar Cloudflare Pages

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Selecciona **Pages** (en el menú de la izquierda)
3. Clic en **Crear un proyecto**
4. Selecciona **Conectar a Git**
5. Autoriza acceso a GitHub
6. Selecciona tu repositorio `invenhog`
7. Haz clic en **Comenzar configuración**

### 3. Configurar construcción

En la pantalla de configuración:

**Configuración del compilador**
- **Rama de producción**: `main`
- **Contexto de construcción**: Déjalo vacío (sin build)
- **Comando de compilación**: Dejar vacío
- **Directorio de salida**: `.`

**Variables de entorno** (opcional)
- No necesario para InvenHogar

Haz clic en **Guardar e implementar**

### 4. Completar

Cloudflare desplegará tu app automáticamente. Una vez completado:
- Tu app estará disponible en: `https://tu-nombre.pages.dev`
- Se actualizará automáticamente con cada push a `main`

## Configuración recomendada en Cloudflare

### Configurar dominio personalizado
1. Ve a **Configuración del sitio**
2. Sección **Dominio personalizado**
3. Agregación tu dominio personalizado

### Activar caché

En el dashboard de Cloudflare para tu dominio:
1. Caching → Cache Rules
2. Crear regla:
   - **Si**: URI path contiene `js/`, `css/`, `icons/`, `*.json`
   - **Entonces**: Cache TTL = 1 mes

### Seguridad

Se recomienda (pero es opcional):
1. Security → Page Rules
2. Agregar: `https://tu-sitio.com/*`
3. Activar **Always HTTPS**

## Actualizar la app

Una vez desplegado:

```bash
# Hacer cambios locales
nano index.html  # o edita los archivos que quieras

# Enviar a GitHub
git add .
git commit -m "Actualizar InvenHogar"
git push origin main
```

Cloudflare detectará automáticamente el cambio y lo desplegará en segundos.

## Problemas comunes

**La app no carga desde Google Sheets**
- Verifica que la URL del Apps Script esté correctamente configurada
- Asegúrate que el Apps Script esté publicado como "Cualquier persona"

**Service Worker no funciona**
- Los Service Workers requieren HTTPS
- Cloudflare Pages proporciona HTTPS automáticamente

**Iconos no aparecen**
- Verifica que los archivos SVG estén en `icons/`
- Todos los iconos deben tener extensión `.svg`

## Almacenamiento de datos

**Nota importante:**
- InvenHogar almacena datos en **localStorage del navegador**
- Los datos se sincronizan con **Google Sheets** automáticamente
- Sin Google Sheets configurado, los datos se guardan solo localmente
- Los datos locales NO se pierden al desplegar actualizaciones

## Capacidades offline

InvenHogar funciona sin conexión gracias a:
- **Service Worker**: Cachea la app
- **LocalStorage**: Almacena datos localmente
- **Progressive Web App**: Se instala como app nativa

Cuando hay conexión, sincroniza automáticamente con Google Sheets.

## Desinstalar / Remover

Para eliminar la app de Cloudflare Pages:
1. Ve a **Configuración del sitio**
2. Scroll al final → **Eliminar proyecto**
3. Confirma la eliminación

Esto no afecta tu repositorio de GitHub ni los datos almacenados.

---

**¿Preguntas?** Revisa [documentación de Cloudflare Pages](https://developers.cloudflare.com/pages/)
