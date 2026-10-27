import { Fragment, type CSSProperties } from "react";

/**
 * Splits a line into word spans for the masked "rise" reveal. Server-rendered: the words are
 * real text in the HTML (readable without JS, indexable, copyable); only their transform is
 * animated. `start` offsets the stagger so a second line continues after the first.
 */
export function Split({ text, start = 0, className = "" }: { text: string; start?: number; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className={`split ${className}`}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="split__w">
            <span className="split__i" style={{ "--wi": start + i } as CSSProperties}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}

/** Word count, for chaining the stagger of a following line. */
export function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Two-tone heading made of two split lines (the second in the accent). */
export function SplitLines({ lines, toneSecond = true }: { lines: readonly string[]; toneSecond?: boolean }) {
  let offset = 0;
  return (
    <>
      {lines.map((line, i) => {
        const node = (
          <span key={i} className={`block${toneSecond && i === 1 ? " tone-2" : ""}`}>
            <Split text={line} start={offset} />
          </span>
        );
        offset += wordCount(line);
        return node;
      })}
    </>
  );
}
