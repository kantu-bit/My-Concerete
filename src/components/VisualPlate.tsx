import { useEffect, useState } from 'react';

export function TransitMixerMark({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g className="origin-[22px_22px] animate-mixer-spin">
        <ellipse cx="22" cy="22" rx="13" ry="9" transform="rotate(-18 22 22)" fill="#D92B25" />
        <path
          d="M12 19L30 25M15 26L28 16"
          stroke="#FFC93C"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
      <path d="M32 23H39L43 29V34H8V30H32V23Z" fill="#FFFFFF" fillOpacity="0.95" />
      <circle cx="15" cy="36" r="3.5" fill="#0F1F5C" stroke="#FFC93C" strokeWidth="2" />
      <circle cx="36" cy="36" r="3.5" fill="#0F1F5C" stroke="#FFC93C" strokeWidth="2" />
    </svg>
  );
}

export type VisualVariant =
  | 'batching-plant'
  | 'engineers-site'
  | 'night-pour'
  | 'transit-pour'
  | 'quality-lab'
  | 'product-mix'
  | 'bricks'
  | 'residential'
  | 'commercial'
  | 'government'
  | 'infrastructure'
  | 'institutions'
  | 'industrial'
  | 'project'
  | 'media';

interface VisualPlateProps {
  imageUrl?: string;
  variant?: VisualVariant;
  title: string;
  alt?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  className?: string;
  tone?: 'dark' | 'light';
  priority?: boolean;
  kenBurns?: boolean;
}

export function VisualPlate({
  imageUrl,
  variant = 'batching-plant',
  title,
  alt,
  subtitle,
  width = 1200,
  height = 800,
  className = 'w-full h-full',
  tone = 'dark',
  priority = false,
  kenBurns = false,
}: VisualPlateProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  if (imageUrl && !imgFailed) {
    return (
      <img
        src={imageUrl}
        alt={alt || title}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`object-cover ${kenBurns ? 'animate-ken-burns' : ''} ${className}`}
      />
    );
  }

  const isLight = tone === 'light';

  return (
    <div
      className={`relative overflow-hidden select-none ${
        isLight
          ? 'bg-gradient-to-br from-[#EEF4FF] via-[#DCE9FF] to-[#C2D8FF] text-[#0F1F5C]'
          : 'bg-gradient-to-br from-[#0F1F5C] via-[#1B3A9E] to-[#0A1642] text-white'
      } ${className}`}
      role="img"
      aria-label={alt || title}
    >
      <div
        className={`absolute -top-12 -right-12 w-72 h-72 rounded-full blur-2xl pointer-events-none ${
          isLight ? 'opacity-25' : 'opacity-25'
        }`}
        style={{
          background: isLight
            ? 'radial-gradient(circle, rgba(31,63,168,0.28) 0%, rgba(217,43,37,0.12) 50%, transparent 75%)'
            : 'radial-gradient(circle, #1F3FA8 0%, #D92B25 55%, transparent 80%)',
        }}
      />

      {/* Concrete grain / speckle texture overlay */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${isLight ? 'opacity-[0.09]' : 'opacity-[0.16]'}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`concrete-${variant}-${tone}`} width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.45" />
            <circle cx="8" cy="12" r="0.9" fill="currentColor" fillOpacity="0.55" />
            <circle cx="24" cy="6" r="0.7" fill="currentColor" fillOpacity="0.4" />
            <circle cx="38" cy="18" r="1" fill="currentColor" fillOpacity="0.5" />
            <circle cx="15" cy="31" r="0.8" fill="currentColor" fillOpacity="0.45" />
            <circle cx="32" cy="40" r="0.9" fill="currentColor" fillOpacity="0.55" />
            <circle cx="44" cy="34" r="0.6" fill="currentColor" fillOpacity="0.35" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#concrete-${variant}-${tone})`} />
      </svg>

      <svg
        viewBox="0 0 640 360"
        className={`absolute inset-0 w-full h-full opacity-95 ${kenBurns ? 'animate-ken-burns' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {variant === 'batching-plant' && (
          <g stroke="currentColor" strokeWidth="1.6">
            {/* Twin cement silos + hopper */}
            <rect
              x="120"
              y="55"
              width="60"
              height="165"
              rx="8"
              fill={isLight ? '#1F3FA8' : '#17328A'}
              stroke={isLight ? '#0F1F5C' : '#7BA2FF'}
            />
            <rect
              x="194"
              y="40"
              width="60"
              height="180"
              rx="8"
              fill={isLight ? '#0F1F5C' : '#17328A'}
              stroke={isLight ? '#1F3FA8' : '#7BA2FF'}
            />
            <path d="M120 220 L136 258 H164 L180 220" stroke={isLight ? '#1F3FA8' : '#9EBCFF'} />
            <path d="M194 220 L210 258 H238 L254 220" stroke={isLight ? '#1F3FA8' : '#9EBCFF'} />
            {/* Conveyor bridge */}
            <line x1="254" y1="185" x2="380" y2="115" stroke="#D92B25" strokeWidth="4" />
            <line x1="254" y1="196" x2="380" y2="126" stroke="#FFC93C" strokeWidth="1.8" />
            {/* Batching tower */}
            <rect
              x="375"
              y="88"
              width="145"
              height="122"
              rx="10"
              fill={isLight ? '#FFFFFF' : '#12276E'}
              stroke={isLight ? '#1F3FA8' : '#7BA2FF'}
            />
            <rect x="394" y="108" width="106" height="44" rx="5" fill="#0F1F5C" stroke="#D92B25" strokeWidth="1.8" />
            <line x1="392" y1="210" x2="392" y2="296" stroke={isLight ? '#1F3FA8' : '#9EBCFF'} strokeWidth="2" />
            <line x1="504" y1="210" x2="504" y2="296" stroke={isLight ? '#1F3FA8' : '#9EBCFF'} strokeWidth="2" />
            {/* Transit mixer truck below chute */}
            <ellipse cx="430" cy="264" rx="46" ry="22" transform="rotate(-10 430 264)" fill="#1F3FA8" stroke="#D92B25" strokeWidth="2.5" />
            <path d="M405 256 L454 272" stroke="#FFC93C" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="476" y="254" width="38" height="30" rx="5" fill="#D92B25" stroke="#0F1F5C" />
            <circle cx="404" cy="294" r="10" fill="#0F1F5C" stroke="#FFC93C" strokeWidth="2.2" />
            <circle cx="495" cy="294" r="10" fill="#0F1F5C" stroke="#FFC93C" strokeWidth="2.2" />
            <line x1="60" y1="305" x2="585" y2="305" stroke={isLight ? '#1F3FA8' : '#7BA2FF'} strokeWidth="2" />
          </g>
        )}

        {variant === 'engineers-site' && (
          <g stroke="currentColor" strokeWidth="1.6">
            {/* Structural frame under construction */}
            <rect
              x="315"
              y="62"
              width="220"
              height="228"
              rx="8"
              fill={isLight ? '#FFFFFF' : '#12276E'}
              stroke={isLight ? '#1F3FA8' : '#7BA2FF'}
            />
            <line x1="315" y1="120" x2="535" y2="120" stroke="#1F3FA8" strokeWidth="2" />
            <line x1="315" y1="178" x2="535" y2="178" stroke="#1F3FA8" strokeWidth="2" />
            <line x1="315" y1="236" x2="535" y2="236" stroke="#1F3FA8" strokeWidth="2" />
            <line x1="390" y1="62" x2="390" y2="290" stroke={isLight ? '#9EBCFF' : '#7BA2FF'} />
            <line x1="465" y1="62" x2="465" y2="290" stroke={isLight ? '#9EBCFF' : '#7BA2FF'} />
            {/* Crane boom & grade check chart */}
            <path d="M120 290 L165 78 L375 78" stroke="#D92B25" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="295" y1="78" x2="295" y2="146" stroke="#FFC93C" strokeWidth="2.2" />
            {/* Engineers silhouettes with safety helmets & blueprint table */}
            <rect x="135" y="220" width="120" height="70" rx="6" fill="#1F3FA8" stroke="#0F1F5C" />
            <line x1="152" y1="242" x2="238" y2="242" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="152" y1="258" x2="218" y2="258" stroke="#FFC93C" strokeWidth="2" />
            <circle cx="176" cy="184" r="14" fill="#0F1F5C" stroke="#FFFFFF" />
            <path d="M161 182 Q176 164 191 182 Z" fill="#D92B25" stroke="none" />
            <circle cx="222" cy="188" r="13" fill="#0F1F5C" stroke="#FFFFFF" />
            <path d="M208 186 Q222 168 236 186 Z" fill="#FFC93C" stroke="none" />
            <line x1="70" y1="292" x2="570" y2="292" stroke={isLight ? '#1F3FA8' : '#9EBCFF'} strokeWidth="2" />
          </g>
        )}

        {(variant === 'transit-pour' || variant === 'night-pour') && (
          <g stroke="currentColor" strokeWidth="1.6">
            {variant === 'night-pour' && (
              <>
                <circle cx="515" cy="70" r="24" fill="#FFC93C" fillOpacity="0.9" stroke="none" />
                <polygon points="315,96 520,260 440,260" fill="#FFC93C" fillOpacity="0.14" stroke="none" />
              </>
            )}
            <path d="M150 250 L255 120 L425 90 L505 168" stroke="#D92B25" strokeWidth="3.8" strokeLinecap="round" />
            <line x1="505" y1="168" x2="505" y2="245" stroke="#FFC93C" strokeWidth="2.8" strokeDasharray="4 4" />
            <ellipse cx="185" cy="235" rx="68" ry="34" transform="rotate(-12 185 235)" fill="#1F3FA8" stroke="#D92B25" strokeWidth="2.4" />
            <path d="M148 225 L220 246" stroke="#FFC93C" strokeWidth="2.4" strokeLinecap="round" />
            <rect x="112" y="255" width="160" height="24" rx="6" fill="#0F1F5C" stroke="#7BA2FF" />
            <circle cx="140" cy="288" r="12" fill="#0F1F5C" stroke="#FFC93C" strokeWidth="2.2" />
            <circle cx="240" cy="288" r="12" fill="#0F1F5C" stroke="#FFC93C" strokeWidth="2.2" />
            <rect x="380" y="245" width="190" height="24" rx="4" fill="#17328A" stroke="#9EBCFF" />
            <line x1="60" y1="300" x2="585" y2="300" stroke="#7BA2FF" strokeWidth="2" />
          </g>
        )}

        {variant === 'bricks' && (
          <g stroke="currentColor" strokeWidth="1.6">
            <rect x="130" y="216" width="112" height="50" rx="5" fill="#1F3FA8" stroke={isLight ? '#0F1F5C' : '#9EBCFF'} />
            <rect x="254" y="216" width="112" height="50" rx="5" fill="#1F3FA8" stroke={isLight ? '#0F1F5C' : '#9EBCFF'} />
            <rect x="378" y="216" width="112" height="50" rx="5" fill="#1F3FA8" stroke={isLight ? '#0F1F5C' : '#9EBCFF'} />
            <rect x="192" y="158" width="112" height="50" rx="5" fill="#0F1F5C" stroke="#FFC93C" strokeWidth="2" />
            <rect x="316" y="158" width="112" height="50" rx="5" fill="#0F1F5C" stroke="#FFC93C" strokeWidth="2" />
            <rect x="254" y="100" width="112" height="50" rx="5" fill="#D92B25" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="85" y1="282" x2="555" y2="282" stroke={isLight ? '#1F3FA8' : '#9EBCFF'} strokeWidth="2.2" />
          </g>
        )}

        {(variant === 'quality-lab' || variant === 'product-mix') && (
          <g stroke="currentColor" strokeWidth="1.5">
            <rect x="120" y="170" width="76" height="76" rx="4" fill="#17328A" stroke="#9EBCFF" />
            <polygon points="120,170 148,146 224,146 196,170" fill="#2348BE" stroke="#9EBCFF" />
            <polygon points="196,170 224,146 224,222 196,246" fill="#12276E" stroke="#9EBCFF" />
            <polygon points="315,246 395,246 373,136 337,136" fill="#17328A" stroke="#D92B25" strokeWidth="2.4" />
            <line x1="295" y1="246" x2="415" y2="246" stroke="#FFC93C" strokeWidth="2" />
            <rect x="445" y="100" width="96" height="146" rx="6" fill="#12276E" stroke="#7BA2FF" />
            <rect x="467" y="140" width="52" height="52" rx="4" fill="#0F1F5C" stroke="#FFC93C" />
            <line x1="80" y1="268" x2="560" y2="268" stroke="#7BA2FF" />
          </g>
        )}

        {(variant === 'government' || variant === 'infrastructure') && (
          <g stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* White civic building + perspective road line icon */}
            <polygon points="320,66 226,106 414,106" fill="#FFFFFF" fillOpacity="0.1" />
            <line x1="216" y1="106" x2="424" y2="106" />
            <line x1="250" y1="106" x2="250" y2="210" />
            <line x1="296" y1="106" x2="296" y2="210" />
            <line x1="344" y1="106" x2="344" y2="210" />
            <line x1="390" y1="106" x2="390" y2="210" />
            <rect x="212" y="210" width="216" height="16" rx="2" fill="#FFFFFF" fillOpacity="0.12" />
            {/* Side wing blocks */}
            <rect x="134" y="138" width="78" height="88" rx="4" />
            <rect x="428" y="138" width="78" height="88" rx="4" />
            {/* Perspective concrete highway / road */}
            <line x1="80" y1="226" x2="560" y2="226" strokeOpacity="0.65" />
            <path d="M230 226 L120 324 M410 226 L520 324" strokeWidth="2.6" />
            <line x1="320" y1="238" x2="320" y2="256" stroke="#FFC93C" strokeWidth="2.8" />
            <line x1="320" y1="270" x2="320" y2="290" stroke="#FFC93C" strokeWidth="2.8" />
            <line x1="320" y1="304" x2="320" y2="322" stroke="#FFC93C" strokeWidth="2.8" />
          </g>
        )}

        {(variant === 'residential' ||
          variant === 'commercial' ||
          variant === 'institutions' ||
          variant === 'industrial' ||
          variant === 'project' ||
          variant === 'media') && (
          <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="120" y="114" width="142" height="168" rx="5" fill="#FFFFFF" fillOpacity="0.06" />
            <rect x="262" y="150" width="156" height="132" rx="5" fill="#FFFFFF" fillOpacity="0.1" />
            <rect x="418" y="84" width="102" height="198" rx="5" fill="#FFFFFF" fillOpacity="0.07" />
            <line x1="146" y1="150" x2="236" y2="150" strokeOpacity="0.7" />
            <line x1="146" y1="186" x2="236" y2="186" strokeOpacity="0.7" />
            <line x1="146" y1="222" x2="236" y2="222" strokeOpacity="0.7" />
            <line x1="286" y1="186" x2="394" y2="186" stroke="#FFC93C" strokeOpacity="0.8" />
            <line x1="286" y1="222" x2="394" y2="222" stroke="#FFC93C" strokeOpacity="0.8" />
            <line x1="442" y1="126" x2="496" y2="126" stroke="#D92B25" strokeWidth="2.6" />
            <line x1="442" y1="164" x2="496" y2="164" strokeOpacity="0.7" />
            <line x1="442" y1="202" x2="496" y2="202" strokeOpacity="0.7" />
            <line x1="70" y1="282" x2="570" y2="282" strokeWidth="2.4" />
          </g>
        )}
      </svg>

      {subtitle !== undefined && subtitle !== '' && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0F1F5C]/95 via-[#0F1F5C]/60 to-transparent p-4">
          <p className="font-mono text-[11px] tracking-wide text-[#FFC93C] truncate">{subtitle}</p>
          <p className="text-sm font-semibold text-white truncate">{title}</p>
        </div>
      )}
    </div>
  );
}
