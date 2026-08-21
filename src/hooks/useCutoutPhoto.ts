// src/hooks/useCutoutPhoto.ts
//
// Given a photo URL, returns a background-removed cutout URL once ready.
// While processing (or if it's never been processed before), returns the
// original URL so the layout never shows a blank/missing image.

import { useEffect, useState } from "react";
import { getCutoutUrl } from "../utils/backgroundRemoval";


export function useCutoutPhoto(sourceUrl: string): { src: string; isProcessing: boolean } {
  // Track which source the resolved cutout belongs to, so a stale cutout is
  // never shown for a newly-changed sourceUrl. State is written only from the
  // async resolver, never synchronously in the effect body.
  const [resolved, setResolved] = useState<{ url: string; cutout: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    getCutoutUrl(sourceUrl).then((url) => {
      if (!cancelled) setResolved({ url: sourceUrl, cutout: url });
    });

    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  const isReady = resolved !== null && resolved.url === sourceUrl;
  return {
    src: isReady ? resolved.cutout : sourceUrl,
    isProcessing: !isReady,
  };
}