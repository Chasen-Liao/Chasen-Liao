import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadMono } from "@remotion/google-fonts/RobotoMono";

const { fontFamily: serif } = loadPlayfair("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

// The scene is themed through CSS custom properties so one animation serves
// both the paper and the charcoal cut: the root sets the variables, every
// element below only refers to them.
const PAPER = "var(--paper)";
const INK = "var(--ink)";
const ACCENT = "var(--accent)";
const LINE = "var(--line)";
const MUTED = "var(--muted)";
const INK_SOFT = "var(--ink-soft)";
const CYAN = "var(--cyan)";

export type Scheme = "light" | "dark";

type ThemeVars = {
  "--paper": string;
  "--ink": string;
  "--accent": string;
  "--line": string;
  "--muted": string;
  "--ink-soft": string;
  "--cyan": string;
  "--grid": string;
  "--dash": string;
  "--grain-blend": "multiply" | "screen";
  "--grain-opacity": number;
  // "r,g,b" of the accent, so glows can carry a per-theme alpha.
  "--accent-rgb": string;
  "--cyan-rgb": string;
  // The power-on bloom. On paper a white flash is invisible; on charcoal the
  // same white core turns into a grey blob, so the dark cut runs a warm one.
  "--flash-core": string;
  "--flash-mid": string;
  "--flash-peak": number;
};

const THEME: Record<Scheme, ThemeVars> = {
  light: {
    "--paper": "#F4EFE6",
    "--ink": "#1A1714",
    "--accent": "#F0652E",
    "--line": "#C9C0B2",
    "--muted": "#7d756a",
    "--ink-soft": "#3a342d",
    "--cyan": "#87E1F0",
    "--grid": "rgba(26,23,20,.05)",
    "--dash": "rgba(26,23,20,.22)",
    "--grain-blend": "multiply",
    "--grain-opacity": 0.05,
    "--accent-rgb": "240,101,46",
    "--cyan-rgb": "135,225,240",
    "--flash-core": "rgba(255,255,255,.9)",
    "--flash-mid": "rgba(240,101,46,.35)",
    "--flash-peak": 0.42,
  },
  dark: {
    // Warm charcoal ground, paper type: the sheet keeps its paper identity
    // without becoming a bright slab on GitHub's dark canvas.
    "--paper": "#16130F",
    "--ink": "#F4EFE6",
    "--accent": "#E0682E",
    "--line": "#3B342B",
    "--muted": "#A8A093",
    "--ink-soft": "#C9C0B2",
    "--cyan": "#87E1F0",
    "--grid": "rgba(244,239,230,.045)",
    "--dash": "rgba(244,239,230,.2)",
    // On charcoal the grain has to lighten the sheet instead of darkening it.
    "--grain-blend": "screen",
    "--grain-opacity": 0.035,
    "--accent-rgb": "224,104,46",
    "--cyan-rgb": "135,225,240",
    // A white core would read as a grey blob here, so the dark cut pulses warm.
    "--flash-core": "rgba(224,104,46,.55)",
    "--flash-mid": "rgba(224,104,46,.14)",
    "--flash-peak": 0.3,
  },
};

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_SNAP = Easing.bezier(0.34, 1.4, 0.5, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const useLayout = () => {
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;
  return {
    width,
    height,
    isPortrait,
    cardCenter: isPortrait
      ? { x: width / 2, y: 1200 }
      : { x: 1420, y: 540 },
  };
};

const Grain: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundImage: GRAIN,
        opacity: "var(--grain-opacity)" as unknown as number,
        mixBlendMode: "var(--grain-blend)" as unknown as "multiply",
        pointerEvents: "none",
      }}
    />
  );
};

const BlueprintGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const flicker = interpolate(
    frame,
    [0, 3, 5, 8, 11, 16, 110, 124],
    [0, 0.9, 0.2, 1, 0.5, 1, 1, 0],
    clamp,
  );
  const scale = interpolate(frame, [0, 132], [1.035, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        opacity: flicker,
        scale,
        backgroundImage: `linear-gradient(var(--grid) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid) 1px, transparent 1px)`,
        backgroundSize: "120px 120px",
        WebkitMaskImage:
          "radial-gradient(ellipse 70% 66% at 50% 50%, #000 30%, transparent 100%)",
        maskImage:
          "radial-gradient(ellipse 70% 66% at 50% 50%, #000 30%, transparent 100%)",
      }}
    />
  );
};

const PowerOn: React.FC<{ peak: number }> = ({ peak }) => {
  const frame = useCurrentFrame();
  const { width, height } = useLayout();
  const lineY = height / 2;
  const lineScale = interpolate(frame, [0, 7], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.2, 0.9, 0.2, 1),
  });
  const lineOpacity = interpolate(
    frame,
    [0, 1, 7, 18],
    [0, 1, 1, 0],
    clamp,
  );
  // The bloom shape is fixed; the theme only sets how far it may push.
  const flash =
    interpolate(frame, [0, 2, 8], [0.42, 0.22, 0], clamp) * (peak / 0.42);

  return (
    <>
      <AbsoluteFill
        style={{
          opacity: flash,
          background:
            "radial-gradient(circle at 50% 50%, var(--flash-core), var(--flash-mid) 30%, transparent 65%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: lineY,
          left: 0,
          width,
          height: 1.5,
          scale: `${lineScale} 1`,
          opacity: lineOpacity,
          background: `linear-gradient(90deg, transparent, ${ACCENT} 15%, ${ACCENT} 85%, transparent)`,
          boxShadow: `0 0 22px 3px rgba(var(--accent-rgb),.5)`,
        }}
      />
    </>
  );
};

const CornerTrace: React.FC<{
  corner: "tl" | "tr" | "bl" | "br";
  delay: number;
}> = ({ corner, delay }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;
  const size = isPortrait ? 168 : 200;
  const inset = isPortrait ? 48 : 64;
  const draw = interpolate(frame, [delay, delay + 18], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const dots = interpolate(frame, [delay + 10, delay + 22], [0, 1], clamp);

  return (
    <svg
      viewBox="0 0 144 144"
      width={size}
      height={size}
      style={{
        position: "absolute",
        top: corner.startsWith("t") ? inset : undefined,
        bottom: corner.startsWith("b") ? inset : undefined,
        left: corner.endsWith("l") ? inset : undefined,
        right: corner.endsWith("r") ? inset : undefined,
        color: LINE,
        transformOrigin: "center",
        scale: {
          tl: "1 1",
          tr: "-1 1",
          bl: "1 -1",
          br: "-1 -1",
        }[corner],
      }}
    >
      <g fill="none" stroke="currentColor" strokeWidth={1}>
        <path
          d="M14 132V40L40 14H132 M22 94V44L44 22H94"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
        <path
          d="M30 82V48L48 30H82 M38 66V52L52 38H66"
          opacity={0.6}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
        <path
          d="M6 64H14 M6 80H14 M6 96H14 M64 6V14 M80 6V14 M96 6V14"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
      </g>
      <g fill="currentColor" opacity={dots}>
        <circle cx="14" cy="132" r="2.5" />
        <circle cx="132" cy="14" r="2.5" />
        <circle cx="22" cy="94" r="2" />
        <circle cx="94" cy="22" r="2" />
        <rect x="5" y="46" width="2" height="2" />
        <rect x="5" y="112" width="2" height="2" />
        <rect x="21" y="118" width="2" height="2" />
        <rect x="29" y="103" width="2" height="2" />
        <rect x="46" y="5" width="2" height="2" />
        <rect x="112" y="5" width="2" height="2" />
        <rect x="118" y="21" width="2" height="2" />
        <rect x="103" y="29" width="2" height="2" />
      </g>
    </svg>
  );
};

const CornerTraces: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [104, 120], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ opacity }}>
      <CornerTrace corner="tl" delay={2} />
      <CornerTrace corner="tr" delay={5} />
      <CornerTrace corner="bl" delay={8} />
      <CornerTrace corner="br" delay={11} />
    </AbsoluteFill>
  );
};

const HorizontalSweep: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const progress = interpolate(frame, [10, 34], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.4, 0, 0.15, 1),
  });
  const opacity = interpolate(
    frame,
    [10, 14, 28, 36],
    [0, 1, 1, 0],
    clamp,
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: interpolate(progress, [0, 1], [-80, height + 80]),
        height: 2,
        opacity,
        background: `linear-gradient(90deg, transparent 0%, ${ACCENT} 18%, ${ACCENT} 82%, transparent 100%)`,
        boxShadow: `0 0 26px 4px rgba(var(--accent-rgb),.38)`,
      }}
    />
  );
};

const VerticalSweep: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const progress = interpolate(frame, [26, 48], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.5, 0, 0.2, 1),
  });
  const opacity = interpolate(frame, [26, 30, 42, 50], [0, 0.55, 0.55, 0], clamp);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: interpolate(progress, [0, 1], [-60, width + 60]),
        width: 1,
        opacity,
        background: `linear-gradient(180deg, transparent, ${INK} 25%, ${INK} 75%, transparent)`,
      }}
    />
  );
};

const CenterMark: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [16, 28, 56, 70], [0, 1, 1, 0], clamp);
  const scale = interpolate(frame, [16, 30], [0.5, 1], {
    ...clamp,
    easing: EASE_SNAP,
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: appear,
      }}
    >
      <div style={{ position: "relative", width: 240, height: 240, scale }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: `1px solid ${LINE}`,
            borderRadius: "50%",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: -34,
            border: `1px dashed var(--dash)`,
            borderRadius: "50%",
            rotate: `${frame * 0.7}deg`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 1,
            height: 26,
            background: INK,
            opacity: 0.35,
            translate: "-50% -170%",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 1,
            height: 26,
            background: INK,
            opacity: 0.35,
            translate: "-50% 70%",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 26,
            height: 1,
            background: INK,
            opacity: 0.35,
            translate: "-170% -50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 26,
            height: 1,
            background: INK,
            opacity: 0.35,
            translate: "70% -50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: ACCENT,
            translate: "-50% -50%",
            boxShadow: `0 0 12px 2px rgba(var(--accent-rgb),.6)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const Kicker: React.FC = () => {
  const frame = useCurrentFrame();
  const text = "PROFILE 001";
  const caret = frame < 52 && Math.floor(frame / 4) % 2 === 0;
  const groupOpacity = interpolate(frame, [18, 24], [0, 1], clamp);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        marginBottom: 26,
        fontFamily: mono,
        fontSize: 20,
        fontWeight: 500,
        letterSpacing: "0.42em",
        color: MUTED,
        textIndent: "0.42em",
        opacity: groupOpacity,
      }}
    >
      <span style={{ color: ACCENT, opacity: 0.8 }}>[</span>
      <span style={{ display: "flex", gap: 4 }}>
        {text.split("").map((char, i) => {
          const start = 22 + i * 0.7;
          return (
            <span
              key={i}
              style={{
                opacity: interpolate(frame, [start, start + 5], [0, 1], clamp),
                display: "inline-block",
              }}
            >
              {char === " " ? " " : char}
            </span>
          );
        })}
      </span>
      <span style={{ color: ACCENT, opacity: caret ? 0.9 : frame < 52 ? 0.25 : 0 }}>|</span>
      <span style={{ color: ACCENT, opacity: 0.8 }}>]</span>
    </div>
  );
};

const Wordmark: React.FC = () => {
  const frame = useCurrentFrame();
  const letters = "Chasen".split("");
  const split = interpolate(frame, [36, 58], [7, 0], clamp);
  const splitAlpha = (split / 7) * 0.3;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        fontFamily: serif,
        fontSize: 232,
        fontWeight: 600,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        color: INK,
        textShadow: `${split}px 0 rgba(var(--accent-rgb),${splitAlpha}), ${-split * 0.7}px 0 rgba(var(--cyan-rgb),${splitAlpha * 0.8})`,
        scale: interpolate(frame, [50, 58, 66], [1, 1.035, 1], {
          ...clamp,
          easing: EASE_OUT,
        }),
      }}
    >
      {letters.map((letter, i) => {
        const start = 34 + i * 1.6;
        const rise = interpolate(frame, [start, start + 16], [0, 1], {
          ...clamp,
          easing: EASE_OUT,
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                translate: `0px ${(1 - rise) * 250}px`,
              }}
            >
              {letter}
            </span>
          </span>
        );
      })}
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: ACCENT,
          marginLeft: 10,
          marginTop: 22,
          scale: interpolate(frame, [54, 66], [0, 1], {
            ...clamp,
            easing: EASE_SNAP,
          }),
          boxShadow: `0 0 18px 3px rgba(var(--accent-rgb),.35)`,
        }}
      />
    </div>
  );
};

const Rule: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        height: 1,
        width: 520,
        background: INK,
        opacity: 0.28,
        marginTop: 34,
        scale: interpolate(frame, [60, 76], [0, 1], {
          ...clamp,
          easing: EASE_OUT,
        }),
      }}
    />
  );
};

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const tracking = interpolate(frame, [68, 90], [0.55, 0.3], {
    ...clamp,
    easing: EASE_OUT,
  });

  return (
    <div
      style={{
        marginTop: 28,
        fontFamily: mono,
        fontSize: 24,
        fontWeight: 400,
        letterSpacing: `${tracking}em`,
        textIndent: `${tracking}em`,
        color: INK,
        opacity: interpolate(frame, [68, 86], [0, 1], clamp),
      }}
    >
      AI / AGENT BUILDER · GUANGZHOU
    </div>
  );
};

export const ProfileOpening: React.FC<{ scheme?: Scheme }> = ({ scheme = "light" }) => {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill
      style={
        {
          backgroundColor: PAPER,
          ...THEME[scheme],
        } as React.CSSProperties
      }
    >
      <BlueprintGrid />
      <PowerOn peak={THEME[scheme]["--flash-peak"]} />
      <CenterMark />
      <CornerTraces />
      <HorizontalSweep />
      <VerticalSweep />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", scale: width < 1200 ? 0.95 : 1 }}>
          <Kicker />
          <Wordmark />
          <Rule />
          <Subtitle />
        </div>
      </AbsoluteFill>
      <Grain />
    </AbsoluteFill>
  );
};