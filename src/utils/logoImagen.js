// Prepara el logo de la empresa: lo reduce a un tamaño razonable y lo devuelve como data URL.
// Así se guarda dentro de los datos de la empresa y viaja en el PDF sin servicios externos.
const MAX_ANCHO = 480;
const MAX_ALTO = 240;
const MAX_ARCHIVO = 3 * 1024 * 1024;

export function leerLogo(archivo) {
  return new Promise((resolve, reject) => {
    if (!archivo) return reject(new Error('Elige una imagen.'));
    if (!/^image\/(png|jpe?g|webp)$/i.test(archivo.type)) return reject(new Error('Usa una imagen PNG, JPG o WEBP.'));
    if (archivo.size > MAX_ARCHIVO) return reject(new Error('La imagen pesa más de 3 MB.'));

    const lector = new FileReader();
    lector.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('La imagen no es válida.'));
      img.onload = () => {
        const escala = Math.min(1, MAX_ANCHO / img.width, MAX_ALTO / img.height);
        const w = Math.max(1, Math.round(img.width * escala));
        const h = Math.max(1, Math.round(img.height * escala));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        // PNG conserva la transparencia; si queda muy pesado se pasa a JPG con fondo blanco
        let url = canvas.toDataURL('image/png');
        if (url.length > 200 * 1024) {
          const ctx = canvas.getContext('2d');
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          url = canvas.toDataURL('image/jpeg', 0.85);
        }
        resolve(url);
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}
