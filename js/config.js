// InvenHogar - Configuration & Constants

const CONFIG = {
  APP_NAME: 'InvenHogar',
  VERSION: '1.0.0',
  STORAGE_KEY: 'inventario_items',
  SETTINGS_KEY: 'inventario_settings',
  ID_COUNTER_KEY: 'inventario_id_counter',
};

const CATEGORIES = {
  ferreteria: {
    label: 'Ferretería',
    color: '#EA580C',
    bg: '#FFF7ED',
    border: '#FED7AA',
    icon: 'fa-screwdriver-wrench',
    subcategories: ['Tornillos y tuercas', 'Herramientas manuales', 'Cintas y adhesivos', 'Fijaciones', 'Llaves y candados', 'Cables y conectores', 'Otro'],
  },
  limpieza: {
    label: 'Limpieza',
    color: '#0891B2',
    bg: '#ECFEFF',
    border: '#A5F3FC',
    icon: 'fa-spray-can-sparkles',
    subcategories: ['Detergentes', 'Desinfectantes', 'Limpiavidrios', 'Esponjas y estropajos', 'Trapeadores y escobas', 'Bolsas de basura', 'Ambientadores', 'Otro'],
  },
  hogar: {
    label: 'Hogar',
    color: '#16A34A',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    icon: 'fa-house',
    subcategories: ['Cocina', 'Baño', 'Dormitorio', 'Sala', 'Jardín', 'Decoración', 'Textiles', 'Otro'],
  },
  muebles: {
    label: 'Protección Muebles',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    icon: 'fa-couch',
    subcategories: ['Cubiertas', 'Tapizados', 'Barnices y lacas', 'Cera y polish', 'Fieltros y topes', 'Otro'],
  },
  reparacion: {
    label: 'Reparaciones',
    color: '#DC2626',
    bg: '#FFF1F2',
    border: '#FECDD3',
    icon: 'fa-hammer',
    subcategories: ['Pintura', 'Selladores', 'Masillas', 'Repuestos eléctricos', 'Plomería', 'Otro'],
  },
  aliexpress: {
    label: 'AliExpress',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: 'fa-box',
    subcategories: ['Electrónica', 'Gadgets', 'Iluminación', 'Organización', 'Herramientas', 'Decoración', 'Otro'],
  },
  otros: {
    label: 'Otros',
    color: '#4B5563',
    bg: '#F9FAFB',
    border: '#E5E7EB',
    icon: 'fa-ellipsis',
    subcategories: ['General', 'Otro'],
  },
};

const UNITS = [
  { value: 'unidad', label: 'Unidad(es)' },
  { value: 'pza', label: 'Pieza(s)' },
  { value: 'caja', label: 'Caja(s)' },
  { value: 'rollo', label: 'Rollo(s)' },
  { value: 'litro', label: 'Litro(s)' },
  { value: 'ml', label: 'ml' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'gramos' },
  { value: 'm', label: 'metro(s)' },
  { value: 'par', label: 'Par(es)' },
  { value: 'bolsa', label: 'Bolsa(s)' },
  { value: 'sobre', label: 'Sobre(s)' },
];

const SOURCES = [
  'AliExpress', 'Amazon', 'Sodimac', 'Easy', 'Homecenter',
  'Ferretería Local', 'Supermercado', 'Mercado Libre', 'Otro',
];

const CHART_COLORS = Object.values(CATEGORIES).map(c => c.color);
