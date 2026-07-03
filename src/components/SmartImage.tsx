import { useState, useRef } from "react";

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}

export default function SmartImage({
  src,
  alt,
  className = "",
  imgClassName = "",
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // If image was cached by browser, it may already be complete
  const handleRef = (el: HTMLImageElement | null) => {
    if (el && el.complete && !loaded) {
      setLoaded(true);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
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
        src={src}
        alt={alt}
        className={`transition-all duration-700 ease-out ${
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
        } ${imgClassName}`}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        loading="lazy"
      />
      {/* Error state */}
      {errored && (
        <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
          <div className="text-neutral-300 text-xs">Image unavailable</div>
        </div>
      )}
    </div>
  );
}
