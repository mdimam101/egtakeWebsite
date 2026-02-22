// src/components/ProductQualityViz.jsx
import React, { useEffect, useMemo, useRef } from "react";
 import "../styles/ProductQualityViz.css";

const TIERS = ["normal", "good", "premium", "luxury"];
const LABELS = ["Normal", "Good", "Premium", "Luxury"];
const ICONS = ["●", "★", "✨", "👑"];

// Colors
const GREEN = "#1E8E3E";
const GREEN_BG = "rgba(30,142,62,0.5)";
const GRAY = "#E5E8EC";
const LABEL_INACTIVE = "#9AA0A6";
const LABEL_ACTIVE = GREEN;

/**
 * Web version of RN ProductQualityViz
 * ✅ same design (segmented track, active dot halo pulse, label pop)
 *
 * props:
 * - PQualityType: "normal" | "good" | "premium" | "luxury"
 * - style: optional inline style
 * - trackHeight: number (default 8)
 */
export default function ProductQualityViz({ PQualityType, style, trackHeight = 8 }) {
  const activeIndex = useMemo(() => {
    const i = TIERS.indexOf(String(PQualityType).toLowerCase());
    return i >= 0 ? i : 2; // default premium
  }, [PQualityType]);

  // Anim values (0..1)
  const pulse = useRef(0);
  const labelPop = useRef(0.92);

  // keep current values in refs
  const rafRef = useRef(null);
  const t0Ref = useRef(0);

  const [tick, setTick] = React.useState(0);

  useEffect(() => {
    // restart on activeIndex change
    pulse.current = 0;
    labelPop.current = 0.92;

    // label "spring-ish" pop (quick)
    const popStart = performance.now();
    const popDur = 220;

    const loop = (t) => {
      if (!t0Ref.current) t0Ref.current = t;
      const elapsed = t - t0Ref.current;

      // pulse: triangle wave ~ 1800ms roundtrip like RN (900 up + 900 down)
      const period = 1800;
      const m = elapsed % period;
      const p = m <= 900 ? m / 900 : 1 - (m - 900) / 900;
      pulse.current = p;

      // label pop (ease out)
      const popElapsed = t - popStart;
      if (popElapsed <= popDur) {
        const k = popElapsed / popDur;
        // easeOutQuad
        const eased = 1 - (1 - k) * (1 - k);
        labelPop.current = 0.92 + (1 - 0.92) * eased;
      } else {
        labelPop.current = 1;
      }

      setTick((x) => (x + 1) % 1000000);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      t0Ref.current = 0;
    };
  }, [activeIndex]);

  // halo anim values (like interpolate)
  const haloScale = 0.5 + pulse.current * (1.2 - 0.5);
  const haloOpacity = 0.5 + pulse.current * (0.3 - 0.5);

  const micro =
    activeIndex === 0
      ? "● Made for daily use — reliable basics."
      : activeIndex === 1
      ? "★ Good materials and cleaner finishing."
      : activeIndex === 2
      ? "✨ High-quality materials with better finishing and \n　　comfortable."
      : "👑 Super high-quality materials with careful,\n　　expert finishing.";

  // use tick so styles update
  void tick;

  return (
    <div className="pq-card" style={style}>
      <div className="pq-heading">Quality Visualization</div>

      <div className="pq-trackWrap">
        <div className="pq-track" style={{ height: trackHeight }}>
          {LABELS.map((_, idx) => {
            const filled = idx <= activeIndex;
            return (
              <div
                key={`seg-${idx}`}
                className="pq-seg"
                style={{
                  height: trackHeight,
                  backgroundColor: filled ? GREEN : GRAY,
                }}
              />
            );
          })}
        </div>

        <div className="pq-stopsRow">
          {LABELS.map((label, idx) => {
            const isActive = idx === activeIndex;

            return (
              <div key={`stop-${idx}`} className="pq-stopCell">
                <div className="pq-dotWrap">
                  {isActive && (
                    <div
                      className="pq-halo"
                      style={{
                        backgroundColor: GREEN_BG,
                        transform: `scale(${haloScale})`,
                        opacity: haloOpacity,
                      }}
                    />
                  )}

                  <div
                    className="pq-dot"
                    style={{
                      borderColor: isActive ? GREEN : GRAY,
                      backgroundColor: isActive ? GREEN_BG : "#fff",
                    }}
                  />
                </div>

                <div
                  className="pq-label"
                  style={{
                    color: isActive ? LABEL_ACTIVE : LABEL_INACTIVE,
                    transform: `scale(${isActive ? labelPop.current : 1})`,
                  }}
                  title={`${ICONS[idx]} ${label}`}
                >
                  {ICONS[idx]} {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pq-micro" style={{ whiteSpace: "pre-line" }}>
        {micro}
      </div>
    </div>
  );
} 
