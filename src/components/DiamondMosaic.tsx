import { Link } from 'react-router-dom';
import type { MosaicTile } from '../types/index.ts';
import { VisualPlate } from './VisualPlate.tsx';

interface DiamondMosaicProps {
  tiles: MosaicTile[];
  lang: 'en' | 'kn';
}

// 9 staggered diamond positions (row, col) packed tightly on a 45°-rotated grid
// Horizontal pitch = D + S, staggered row offset = (D + S) / 2, vertical pitch = (D + S) / 2
// Where S = 9px gives ~6.4px perpendicular white gaps all around.
const TILE_SLOTS: Array<{ row: number; col: number }> = [
  { row: 0, col: 0 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
  { row: 3, col: 0 },
  { row: 3, col: 1 },
];

const ACCENT_DIAMONDS: Array<{
  row: number;
  col: number;
  color: 'blue' | 'red';
  scale?: number;
}> = [
  { row: -0.5, col: 1.5, color: 'blue', scale: 1.04 },
  { row: 0, col: 2, color: 'red', scale: 0.92 },
  { row: 1, col: -1, color: 'blue', scale: 0.95 },
  { row: 1.5, col: 1.85, color: 'blue', scale: 1.05 },
  { row: 3, col: -1, color: 'red', scale: 0.88 },
  { row: 3.6, col: 0.5, color: 'blue', scale: 1.04 },
  { row: 3.4, col: 1.65, color: 'red', scale: 0.9 },
];

const TONE_STRIP: Record<'blue' | 'navy' | 'red', string> = {
  blue: 'rgba(31, 63, 168, 0.85)',
  navy: 'rgba(15, 31, 92, 0.85)',
  red: 'rgba(217, 43, 37, 0.85)',
};

export function DiamondMosaic({ tiles, lang }: DiamondMosaicProps) {
  // Desktop tile size D = 236px, pitch step P = 245px (9px diagonal step -> ~6.4px uniform edge gap)
  // Scaled smoothly via CSS transform on smaller desktop/tablet widths so the layout stays exact.
  const D = 236;
  const P = D + 9; // 245px -> ~6.4px white gap between all diagonal edges

  return (
    <div className="relative w-full h-full overflow-hidden bg-white select-none">
      {/* Subtle light concrete backdrop behind white gaps & edge accents */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#F4F6FA] via-[#FFFFFF] to-[#E8EEFA]"
        aria-hidden="true"
      />

      {/* Responsive staggered mosaic stage anchored to top-right / center-right, bleeding off top/right/bottom */}
      <div className="relative w-full h-full flex items-center justify-center lg:justify-start">
        <div
          className="relative shrink-0 scale-[0.58] sm:scale-[0.74] lg:scale-[0.86] xl:scale-100 origin-center lg:origin-left -ml-8 sm:-ml-4 lg:ml-6 xl:ml-10 -mt-10"
          style={{ width: `${P * 2.75}px`, height: `${P * 2.35}px` }}
        >
          {/* Decorative Blue (#1F3FA8) & Red (#D92B25) Edge Accent Diamonds peeking behind */}
          {ACCENT_DIAMONDS.map((acc, idx) => {
            const left = acc.col * P + (Math.round(acc.row * 2) % 2 !== 0 ? P / 2 : 0);
            const top = acc.row * (P / 2);
            const size = D * (acc.scale || 1);
            return (
              <div
                key={`acc-${idx}`}
                aria-hidden="true"
                className="diamond-clip absolute pointer-events-none"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}px`,
                  top: `${top}px`,
                  backgroundColor: acc.color === 'red' ? '#D92B25' : '#1F3FA8',
                }}
              />
            );
          })}

          {/* 9 Interactive Photo / Illustration Diamond Tiles */}
          {TILE_SLOTS.map((slot, idx) => {
            const tile = tiles[idx];
            if (!tile) return null;
            const left = slot.col * P + (slot.row % 2 === 1 ? P / 2 : 0);
            const top = slot.row * (P / 2);
            const titleText = lang === 'kn' && tile.titleKn ? tile.titleKn : tile.title;
            const subText = lang === 'kn' && tile.subtitleKn ? tile.subtitleKn : tile.subtitle;

            return (
              <Link
                key={tile.id}
                to={tile.to}
                className="group diamond-clip absolute block bg-white shadow-md transition-transform duration-300 hover:scale-[1.03] hover:z-20 focus-visible:outline-none"
                style={{
                  width: `${D}px`,
                  height: `${D}px`,
                  left: `${left}px`,
                  top: `${top}px`,
                }}
              >
                <div className="relative w-full h-full overflow-hidden">
                  <VisualPlate
                    imageUrl={tile.imageUrl}
                    variant={
                      (tile.visualKey as
                        | 'batching-plant'
                        | 'engineers-site'
                        | 'night-pour'
                        | 'transit-pour'
                        | 'quality-lab'
                        | 'product-mix'
                        | 'bricks'
                        | 'infrastructure'
                        | 'industrial') || 'product-mix'
                    }
                    tone={tile.tone === 'navy' ? 'dark' : 'light'}
                    width={720}
                    height={720}
                    objectPosition={tile.objectPosition}
                    title={titleText}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Semi-transparent label strip across middle of the diamond */}
                  <div
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-5 py-2.5 text-center text-white backdrop-blur-[1px] transition-opacity"
                    style={{ backgroundColor: TONE_STRIP[tile.tone] || TONE_STRIP.blue }}
                  >
                    <p className="font-display font-bold text-[19px] xl:text-[21px] leading-tight tracking-tight drop-shadow-xs">
                      {titleText}
                    </p>
                    <p className="font-sans text-[12px] xl:text-[13px] text-white/95 leading-snug mt-0.5 line-clamp-1">
                      {subText}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
