import React from 'react';

/**
 * Mascota oficial GloryPOS (terminal POS con ticket), dibujada en SVG.
 * Paleta de la guía de marca: Naranja #FF6B35, Carbón #1F2128, Crema #FAF8F2.
 *
 * mood:  'saludo' | 'feliz' | 'celebra' | 'preocupado' | 'pensando' | 'timido'
 * pose:  'saludo' (brazo arriba) | 'celebra' (ambos arriba) | 'normal'. Por defecto según el mood.
 */
const NARANJA = '#FF6B35';
const CARBON = '#1F2128';
const CREMA = '#FAF8F2';
const MEJILLA = '#FFB199';

const POSE_POR_MOOD = {
  saludo: 'saludo',
  celebra: 'celebra',
};

function Cara({ mood }) {
  const trazo = { stroke: CARBON, strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };

  if (mood === 'celebra') {
    return (
      <g>
        <path d="M83 104 Q88 97 93 104" {...trazo} />
        <path d="M107 104 Q112 97 117 104" {...trazo} />
        <path d="M90 112 Q100 127 110 112 Z" fill={CARBON} stroke={CARBON} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="78" cy="114" rx="5.5" ry="3.5" fill={MEJILLA} />
        <ellipse cx="122" cy="114" rx="5.5" ry="3.5" fill={MEJILLA} />
      </g>
    );
  }

  if (mood === 'timido') {
    return (
      <g>
        <path d="M83 101 Q88 106 93 101" {...trazo} />
        <path d="M107 101 Q112 106 117 101" {...trazo} />
        <path d="M96 116 Q100 119 104 116" {...trazo} />
        <ellipse cx="78" cy="112" rx="7" ry="4.5" fill={MEJILLA} />
        <ellipse cx="122" cy="112" rx="7" ry="4.5" fill={MEJILLA} />
      </g>
    );
  }

  if (mood === 'preocupado') {
    return (
      <g>
        <path d="M81 94 L93 90" {...trazo} />
        <path d="M119 94 L107 90" {...trazo} />
        <g className="gm-ojos">
          <circle cx="88" cy="103" r="4.5" fill={CARBON} />
          <circle cx="112" cy="103" r="4.5" fill={CARBON} />
        </g>
        <path d="M92 120 Q100 113 108 120" {...trazo} />
        <ellipse cx="78" cy="113" rx="5" ry="3.5" fill={MEJILLA} opacity="0.7" />
        <ellipse cx="122" cy="113" rx="5" ry="3.5" fill={MEJILLA} opacity="0.7" />
      </g>
    );
  }

  if (mood === 'pensando') {
    return (
      <g>
        <g className="gm-ojos">
          <circle cx="91" cy="99" r="4.5" fill={CARBON} />
          <circle cx="115" cy="99" r="4.5" fill={CARBON} />
        </g>
        <path d="M95 117 H106" {...trazo} />
        <ellipse cx="78" cy="113" rx="5" ry="3.5" fill={MEJILLA} />
        <ellipse cx="122" cy="113" rx="5" ry="3.5" fill={MEJILLA} />
      </g>
    );
  }

  // 'feliz' / 'saludo'
  return (
    <g>
      <g className="gm-ojos">
        <circle cx="88" cy="102" r="4.5" fill={CARBON} />
        <circle cx="112" cy="102" r="4.5" fill={CARBON} />
      </g>
      <path d="M92 113 Q100 121 108 113" {...trazo} />
      <ellipse cx="78" cy="113" rx="5.5" ry="3.5" fill={MEJILLA} />
      <ellipse cx="122" cy="113" rx="5.5" ry="3.5" fill={MEJILLA} />
    </g>
  );
}

function Mano({ cx, cy }) {
  return <circle cx={cx} cy={cy} r="9" fill={NARANJA} stroke={CARBON} strokeWidth="5" />;
}

export default function GloryMascota({
  mood = 'feliz',
  pose,
  size = 160,
  animated = true,
  className = '',
  title = 'Mascota GloryPOS',
}) {
  const poseFinal = pose || POSE_POR_MOOD[mood] || 'normal';
  const brazo = { stroke: CARBON, strokeWidth: 6, strokeLinecap: 'round', fill: 'none' };

  return (
    <svg
      viewBox="-10 10 220 218"
      width={size}
      height={(size * 218) / 220}
      role="img"
      aria-label={title}
      className={`glory-mascota ${animated ? 'gm-animada' : ''} ${className}`}
    >
      <title>{title}</title>

      {/* Sombra en el piso */}
      <ellipse className="gm-sombra" cx="100" cy="220" rx="46" ry="6" fill={CARBON} opacity="0.12" />

      <g className="gm-cuerpo">
        {/* Piernas y pies */}
        <rect x="80" y="182" width="13" height="26" rx="4" fill={CARBON} />
        <rect x="107" y="182" width="13" height="26" rx="4" fill={CARBON} />
        <ellipse cx="84" cy="210" rx="13" ry="7" fill={CARBON} />
        <ellipse cx="116" cy="210" rx="13" ry="7" fill={CARBON} />

        {/* Brazo izquierdo */}
        {poseFinal === 'celebra' ? (
          <g className="gm-brazo-izq-arriba">
            <path d="M52 128 Q30 118 24 86" {...brazo} />
            <Mano cx={22} cy={80} />
          </g>
        ) : (
          <g>
            <path d="M52 140 Q32 150 30 170" {...brazo} />
            <Mano cx={30} cy={175} />
          </g>
        )}

        {/* Brazo derecho */}
        {poseFinal === 'normal' ? (
          <g>
            <path d="M148 140 Q168 150 170 170" {...brazo} />
            <Mano cx={170} cy={175} />
          </g>
        ) : (
          <g className={poseFinal === 'saludo' ? 'gm-brazo-saludo' : 'gm-brazo-der-arriba'}>
            <path d="M148 128 Q170 118 176 86" {...brazo} />
            <Mano cx={178} cy={80} />
          </g>
        )}

        {poseFinal === 'saludo' && (
          <g className="gm-ondas" stroke={CARBON} strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M191 64 Q197 74 191 84" />
            <path d="M199 57 Q207 74 199 91" />
          </g>
        )}

        {/* Ticket saliendo por arriba */}
        <g className="gm-ticket">
          <path
            d="M78 72 V32 L85 24 L92 32 L100 24 L108 32 L115 24 L122 32 V72 Z"
            fill="#FFFFFF"
            stroke={CARBON}
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path d="M88 44 H112 M88 54 H106" stroke="#C9CCD3" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Cuerpo del terminal */}
        <rect x="48" y="62" width="104" height="128" rx="36" fill={NARANJA} stroke={CARBON} strokeWidth="6" />

        {/* Pantalla */}
        <rect x="64" y="80" width="72" height="56" rx="18" fill={CREMA} stroke={CARBON} strokeWidth="5" />
        <Cara mood={mood} />

        {/* Check de marca */}
        <path d="M84 160 L96 172 L118 148" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}
