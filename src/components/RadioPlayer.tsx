"use client";

import { useEffect, useRef } from "react";
import { loadYoutubeIframeApi, type YTPlayer } from "@/lib/youtube-iframe-api";

interface RadioPlayerProps {
  videoId: string;
  onEnded: () => void;
  onError: () => void;
  onReady?: () => void;
}

export default function RadioPlayer({
  videoId,
  onEnded,
  onError,
  onReady,
}: RadioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const callbacksRef = useRef({ onEnded, onError, onReady });
  const currentVideoIdRef = useRef(videoId);

  useEffect(() => {
    callbacksRef.current = { onEnded, onError, onReady };
  });

  useEffect(() => {
    let cancelled = false;

    loadYoutubeIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      playerRef.current = new YT.Player(containerRef.current, {
        videoId: currentVideoIdRef.current,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => callbacksRef.current.onReady?.(),
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              callbacksRef.current.onEnded();
            }
          },
          onError: () => callbacksRef.current.onError(),
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (currentVideoIdRef.current === videoId) return;
    currentVideoIdRef.current = videoId;
    playerRef.current?.loadVideoById(videoId);
  }, [videoId]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-salin-line bg-black shadow-[0_0_60px_-15px_rgba(184,48,63,0.4)]">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
