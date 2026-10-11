/** "GOLDEN GATE" with the lavender light-bar underneath (Group 170.svg). */
export function Wordmark({ size = 34 }: { size?: number }) {
  return (
    <div className="relative inline-flex flex-col items-center">
      <span className="font-[family-name:var(--font-brand)] font-medium leading-none tracking-[1.6px] text-white" style={{ fontSize: size, textShadow: '0 0 18px rgba(153,155,255,0.25)' }}>
        GOLDEN GATE
      </span>
      <span
        aria-hidden
        className="mt-[12px] block h-[2px] w-[118%] rounded-full"
        style={{
          background: 'linear-gradient(90deg, rgba(99,103,255,0) 0%, #7a7eff 30%, #b4b6ff 50%, #7a7eff 70%, rgba(99,103,255,0) 100%)',
          boxShadow: '0 0 8px 1px rgba(122,126,255,0.8), 0 2px 16px 3px rgba(99,103,255,0.35)',
        }}
      />
    </div>
  );
}
