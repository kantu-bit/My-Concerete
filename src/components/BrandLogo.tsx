interface BrandLogoProps {
  onWhitePlate?: boolean;
  compact?: boolean;
  plateSize?: 'topbar' | 'compact';
}

const OFFICIAL_LOGO_SRC = '/assets/aistudio/IMG-20240728-WA0001.jpg_b56d6148.jpeg';

export function BrandLogo({
  onWhitePlate = false,
  compact = false,
  plateSize = 'compact',
}: BrandLogoProps) {
  const imgHeightClass =
    plateSize === 'topbar'
      ? 'h-12 w-auto object-contain'
      : compact
      ? 'h-9 w-auto object-contain'
      : 'h-11 w-auto object-contain';

  const inner = (
    <img
      src={OFFICIAL_LOGO_SRC}
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
