import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface LazyImageProps {
  src?: string;
  alt: string;
  className?: string;
  placeholder?: string;
  fallback?: string;
}

export function LazyImage({ src, alt, className = "", placeholder = "📜", fallback = "📜" }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  if (!src || hasError) {
    return (
      <div className={`relative flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary ${className}`}>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, var(--color-bronze) 0%, transparent 45%), radial-gradient(circle at 75% 70%, var(--color-cinnabar) 0%, transparent 40%)",
          }}
        />
        <span className="relative text-3xl md:text-5xl">{fallback || placeholder}</span>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden bg-gradient-to-br from-secondary via-background to-secondary ${className}`}>
      {/* 骨架屏 */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(circle at 30% 40%, var(--color-bronze) 0%, transparent 45%), radial-gradient(circle at 75% 70%, var(--color-cinnabar) 0%, transparent 40%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
          </div>
        </div>
      )}

      {/* 图片 */}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
