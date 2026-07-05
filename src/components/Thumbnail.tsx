"use client";

import { useState } from "react";

export default function Thumbnail({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-salin-bg-elevated text-salin-fg-muted ${className ?? ""}`}
      >
        <span className="text-[10px] uppercase tracking-widest">Salin Radio</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
