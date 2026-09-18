// Definición de Rubros y Catálogos Maestros por Industria para GLORYPOS Bolivia

export const RUBROS_CONFIG = {
  ABARROTES: {
    id: 'ABARROTES',
    nombre: 'Minimarket & Abarrotes',
    subtitulo: 'Tiendas de barrio, autoservicios y abarrotes',
    icono: 'Store',
    color: 'blue',
    badge: 'Consumo Masivo',
    descripcion: 'Cobro rápido con lector de códigos de barra, packs x6, fardos y farditos.',
    unidades_sugeridas: ['Unidad', 'Paquete', 'Botella', 'Pack x6', 'Caja x12', 'Fardo'],
    categorias: ['Abarrotes', 'Bebidas & Gaseosas', 'Lácteos & Huevos', 'Snacks & Golosinas', 'Licores & Cervezas', 'Limpieza & Hogar'],
    features: ['EAN-13 Barcode', 'Packs y Cajas', 'Arqueo Rápido']
  },
  FERRETERIA: {
    id: 'FERRETERIA',
    nombre: 'Ferretería & Construcción',
    subtitulo: 'Materiales de construcción, pinturas y herramientas',
    icono: 'Wrench',
    color: 'amber',
    badge: 'Ferretería & Bazar',
    descripcion: 'Venta fraccionada por metros, kilos, bolsas, precio por mayor y cotizaciones.',
    unidades_sugeridas: ['Pieza / Unidad', 'Metro lineal', 'Kilo', 'Bolsa 50kg', 'Varilla', 'Galón', 'Litro', 'Docena'],
    categorias: ['Herramientas', 'Pinturas & Selladores', 'Cables & Electricidad', 'Plomería & PVC', 'Materiales de Obra', 'Tornillería & Fijación'],
    features: ['Metros y Kilos', 'Cotizaciones a WhatsApp', 'Precios Mayoristas']
  },
  FARMACIA: {
    id: 'FARMACIA',
    nombre: 'Farmacia & Botica',
    subtitulo: 'Medicamentos, perfumería y cuidado personal',
    icono: 'Pill',
    color: 'emerald',
    badge: 'Salud & Botica',
    descripcion: 'Control riguroso de Lotes, Fechas de Vencimiento, principio activo y venta por blíster/caja.',
    unidades_sugeridas: ['Caja', 'Blíster', 'Pastilla / Unidad', 'Frasco', 'Tubo', 'Sobre', 'Ampolla'],
    categorias: ['Analgésicos & Antiinflamatorios', 'Antibióticos', 'Cuidado Personal', 'Pediatría & Bebés', 'Primeros Auxilios', 'Vitaminas & Suplementos'],
    features: ['Lote y Vencimiento', 'Venta por Blíster/Pastilla', 'Principio Activo']
  },
  ROPA: {
    id: 'ROPA',
    nombre: 'Tienda de Ropa & Calzado',
    subtitulo: 'Boutiques, moda, calzado y accesorios',
    icono: 'Shirt',
    color: 'violet',
    badge: 'Moda & Confección',
    descripcion: 'Control de inventario por Tallas y Colores, etiquetas colgantes de ropa con código.',
    unidades_sugeridas: ['Prenda / Unidad', 'Par', 'Docena', 'Set'],
    categorias: ['Poleras & Camisas', 'Pantalones & Jeans', 'Casacas & Abrigos', 'Calzado & Zapatillas', 'Ropa Deportiva', 'Accesorios'],
    features: ['Matriz Talla/Color', 'Etiquetas Colgantes', 'Descuentos por Temporada']
  },
  CARNICERIA: {
    id: 'CARNICERIA',
    nombre: 'Carnicería, Frial & Frutería',
    subtitulo: 'Venta al peso, friales, carnes y verduras',
    icono: 'Beef',
    color: 'rose',
    badge: 'Balanza & Peso',
    descripcion: 'Venta fraccionada por peso (Kg y gramos), cálculo con balanza y precios por kilo.',
    unidades_sugeridas: ['Kilogramo (Kg)', 'Gramo (g)', 'Libra', 'Unidad', 'Docena', 'Bandeja'],
    categorias: ['Carne de Res', 'Carne de Cerdo', 'Pollo & Aves', 'Embutidos & Fiambres', 'Frutas & Verduras', 'Quesos & Lácteos'],
    features: ['Teclado Balanza Decimal', 'Precio por Kilo', 'Venta por Gramos']
  },
  HELADERIA: {
    id: 'HELADERIA',
    nombre: 'Heladería & Cafetería',
    subtitulo: 'Heladerías artesanales, cafeterías y comida rápida',
    icono: 'IceCream',
    color: 'cyan',
    badge: 'Gastronomía & Dulces',
    descripcion: 'Selección táctil rápida de sabores (bolas), toppings, salsas y comanda de preparación.',
    unidades_sugeridas: ['Porción / Vaso', 'Cono', 'Copa', 'Litro / Pote', 'Taza', 'Porción'],
    categorias: ['Conos & Vasos', 'Copas & Sundaes', 'Cafetería & Bebidas Calientes', 'Tortas & Repostería', 'Frappes & Bebidas Frías', 'Packs Familiares'],
    features: ['Sabores y Bolas', 'Toppings y Salsas', 'Comanda Rápida']
  }
};

// Catálogos demo especializados para cada rubro
export const DEMO_CATALOGS = {
  ABARROTES: [
    {
      id: 'prod-coca-2l',
      nombre: 'Coca-Cola Original 2L Retornable',
      categoria: 'Bebidas & Gaseosas',
      unidad_medida: 'Botella',
      foto_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
      precio_venta: 11.50,
      precio_compra: 9.50,
      stock_actual: 36,
      stock_minimo: 6,
      codigo_barras: '7771234000018',
      tipo_venta: 'UNIDAD',
      presentaciones: [
        { id: 'u', nombre: 'Unidad', factor: 1, precio: 11.50 },
        { id: 'pack-6', nombre: 'Pack x6', factor: 6, precio: 65.00 },
        { id: 'caja-12', nombre: 'Caja x12', factor: 12, precio: 128.00 }
      ]
    },
    {
      id: 'prod-pacena',
      nombre: 'Cerveza Paceña Pilsener 710ml',
      categoria: 'Licores & Cervezas',
      unidad_medida: 'Botella',
      foto_url: 'https://images.unsplash.com/photo-1608270190977-841961ee4f14?auto=format&fit=crop&w=400&q=80',
      precio_venta: 15.00,
      precio_compra: 12.00,
      stock_actual: 24,
      stock_minimo: 4,
      codigo_barras: '7771234000032',
      tipo_venta: 'UNIDAD'
    },
    {
      id: 'prod-leche-pil',
      nombre: 'Leche PIL Entera 1L UHT',
      categoria: 'Lácteos & Huevos',
      unidad_medida: 'Sachet',
      foto_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
      precio_venta: 6.00,
      precio_compra: 5.20,
      stock_actual: 40,
      stock_minimo: 10,
      codigo_barras: '7771234000049',
      tipo_venta: 'UNIDAD'
    },
    {
      id: 'prod-fideo-famosa',
      nombre: 'Fideo Famosa Spaguetti 400g',
      categoria: 'Abarrotes',
      unidad_medida: 'Paquete',
      foto_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
      precio_venta: 5.50,
      precio_compra: 4.30,
      stock_actual: 20,
      stock_minimo: 5,
      codigo_barras: '7771234000056',
      tipo_venta: 'UNIDAD'
    }
  ],

  FERRETERIA: [
    {
      id: 'ferr-cemento-viacha',
      nombre: 'Cemento Viacha Especial IP-30 50kg',
      categoria: 'Materiales de Obra',
      unidad_medida: 'Bolsa 50kg',
      foto_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80',
      precio_venta: 48.00,
      precio_compra: 42.00,
      stock_actual: 65,
      stock_minimo: 15,
      codigo_barras: '7773001001',
      tipo_venta: 'UNIDAD',
      presentaciones: [
        { id: 'u', nombre: 'Bolsa', factor: 1, precio: 48.00 },
        { id: 'palet-40', nombre: 'Palet x40 bolsas', factor: 40, precio: 1840.00 }
      ]
    },
    {
      id: 'ferr-tubo-pvc',
      nombre: 'Tubo PVC Desagüe 2" x 4 Metros',
      categoria: 'Plomería & PVC',
      unidad_medida: 'Tubo / Metro',
      foto_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
      precio_venta: 28.50,
      precio_compra: 21.00,
      stock_actual: 32,
      stock_minimo: 8,
      codigo_barras: '7773001002',
      tipo_venta: 'UNIDAD'
    },
    {
      id: 'ferr-disco-corte',
      nombre: 'Disco de Corte Fino 4 1/2" DeWalt',
      categoria: 'Herramientas',
      unidad_medida: 'Pieza',
      foto_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
      precio_venta: 12.00,
      precio_compra: 8.50,
      stock_actual: 50,
      stock_minimo: 10,
      codigo_barras: '7773001003',
      tipo_venta: 'UNIDAD',
      presentaciones: [
        { id: 'u', nombre: 'Unidad', factor: 1, precio: 12.00 },
        { id: 'caja-25', nombre: 'Caja x25 uds', factor: 25, precio: 275.00 }
      ]
    },
    {
      id: 'ferr-pintura-latex',
      nombre: 'Pintura Látex Lavable Monopol Blanco 1 Galón',
      categoria: 'Pinturas & Selladores',
      unidad_medida: 'Galón',
      foto_url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80',
      precio_venta: 85.00,
      precio_compra: 68.00,
      stock_actual: 14,
      stock_minimo: 3,
      codigo_barras: '7773001004',
      tipo_venta: 'UNIDAD'
    },
    {
      id: 'ferr-alambre-amarre',
      nombre: 'Alambre de Amarre Negro (por Kilo)',
      categoria: 'Materiales de Obra',
      unidad_medida: 'Kilo',
      foto_url: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=400&q=80',
      precio_venta: 14.50,
      precio_compra: 10.80,
      stock_actual: 80,
      stock_minimo: 20,
      codigo_barras: '7773001005',
      tipo_venta: 'PESO'
    }
  ],

  FARMACIA: [
    {
      id: 'farm-paracetamol-500',
      nombre: 'Paracetamol 500mg Laboratorios IFA',
      categoria: 'Analgésicos & Antiinflamatorios',
      unidad_medida: 'Caja / Blíster',
      foto_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
      precio_venta: 15.00,
      precio_compra: 9.00,
      stock_actual: 45,
      stock_minimo: 10,
      codigo_barras: '7774001001',
      tipo_venta: 'UNIDAD',
      lote: 'L-24901B',
      fecha_vencimiento: '2027-08-30',
      principio_activo: 'Paracetamol 500 mg',
      presentaciones: [
        { id: 'caja', nombre: 'Caja x100 comp', factor: 1, precio: 15.00 },
        { id: 'blister', nombre: 'Blíster x10 comp', factor: 0.1, precio: 2.00 }
      ]
    },
    {
      id: 'farm-ibuprofeno-400',
      nombre: 'Ibuprofeno 400mg Vita',
      categoria: 'Analgésicos & Antiinflamatorios',
      unidad_medida: 'Caja / Blíster',
      foto_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80',
      precio_venta: 18.00,
      precio_compra: 11.50,
      stock_actual: 30,
      stock_minimo: 8,
      codigo_barras: '7774001002',
      tipo_venta: 'UNIDAD',
      lote: 'L-88320C',
      fecha_vencimiento: '2026-11-15',
      principio_activo: 'Ibuprofeno 400 mg',
      presentaciones: [
        { id: 'caja', nombre: 'Caja x50 comp', factor: 1, precio: 18.00 },
        { id: 'blister', nombre: 'Blíster x10 comp', factor: 0.2, precio: 4.00 }
      ]
    },
    {
      id: 'farm-alcohol-70',
      nombre: 'Alcohol Medicinal 70° 1 Litro',
      categoria: 'Primeros Auxilios',
      unidad_medida: 'Frasco 1L',
      foto_url: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=400&q=80',
      precio_venta: 14.00,
      precio_compra: 9.80,
      stock_actual: 25,
      stock_minimo: 6,
      codigo_barras: '7774001003',
      tipo_venta: 'UNIDAD',
      lote: 'L-7741',
      fecha_vencimiento: '2028-05-20',
      principio_activo: 'Alcohol Etílico 70°'
    },
    {
      id: 'farm-amoxicilina-500',
      nombre: 'Amoxicilina 500mg Capsulas Bagó',
      categoria: 'Antibióticos',
      unidad_medida: 'Caja',
      foto_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=400&q=80',
      precio_venta: 28.00,
      precio_compra: 19.50,
      stock_actual: 18,
      stock_minimo: 5,
      codigo_barras: '7774001004',
      tipo_venta: 'UNIDAD',
      lote: 'L-55219',
      fecha_vencimiento: '2026-04-10', // Próximo a vencer para demo
      principio_activo: 'Amoxicilina Trihidrato 500 mg',
      presentaciones: [
        { id: 'caja', nombre: 'Caja x30 cap', factor: 1, precio: 28.00 },
        { id: 'blister', nombre: 'Blíster x10 cap', factor: 0.33, precio: 10.00 }
      ]
    }
  ],

  ROPA: [
    {
      id: 'ropa-polera-polo',
      nombre: 'Polera Polo Piqué Algodón 100%',
      categoria: 'Poleras & Camisas',
      unidad_medida: 'Prenda',
      foto_url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=400&q=80',
      precio_venta: 65.00,
      precio_compra: 38.00,
      stock_actual: 28,
      stock_minimo: 5,
      codigo_barras: '7775001001',
      tipo_venta: 'UNIDAD',
      tallas: ['S', 'M', 'L', 'XL'],
      colores: ['Blanco', 'Negro', 'Azul Marino', 'Rojo']
    },
    {
      id: 'ropa-jean-slim',
      nombre: 'Pantalón Jean Slim Fit Stretch Denim',
      categoria: 'Pantalones & Jeans',
      unidad_medida: 'Prenda',
      foto_url: 'https://images.unsplash.com/photo-1542272604-780c96856485?auto=format&fit=crop&w=400&q=80',
      precio_venta: 130.00,
      precio_compra: 75.00,
      stock_actual: 22,
      stock_minimo: 4,
      codigo_barras: '7775001002',
      tipo_venta: 'UNIDAD',
      tallas: ['28', '30', '32', '34', '36'],
      colores: ['Azul Clásico', 'Negro Lavado', 'Gris Plomo']
    },
    {
      id: 'ropa-casaca-termica',
      nombre: 'Casaca Impermeable Térmica con Capucha',
      categoria: 'Casacas & Abrigos',
      unidad_medida: 'Prenda',
      foto_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=400&q=80',
      precio_venta: 180.00,
      precio_compra: 110.00,
      stock_actual: 15,
      stock_minimo: 3,
      codigo_barras: '7775001003',
      tipo_venta: 'UNIDAD',
      tallas: ['M', 'L', 'XL'],
      colores: ['Negro', 'Azul Petróleo', 'Verde Militar']
    },
    {
      id: 'ropa-zapatilla-urban',
      nombre: 'Zapatillas Urbanas Cuero Sintético Unisex',
      categoria: 'Calzado & Zapatillas',
      unidad_medida: 'Par',
      foto_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80',
      precio_venta: 160.00,
      precio_compra: 95.00,
      stock_actual: 18,
      stock_minimo: 4,
      codigo_barras: '7775001004',
      tipo_venta: 'UNIDAD',
      tallas: ['37', '38', '39', '40', '41', '42'],
      colores: ['Blanco Total', 'Negro / Suela Blanca']
    }
  ],

  CARNICERIA: [
    {
      id: 'carne-lomo-res',
      nombre: 'Lomo Fino de Res Especial (por Kg)',
      categoria: 'Carne de Res',
      unidad_medida: 'Kg',
      foto_url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=400&q=80',
      precio_venta: 54.00, // Bs. por Kg
      precio_compra: 42.00,
      stock_actual: 35.5, // 35.5 Kg
      stock_minimo: 10,
      codigo_barras: '200000100000',
      tipo_venta: 'PESO' // Venta fraccionada por balanza
    },
    {
      id: 'carne-costilla-cerdo',
      nombre: 'Costilla de Cerdo Carnuda (por Kg)',
      categoria: 'Carne de Cerdo',
      unidad_medida: 'Kg',
      foto_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
      precio_venta: 36.00,
      precio_compra: 28.00,
      stock_actual: 40.0,
      stock_minimo: 8,
      codigo_barras: '200000200000',
      tipo_venta: 'PESO'
    },
    {
      id: 'carne-pollo-entero',
      nombre: 'Pollo Sofía Entero Fresco (por Kg)',
      categoria: 'Pollo & Aves',
      unidad_medida: 'Kg',
      foto_url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=400&q=80',
      precio_venta: 16.50,
      precio_compra: 13.50,
      stock_actual: 62.0,
      stock_minimo: 15,
      codigo_barras: '200000300000',
      tipo_venta: 'PESO'
    },
    {
      id: 'carne-chorizo-parrillero',
      nombre: 'Chorizo Parrillero Colonia Piraí (por Kg)',
      categoria: 'Embutidos & Fiambres',
      unidad_medida: 'Kg',
      foto_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
      precio_venta: 42.00,
      precio_compra: 32.00,
      stock_actual: 25.0,
      stock_minimo: 5,
      codigo_barras: '200000400000',
      tipo_venta: 'PESO'
    },
    {
      id: 'carne-queso-chaqueno',
      nombre: 'Queso Criollo Chaqueño (por Kg)',
      categoria: 'Quesos & Lácteos',
      unidad_medida: 'Kg',
      foto_url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80',
      precio_venta: 32.00,
      precio_compra: 24.00,
      stock_actual: 30.0,
      stock_minimo: 6,
      codigo_barras: '200000500000',
      tipo_venta: 'PESO'
    }
  ],

  HELADERIA: [
    {
      id: 'hel-cono-2bolas',
      nombre: 'Cono Artesanal 2 Bolas a Elección',
      categoria: 'Conos & Vasos',
      unidad_medida: 'Cono',
      foto_url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=400&q=80',
      precio_venta: 12.00,
      precio_compra: 5.50,
      stock_actual: 80,
      stock_minimo: 15,
      codigo_barras: '7776001001',
      tipo_venta: 'UNIDAD',
      sabores: ['Chocolate Belga', 'Vainilla Francesa', 'Frutilla Natural', 'Dulce de Leche', 'Maracuyá', 'Menta Granizada', 'Oreo Cookies'],
      toppings: ['Grajeas de Colores', 'Chispas de Chocolate', 'Salsa de Frutilla', 'Salsa de Caramelo', 'Maní Picado', 'Crema Chantilly (+Bs. 2)']
    },
    {
      id: 'hel-copa-sundae',
      nombre: 'Copa Sundae Suprema con Toppings',
      categoria: 'Copas & Sundaes',
      unidad_medida: 'Copa',
      foto_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
      precio_venta: 18.00,
      precio_compra: 8.00,
      stock_actual: 45,
      stock_minimo: 10,
      codigo_barras: '7776001002',
      tipo_venta: 'UNIDAD',
      sabores: ['Vainilla', 'Chocolate', 'Frutilla', 'Brownie Fudge'],
      toppings: ['Salsa de Chocolate Caliente', 'Nueces Picadas', 'Cereza al Marrasquino', 'Crema']
    },
    {
      id: 'hel-pote-1litro',
      nombre: 'Pote Térmico 1 Litro (Hasta 3 Sabores)',
      categoria: 'Packs Familiares',
      unidad_medida: 'Pote 1L',
      foto_url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80',
      precio_venta: 45.00,
      precio_compra: 22.00,
      stock_actual: 30,
      stock_minimo: 6,
      codigo_barras: '7776001003',
      tipo_venta: 'UNIDAD',
      sabores: ['Chocolate Belga', 'Vainilla', 'Frutilla', 'Dulce de Leche', 'Maracuyá', 'Limonada']
    },
    {
      id: 'hel-cafe-espresso',
      nombre: 'Café Espresso Doble de Altura Caranavi',
      categoria: 'Cafetería & Bebidas Calientes',
      unidad_medida: 'Taza',
      foto_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
      precio_venta: 10.00,
      precio_compra: 3.50,
      stock_actual: 100,
      stock_minimo: 20,
      codigo_barras: '7776001004',
      tipo_venta: 'UNIDAD'
    }
  ]
};
