import { useState, useRef } from "react";

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Render eagerly (above-the-fold / hero images). Defaults to lazy. */
  priority?: boolean;
  /** Intrinsic width hint used for the browser's aspect-ratio placeholder. */
  width?: number;
  /** Intrinsic height hint used for the browser's aspect-ratio placeholder. */
  height?: number;
  /** Max rendered width in px — drives responsive CDN resizing. Defaults to 1200. */
  targetWidth?: number;
}

/*
 * Cloudinary transformation helper. All remote images in this app are served
 * from Cloudinary, which can resize, compress, and re-encode to modern
 * formats (AVIF/WebP) on the fly via URL transforms — no paid service or
 * build step needed. Local assets are passed through untouched.
 */
function optimizeCloudinaryUrl(src: string, targetWidth: number, dprAuto: boolean): string {
  if (!src.includes("res.cloudinary.com")) return src;
  if (src.includes("/upload/") === false) return src;
  // Don't double-transform URLs that already carry transformations
  if (/\/upload\/(?:[^/]+\/)*f_/.test(src)) return src;

  const dpr = dprAuto ? ",dpr_auto" : "";
  return src.replace(
    "/upload/",
    `/upload/f_auto,q_auto:good,w_${targetWidth}${dpr}/`
  );
}

export default function SmartImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  priority = false,
  width,
  height,
  targetWidth = 1200,
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const optimized = optimizeCloudinaryUrl(src, targetWidth, !priority);
  // Half-size preview first, then the full-size image — perceived load
  // is dramatically faster on slow connections.
  const previewSrc = optimizeCloudinaryUrl(src, Math.min(32, targetWidth), false);

  // If image was cached by browser, it may already be complete
  const handleRef = (el: HTMLImageElement | null) => {
    if (el && el.complete && !loaded) {
      setLoaded(true);
    }
  };

  const aspectRatio = width && height ? width / height : undefined;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio: `${width} / ${height}` } : undefined}
    >
      {/* Shimmer placeholder */}
      {!loaded && !errored && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
        </div>
      )}
      <img
        ref={(el) => {
          (imgRef as React.MutableRefObject<HTMLImageElement | null>).current = el;
          handleRef(el);
        }}
        src={optimized}
        srcSet={buildSrcSet(src, targetWidth)}
        sizes={sizesFromTarget(targetWidth)}
        alt={alt}
        className={`transition-opacity duration-500 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        } ${imgClassName}`}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding={priority ? "sync" : "async"}
        width={width}
        height={height}
      />
      {/* Error state */}
      {errored && (
        <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
          <div className="text-neutral-300 text-xs">Image unavailable</div>
        </div>
      )}
      {/* LQIP preview — loaded only while the main image streams in */}
      {!loaded && !errored && previewSrc !== optimized && (
        <img
          src={previewSrc}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "blur(12px)", transform: "scale(1.05)" }}
        />
      )}
    </div>
  );
}

function buildSrcSet(src: string, targetWidth: number): string | undefined {
  if (!src.includes("res.cloudinary.com") || /\/upload\/(?:[^/]+\/)*f_/.test(src)) return undefined;
  const widths = [320, 480, 640, 800, 1080, targetWidth, targetWidth * 2].filter(
    (w, i, arr) => w > 0 && arr.indexOf(w) === i
  );
  return widths
    .map((w) => `${optimizeCloudinaryUrl(src, w, false)} ${w}w`)
    .join(", ");
}

function sizesFromTarget(targetWidth: number): string {
  return `(max-width: 640px) 100vw, (max-width: 1024px) 80vw, ${Math.min(targetWidth, 1600)}px`;
}
