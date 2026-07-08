export function NoiseBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 opacity-[0.04] mix-blend-screen [filter:url(#noise-bg-fx)_grayscale(100%)]"
    >
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <filter id="noise-bg-fx">
          <feTurbulence baseFrequency="0.9" />
        </filter>
      </svg>
    </div>
  );
}
