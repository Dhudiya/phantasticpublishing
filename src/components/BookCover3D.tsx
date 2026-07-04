import { useRef, useState, useEffect, type MouseEvent } from "react";

interface BookCover3DProps {
  src: string;
  alt: string;
  /** Extra class on the outermost scene container */
  className?: string;
}

/**
 * Premium 3D book presentation matching the reference design.
 *
 * The book rests at a slight -22° Y-axis angle so both the spine (left)
 * and page-stack edges (right) are visible — like a real hardcover on a desk.
 *
 * On hover the cover smoothly follows the cursor with:
 *  - Perspective tilt (rotateX + rotateY) via a spring-like RAF loop
 *  - Moving specular gloss highlight
 *  - Shadow that shifts with the lean
 *
 * 3D geometry (all faces share the same transform-style:preserve-3d context):
 *  - Front face    : Z = 0 plane, natural width/height
 *  - Left spine    : rotateY(-90°) around front face's left edge (x = 0)
 *  - Right pages   : rotateY(+90°) around front face's right edge (x = W)
 */
export default function BookCover3D({ src, alt, className = "" }: BookCover3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glossRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Destination the spring moves toward
  const target = useRef({ rx: 0, ry: 0, mx: 50, my: 50 });
  // Current animated value
  const current = useRef({ rx: 0, ry: 0, mx: 50, my: 50 });

  const REST_Y = -22; // deg — at-rest rotation showing spine + page edges

  function applyFrame() {
    if (!innerRef.current) return;
    const { rx, ry, mx, my } = current.current;

    innerRef.current.style.transform =
      `rotateX(${rx}deg) rotateY(${REST_Y + ry}deg)`;

    if (glossRef.current) {
      glossRef.current.style.background =
        `radial-gradient(ellipse at ${mx}% ${my}%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.10) 35%, transparent 65%)`;
    }

    if (shadowRef.current) {
      const shift = ry * 1.8;
      const blur = 36 + Math.abs(ry) * 1.5;
      const scaleX = 0.72 - Math.abs(ry) * 0.004;
      shadowRef.current.style.transform =
        `translateX(${shift}px) scaleX(${scaleX})`;
      shadowRef.current.style.filter = `blur(${blur}px)`;
    }
  }

  function scheduleRaf() {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(function loop() {
      const t = target.current;
      const c = current.current;
      const k = 0.11; // spring constant — higher = snappier
      c.rx += (t.rx - c.rx) * k;
      c.ry += (t.ry - c.ry) * k;
      c.mx += (t.mx - c.mx) * k;
      c.my += (t.my - c.my) * k;

      applyFrame();

      const done =
        Math.abs(t.rx - c.rx) < 0.01 &&
        Math.abs(t.ry - c.ry) < 0.01 &&
        Math.abs(t.mx - c.mx) < 0.05 &&
        Math.abs(t.my - c.my) < 0.05;

      if (done) {
        rafRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(loop);
      }
    });
  }

  // Set initial transform without animation, clean up RAF on unmount
  useEffect(() => {
    if (innerRef.current) {
      innerRef.current.style.transform = `rotateX(0deg) rotateY(${REST_Y}deg)`;
    }
    applyFrame();
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    target.current = {
      rx: (0.5 - y) * 14,   // ±7 deg X tilt
      ry: (x - 0.5) * 16,   // ±8 deg additional Y tilt
      mx: x * 100,
      my: y * 100,
    };
    scheduleRaf();
  }

  function handleMouseLeave() {
    target.current = { rx: 0, ry: 0, mx: 50, my: 50 };
    scheduleRaf();
  }

  // Spine thickness in px (at the CSS scale of the component)
  const SPINE = 26;

  return (
    /*
     * Outermost: sets the perspective and provides the hit-test surface
     * for mouse events. Horizontal padding gives the rotated book room so
     * the spine never clips against the container edge.
     */
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative px-7 pb-5 ${className}`}
      style={{ perspective: "1100px", perspectiveOrigin: "50% 42%" }}
    >
      {/* Book scene — preserve-3d so all child faces share one 3D context */}
      <div style={{ transformStyle: "preserve-3d", position: "relative" }}>

        {/* ── Inner book: the three faces rotate together ─────────── */}
        <div
          ref={innerRef}
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(0deg) rotateY(${REST_Y}deg)`,
            willChange: "transform",
          }}
        >
          {/* ── 1. Front cover ──────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-r-[2px]">
            {/* Shimmer placeholder */}
            {!loaded && (
              <div className="absolute inset-0 bg-neutral-200 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
            )}

            <img
              src={src}
              alt={alt}
              onLoad={() => setLoaded(true)}
              draggable={false}
              className={`block w-full h-auto transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
              style={{ aspectRatio: "3/4", objectFit: "contain", display: "block" }}
            />

            {/* Constant top-edge specular — gives the cover a slight sheen */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 35%, transparent 55%)",
              }}
            />

            {/* Moving gloss — updated by JS each frame */}
            <div
              ref={glossRef}
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.22) 0%, transparent 60%)",
                opacity: 0.55,
              }}
            />

            {/* Right-edge page shadow on the cover face */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 right-0 w-3"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(0,0,0,0.18))",
              }}
            />
          </div>

          {/* ── 2. Left spine ─────────────────────────────────────────
               Pivot = right edge of spine = left edge of front face (x=0).
               After rotateY(-90°) the panel is perpendicular, facing left. */}
          <div
            className="absolute top-0 bottom-0 rounded-l-[2px]"
            style={{
              width: `${SPINE}px`,
              /* Right edge of this element sits exactly at x=0 */
              right: "100%",
              transformOrigin: "100% 50%",
              transform: "rotateY(-90deg)",
              background:
                "linear-gradient(to bottom, #303030 0%, #161616 30%, #0e0e0e 60%, #2a2a2a 100%)",
            }}
          >
            {/* Thin highlight strip along the spine's front edge */}
            <div
              className="absolute top-0 bottom-0 right-0 w-[3px]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.14))",
              }}
            />
          </div>

          {/* ── 3. Right page-stack edges ─────────────────────────────
               Pivot = left edge of pages = right edge of front face (x=W).
               After rotateY(+90°) the panel is perpendicular, facing right. */}
          <div
            className="absolute top-0 bottom-0 rounded-r-[2px]"
            style={{
              width: `${SPINE}px`,
              /* Left edge of this element sits exactly at x=W */
              left: "100%",
              transformOrigin: "0% 50%",
              transform: "rotateY(90deg)",
              background:
                "repeating-linear-gradient(180deg, #f4efe7 0px, #f4efe7 1.2px, #cfc9be 1.6px, #f4efe7 2.2px)",
              boxShadow: "inset -4px 0 10px rgba(0,0,0,0.14), inset 2px 0 4px rgba(0,0,0,0.07)",
            }}
          />
        </div>

        {/* ── Ground shadow ────────────────────────────────────────── */}
        <div
          ref={shadowRef}
          className="pointer-events-none absolute -bottom-1 left-[5%] right-[5%] h-4 rounded-full"
          style={{
            background: "rgba(0,0,0,0.42)",
            filter: "blur(36px)",
            transform: "translateX(0) scaleX(0.72)",
            transformOrigin: "center",
            willChange: "transform, filter",
          }}
        />
      </div>
    </div>
  );
}
