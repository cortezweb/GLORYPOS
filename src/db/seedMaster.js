// Catálogo Maestro Global de Productos para Bolivia
// Precargado con productos de consumo masivo para que el comerciante solo asigne precio y stock.

export const MASTER_PRODUCTS = [
  {
    id: 'master-coca-2l',
    codigo_barras: '7771234000018',
    nombre: 'Coca-Cola Original 2 Litros Retornable',
    categoria: 'Bebidas & Gaseosas',
    unidad_medida: 'Botella',
    foto_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    precio_sugerido: 11.50,
    codigo_siat: '24490',
    presentaciones: [
      { id: 'u', nombre: 'Unidad', factor: 1, precio_extra: 0 },
      { id: 'pack-6', nombre: 'Pack x6', factor: 6, precio_extra: 65.00 },
      { id: 'caja-12', nombre: 'Caja x12', factor: 12, precio_extra: 128.00 }
    ]
  },
  {
    id: 'master-coca-3l',
    codigo_barras: '7771234000025',
    nombre: 'Coca-Cola Original 3 Litros No Retornable',
    categoria: 'Bebidas & Gaseosas',
    unidad_medida: 'Botella',
    foto_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&q=80',
    precio_sugerido: 16.00,
    codigo_siat: '24490',
    presentaciones: [
      { id: 'u', nombre: 'Unidad', factor: 1, precio_extra: 0 },
      { id: 'pack-6', nombre: 'Pack x6', factor: 6, precio_extra: 92.00 }
    ]
  },
  {
    id: 'master-pacena-pilsener',
    codigo_barras: '7771234000032',
    nombre: 'Cerveza Paceña Pilsener 710ml',
    categoria: 'Licores & Cervezas',
    unidad_medida: 'Botella',
    foto_url: 'https://images.unsplash.com/photo-1608270190977-841961ee4f14?auto=format&fit=crop&w=400&q=80',
    precio_sugerido: 15.00,
    codigo_siat: '24310',
    presentaciones: [
      { id: 'u', nombre: 'Unidad', factor: 1, precio_extra: 0 },
      { id: 'caja-12', nombre: 'Caja x12', factor: 12, precio_extra: 165.00 }
    ]
  },
  {
    id: 'master-leche-pil-1l',
    codigo_barras: '7771234000049',
    nombre: 'Leche PIL Entera Fluida 1 Litro UHT',
    categoria: 'Lácteos & Huevos',
    unidad_medida: 'Bolsa / Sachet',
    foto_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    precio_sugerido: 6.00,
    codigo_siat: '22110',
    presentaciones: [
      { id: 'u', nombre: 'Unidad', factor: 1, precio_extra: 0 },
      { id: 'caja-10', nombre: 'Bulto x10', factor: 10, precio_extra: 58.00 }
    ]
  },
  {
    id: 'master-fideo-famosa',
    codigo_barras: '7771234000056',
    nombre: 'Fideo Famosa Spaguetti 400g',
    categoria: 'Abarrotes',
    unidad_medida: 'Bolsa',
    foto_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
    precio_sugerido: 5.50,
    codigo_siat: '23710',
    presentaciones: [
      { id: 'u', nombre: 'Paquete', factor: 1, precio_extra: 0 },
      { id: 'fardo-20', nombre: 'Fardo x20', factor: 20, precio_extra: 102.00 }
    ]
  },
  {
    id: 'master-aceite-fino-900ml',
    codigo_barras: '7771234000063',
    nombre: 'Aceite Vegetal Fino 900ml',
    categoria: 'Abarrotes',
    unidad_medida: 'Botella',
    foto_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    precio_sugerido: 12.00,
    codigo_siat: '21510',
    presentaciones: [
      { id: 'u', nombre: 'Unidad', factor: 1, precio_extra: 0 },
      { id: 'caja-12', nombre: 'Caja x12', factor: 12, precio_extra: 138.00 }
    ]
  },
  {
    id: 'master-galleta-mabels',
    codigo_barras: '7771234000070',
    nombre: 'Galletas Mabel Moraditas 140g',
    categoria: 'Snacks & Golosinas',
    unidad_medida: 'Paquete',
    foto_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
    precio_sugerido: 4.50,
    codigo_siat: '23420',
    presentaciones: [
      { id: 'u', nombre: 'Unidad', factor: 1, precio_extra: 0 },
      { id: 'tira-12', nombre: 'Tira x12', factor: 12, precio_extra: 48.00 }
    ]
  },
  {
    id: 'master-cafe-copacabana',
    codigo_barras: '7771234000087',
    nombre: 'Café Molido Copacabana Tradicional 250g',
    categoria: 'Abarrotes',
    unidad_medida: 'Paquete',
    foto_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
    precio_sugerido: 22.00,
    codigo_siat: '23910'
  },
  {
    id: 'master-agua-vital-600ml',
    codigo_barras: '7771234000094',
    nombre: 'Agua Vital Sin Gas 600ml',
    categoria: 'Bebidas & Gaseosas',
    unidad_medida: 'Botella',
    foto_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80',
    precio_sugerido: 4.00,
    codigo_siat: '24410'
  },
  {
    id: 'master-arroz-grano-oro',
    codigo_barras: '7771234000100',
    nombre: 'Arroz Grano de Oro 1 Kilo',
    categoria: 'Abarrotes',
    unidad_medida: 'Bolsa',
    foto_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    precio_sugerido: 8.50,
    codigo_siat: '23160'
  }
];
