import { db } from '../db/dexie';

export async function exportLibroVentasRCV() {
  const ventas = await db.ventas.toArray();
  const config = await db.config_empresa.get('empresa_activa');

  // Filter only formal invoices or official receipts
  const facturas = ventas.filter(v => v.tipo_documento === 'FACTURA_SIAT' || v.tipo_documento === 'FACTURA' || v.tipo_documento === 'BOLETA');

  const headers = [
    'NRO',
    'FECHA DE LA FACTURA',
    'NRO. DE LA FACTURA',
    'CODIGO DE AUTORIZACION (CUF)',
    'NIT / CI CLIENTE',
    'COMPLEMENTO',
    'NOMBRE O RAZON SOCIAL',
    'IMPORTE TOTAL VENTA (Bs.)',
    'IMPORTE ICE',
    'IMPORTE IEHD',
    'IMPORTE IPJ',
    'TASAS',
    'OTROS NO SUJETOS AL IVA',
    'EXPORTACIONES Y EXENTOS',
    'VENTAS GRAVADAS TASA CERO',
    'SUBTOTAL',
    'DESCUENTOS',
    'IMPORTE BASE PARA DEBITO FISCAL',
    'DEBITO FISCAL IVA (13%)',
    'ESTADO',
    'CODIGO DE CONTROL',
    'TIPO DE VENTA'
  ];

  const rows = facturas.map((v, index) => {
    const fechaObj = new Date(v.fecha);
    const fechaStr = `${String(fechaObj.getDate()).padStart(2, '0')}/${String(fechaObj.getMonth() + 1).padStart(2, '0')}/${fechaObj.getFullYear()}`;
    const nroFactura = v.correlativo ? v.correlativo.replace(/\D/g, '') || String(index + 1) : String(index + 1);
    const cuf = v.cuf || `CUF-${Date.now()}`;
    const nit = v.cliente_ci_nit || '0';
    const cliente = (v.cliente_nombre || 'CLIENTE GENERAL').replace(/,/g, ' ');
    const total = Number(v.total || 0);
    const isAnulado = v.estado === 'ANULADO';

    const baseDebito = isAnulado ? 0 : total;
    const debitoFiscal = isAnulado ? 0 : Number((baseDebito * 0.13).toFixed(2));
    const estado = isAnulado ? 'A' : 'V'; // V = Válida, A = Anulada
    const codigoControl = v.tipo_documento === 'FACTURA_SIAT' ? 'SIAT-ONLINE' : '0';
    const tipoVenta = '1'; // Factura Electrónica en Línea

    return [
      index + 1,
      fechaStr,
      nroFactura,
      `"${cuf}"`,
      nit,
      '',
      `"${cliente}"`,
      total.toFixed(2),
      '0.00',
      '0.00',
      '0.00',
      '0.00',
      '0.00',
      '0.00',
      '0.00',
      total.toFixed(2),
      (Number(v.descuento || 0)).toFixed(2),
      baseDebito.toFixed(2),
      debitoFiscal.toFixed(2),
      estado,
      codigoControl,
      tipoVenta
    ].join(';');
  });

  // Prepend UTF-8 BOM for Microsoft Excel compatibility in Spanish
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  const fechaHoy = new Date().toISOString().slice(0, 7);
  a.href = url;
  a.download = `Libro_Ventas_RCV_SIAT_${config?.nit_ci || 'EMPRESA'}_${fechaHoy}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
