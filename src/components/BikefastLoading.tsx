import { Zap } from 'lucide-react'

type BikefastLoadingProps = {
  label?: string
}

export default function BikefastLoading({
  label = 'Preparando tu próxima ruta',
}: BikefastLoadingProps) {
  return (
    <div className="bikefast-loader" role="status" aria-live="polite">
      <style>{`
        .bikefast-loader {
          --ld-bg: #f5f3ec;
          --ld-surface: #fff;
          --ld-ink: #0b0b0b;
          --ld-mute: #5d5d57;
          --ld-line: rgba(11, 11, 11, .14);
          --ld-y: #ffd51a;
          --ld-y-dark: #d9ad00;
          --ld-ease: cubic-bezier(.22, 1, .36, 1);
          position: relative;
          display: grid;
          min-height: 100svh;
          place-items: center;
          overflow: hidden;
          isolation: isolate;
          background: var(--ld-bg);
          color: var(--ld-ink);
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }
        .dark .bikefast-loader {
          --ld-bg: #0a0a0a;
          --ld-surface: #151515;
          --ld-ink: #f5f3ec;
          --ld-mute: #a3a39b;
          --ld-line: rgba(245, 243, 236, .16);
        }
        .bikefast-loader__grid {
          position: absolute;
          inset: 0;
          z-index: -1;
          opacity: .5;
          background-image:
            linear-gradient(var(--ld-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--ld-line) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(circle at 50% 45%, black, transparent 72%);
        }
        .bikefast-loader__content {
          display: flex;
          width: min(88vw, 420px);
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .bikefast-loader__wordmark {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          margin-bottom: clamp(28px, 6vh, 52px);
        }
        .bikefast-loader__wm-y {
          border-radius: 5px;
          background: var(--ld-y);
          color: #0b0b0b;
          padding: 2px 7px;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -.02em;
          line-height: 1.15;
        }
        .bikefast-loader__wm-i {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .16em;
        }
        .bikefast-loader__stage {
          position: relative;
          display: grid;
          width: clamp(150px, 34vw, 196px);
          aspect-ratio: 1;
          place-items: center;
        }
        .bikefast-loader__disc {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: var(--ld-y);
          animation: bikefast-loader-breathe 2.6s var(--ld-ease) infinite;
        }
        .bikefast-loader__disc::after {
          position: absolute;
          inset: -14%;
          border: 1px solid var(--ld-line);
          border-radius: 50%;
          content: "";
          animation: bikefast-loader-orbit 9s linear infinite;
        }
        .bikefast-loader__bolt {
          position: relative;
          z-index: 1;
          width: 30%;
          height: 42%;
          overflow: visible;
          color: #0b0b0b;
          animation: bikefast-loader-strike 2.4s var(--ld-ease) infinite;
        }
        .bikefast-loader__bolt path {
          fill: currentColor;
        }
        .bikefast-loader__spark {
          position: absolute;
          z-index: 2;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--ld-ink);
          animation: bikefast-loader-spark 2s ease-in-out infinite;
        }
        .bikefast-loader__spark--one { top: 16%; left: 12%; }
        .bikefast-loader__spark--two { right: 10%; top: 46%; animation-delay: .6s; }
        .bikefast-loader__spark--three { bottom: 14%; left: 26%; animation-delay: 1.1s; }
        .bikefast-loader__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-top: clamp(26px, 5vh, 44px);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--ld-mute);
        }
        .bikefast-loader__eyebrow::before {
          width: 28px;
          height: 2px;
          background: var(--ld-y);
          content: "";
        }
        .bikefast-loader__label {
          margin-top: 14px;
          font-size: clamp(1.5rem, 4.4vw, 2.1rem);
          font-weight: 800;
          letter-spacing: -.05em;
          line-height: 1.05;
          text-transform: uppercase;
        }
        .bikefast-loader__bar {
          width: min(100%, 260px);
          height: 4px;
          margin-top: clamp(22px, 4vh, 34px);
          overflow: hidden;
          border-radius: 999px;
          background: var(--ld-line);
        }
        .bikefast-loader__bar::after {
          display: block;
          width: 40%;
          height: 100%;
          border-radius: inherit;
          background: var(--ld-y);
          content: "";
          animation: bikefast-loader-progress 1.5s var(--ld-ease) infinite;
        }
        .bikefast-loader__hint {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 18px;
          color: var(--ld-mute);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        @keyframes bikefast-loader-breathe {
          0%, 100% { transform: scale(.97); }
          50% { transform: scale(1.03); }
        }
        @keyframes bikefast-loader-orbit { to { transform: rotate(360deg); } }
        @keyframes bikefast-loader-strike {
          0%, 100% { transform: translateY(3px) scale(.96); opacity: .85; }
          16%, 64% { transform: translateY(0) scale(1); opacity: 1; }
          22% { transform: translate(2px, -1px) scale(1.02); }
          26% { transform: translate(-2px, 1px) scale(.99); }
        }
        @keyframes bikefast-loader-spark {
          0%, 100% { transform: scale(.3); opacity: 0; }
          45% { transform: scale(1); opacity: .9; }
        }
        @keyframes bikefast-loader-progress {
          0% { transform: translateX(-140%); }
          100% { transform: translateX(340%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bikefast-loader__disc,
          .bikefast-loader__disc::after,
          .bikefast-loader__bolt,
          .bikefast-loader__spark,
          .bikefast-loader__bar::after { animation: none; }
          .bikefast-loader__bolt { opacity: 1; }
        }
      `}</style>
      <div className="bikefast-loader__grid" aria-hidden="true" />
      <div className="bikefast-loader__content">
        <div className="bikefast-loader__wordmark" aria-hidden="true">
          <span className="bikefast-loader__wm-y">BIKE FAST</span>
          <span className="bikefast-loader__wm-i">
            ELECTRIC <Zap className="h-3.5 w-3.5" style={{ color: 'var(--ld-ink)' }} />
          </span>
        </div>
        <div className="bikefast-loader__stage" aria-hidden="true">
          <div className="bikefast-loader__disc" />
          <span className="bikefast-loader__spark bikefast-loader__spark--one" />
          <span className="bikefast-loader__spark bikefast-loader__spark--two" />
          <span className="bikefast-loader__spark bikefast-loader__spark--three" />
          <svg className="bikefast-loader__bolt" viewBox="0 0 100 140">
            <path d="M61 3 18 78h28l-8 59 44-82H54z" />
          </svg>
        </div>
        <p className="bikefast-loader__eyebrow">Bikefast Electrics</p>
        <p className="bikefast-loader__label">{label}</p>
        <div className="bikefast-loader__bar" aria-hidden="true" />
        <p className="bikefast-loader__hint">
          <Zap className="h-3 w-3" /> Cargando energía
        </p>
        <span className="sr-only">Cargando contenido de Bikefast Electrics</span>
      </div>
    </div>
  )
}
