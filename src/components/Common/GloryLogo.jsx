import React from 'react';

/**
 * Componente oficial de Logo GloryPOS
 * Utiliza la imagen y paleta oficial:
 * - Naranja Glory: #FF6B35
 * - Azul Nocturno: #1E2022
 * - Amarillo Mostaza: #FFB627
 * - Crema Natural: #FDFBF7
 * - Verde Éxito: #00B574
 */
export default function GloryLogo({ 
  className = '', 
  size = 'md', 
  showSubtitle = true, 
  subtitleText = 'Cloud System',
  onClick = null
}) {
  const sizeClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-11 sm:h-12',
    xl: 'h-14 sm:h-16'
  };

  const imgHeight = sizeClasses[size] || sizeClasses.md;

  return (
    <div 
      className={`inline-flex flex-col items-start ${onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <img 
          src="/logo.png" 
          alt="GloryPOS" 
          className={`${imgHeight} object-contain rounded-md`}
          onError={(e) => {
            // Fallback elegante en caso de retardo en carga de imagen
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        {/* Fallback tipográfico oficial si la imagen no está en caché */}
        <div style={{ display: 'none' }} className="items-baseline font-black tracking-tight select-none">
          <span className="text-[#FF6B35] text-2xl font-black">G</span>
          <span className="text-[#1E2022] text-2xl font-black">lory</span>
          <span className="text-[#1E2022] text-2xl font-black ml-0.5">POS</span>
        </div>
      </div>
      {showSubtitle && (
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 -mt-0.5 ml-1 font-mono">
          {subtitleText}
        </span>
      )}
    </div>
  );
}
