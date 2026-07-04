import { useRef, type MouseEvent } from "react";
import SmartImage from "./SmartImage";

interface BookCover3DProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Disable the 3D tilt interaction (e.g. for admin thumbnails) */
  disableTilt?: boolean;
}

/**
 * Book cover with a realistic 3D perspective tilt that follows the cursor.
 * The cover uses object-contain so the full cover is always visible (no cropping).
 * A subtle spine and page-edge shadow give the feel of a physical book.
 */
export default function BookCover3D({
  src,
  alt,
  className = "",
  imgClassName = "",
  disableTilt = false,
}: BookCover3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (disableTilt || !ref.current) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;   // 0 → 1
    const y = (e.clientY - rect.top) / rect.height;    // 0 → 1
    const rotateY = (x - 0.5) * 18;   // -9deg → +9deg
    const rotateX = (0.5 - y) * 14;   // -7deg → +7deg
    el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  }

  function handleLeave() {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`group/cover relative [transform-style:preserve-3d] transition-transform duration-500 ease-out ${className}`}
      style={{ transform: "perspective(900px) rotateX(0deg) rotateY(0deg)" }}
    >
      {/* Spine — left edge of the book, visible when tilted */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[10px] origin-left [transform:rotateY(-90deg) translateZ(-5px)] bg-gradient-to-b from-neutral-200 via-neutral-100 to-neutral-200 rounded-l-sm"
        style={{ transform: "rotateY(-90deg) translateZ(-5px)" }}
      />

      {/* Cover image — object-contain so the full cover is always visible */}
      <div className="relative [transform:translateZ(20px)] overflow-hidden bg-neutral-100 rounded-lg md:rounded-none shadow-lg md:shadow-2xl">
        <SmartImage
          src={src}
          alt={alt}
          className="aspect-[3/4] w-full"
          imgClassName={`w-full h-full object-contain ${imgClassName}`}
        />

        {/* Glossy specular highlight that follows the cursor */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.25) 0%, transparent 45%)",
          }}
        />

        {/* Page-edge shadow on the right — gives depth like a thick book */}
        <div className="pointer-events-none absolute right-0 top-2 bottom-2 w-[3px] bg-gradient-to-r from-black/15 to-transparent" />
      </div>

      {/* Drop shadow beneath the book */}
      <div
        className="pointer-events-none absolute -bottom-2 left-2 right-2 h-6 bg-black/15 blur-xl rounded-full transition-opacity duration-500 group-hover/cover:opacity-60 opacity-30"
        style={{ transform: "translateZ(-10px)" }}
      />
    </div>
  );
}
