interface WaveDividerProps {
  topColor?: string;
  bottomColor?: string;
  flip?: boolean;
}

export function WaveDivider({
  topColor = 'var(--bg)',
  bottomColor = 'var(--bg-soft)',
  flip = false,
}: WaveDividerProps) {
  return (
    <div
      className="w-full overflow-hidden leading-none select-none pointer-events-none -my-px"
      style={{ backgroundColor: topColor }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        className={`block w-full h-10 sm:h-14 ${flip ? 'scale-x-[-1]' : ''}`}
      >
        <path
          d="M0,24 C260,72 520,0 780,32 C1040,64 1260,16 1440,36 L1440,72 L0,72 Z"
          fill={bottomColor}
        />
      </svg>
    </div>
  );
}
