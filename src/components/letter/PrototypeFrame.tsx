"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A prototype screen, shown inside the page.
 *
 * The prototype is a complete HTML document with its own styles, so it goes
 * in a frame of its own rather than into the page, where its rules would
 * spill onto everything else. It is passed in as text, not fetched from an
 * address: there is no second request, and nothing to allow in the page's
 * framing policy. It runs no script and loads only when scrolled near.
 *
 * With `baseWidth` the document is laid out at that width, so its desktop
 * arrangement holds, and the whole frame is scaled down to fit the column.
 * Without it the frame is simply as wide as its container. Either way the
 * frame is made as tall as its content, so the page has one scrollbar.
 */
export function PrototypeFrame({
  html,
  title,
  baseWidth,
}: {
  html: string;
  title: string;
  baseWidth?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [box, setBox] = useState<{ scale: number; height: number } | null>(
    null,
  );

  const measure = useCallback(() => {
    const available = wrap.current?.clientWidth;
    if (!available) return;
    const scale = baseWidth ? Math.min(1, available / baseWidth) : 1;
    const content =
      frame.current?.contentDocument?.documentElement?.scrollHeight;
    setBox((current) => ({
      scale,
      height: content && content > 0 ? content : (current?.height ?? 1600),
    }));
  }, [baseWidth]);

  useEffect(() => {
    measure();
    if (!wrap.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(wrap.current);
    return () => observer.disconnect();
  }, [measure]);

  const height = box?.height ?? 1600;
  const scale = box?.scale ?? 1;

  return (
    <div
      ref={wrap}
      className="overflow-hidden"
      style={{ height: Math.ceil(height * scale) }}
    >
      <iframe
        ref={frame}
        title={title}
        srcDoc={html}
        loading="lazy"
        sandbox="allow-same-origin"
        onLoad={measure}
        className="block border-0"
        style={{
          width: baseWidth ? `${baseWidth}px` : "100%",
          height,
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
