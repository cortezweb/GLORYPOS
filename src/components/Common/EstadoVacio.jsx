import React from 'react';
import GloryMascota from './GloryMascota';

/** Estado vacío con la mascota GloryPOS para listas y búsquedas sin resultados. */
export default function EstadoVacio({ titulo, descripcion, mood = 'pensando', size = 96, children, className = '' }) {
  return (
    <div className={`flex flex-col items-center text-center px-6 py-10 ${className}`}>
      <div className="w-32 h-32 rounded-full bg-[#FFF1E8] flex items-center justify-center">
        <GloryMascota mood={mood} size={size} animated={false} className="translate-y-1.5" />
      </div>
      {titulo && <p className="font-display font-bold text-base text-[#1F2128] mt-4">{titulo}</p>}
      {descripcion && <p className="text-sm text-slate-500 mt-1 max-w-xs">{descripcion}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
