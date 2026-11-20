import { useState } from 'react';

interface BrandLogoProps {
  onWhitePlate?: boolean;
  compact?: boolean;
  plateSize?: 'topbar' | 'compact';
}

export function BrandLogo({
  onWhitePlate = false,
  compact = false,
  plateSize = 'compact',
}: BrandLogoProps) {
  const [jpegMissing, setJpegMissing] = useState(false);

  const imgHeightClass =
    plateSize === 'topbar'
      ? 'h-12 w-auto object-contain'
      : compact
      ? 'h-8 w-auto object-contain'
      : 'h-11 w-auto object-contain';

  const inner = !jpegMissing ? (
    <img
      src="/logo.jpeg"
      alt="MY CONCRETE – Readymix Concrete Unit"
      onError={() => setJpegMissing(true)}
      className={imgHeightClass}
    />
  ) : (
    <img
      src="/logo.svg"
      alt="MY CONCRETE – Readymix Concrete Unit"
      className={imgHeightClass}
    />
  );

  if (onWhitePlate) {
    return (
      <div
        className={
          plateSize === 'topbar'
            ? 'inline-flex items-center justify-center rounded-[12px] bg-white px-[14px] py-[8px] h-[64px] shadow-[0_6px_18px_rgba(15,31,92,0.18)]'
            : 'inline-flex items-center justify-center rounded-[10px] bg-white px-2.5 py-1 shadow-sm'
        }
      >
        {inner}
      </div>
    );
  }

  return <div className="inline-flex items-center">{inner}</div>;
}
