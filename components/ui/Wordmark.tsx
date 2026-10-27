import { LOCKUP_WIDTH, SPARK, STONE, WORDMARK_PATH } from "./brand-geometry.ts";

/**
 * ONYQ logo — spark mark + "onyq" wordmark (brand book §02). Colour follows `currentColor`;
 * the spark takes the brand accent (volt) on dark grounds and stays cut out on light ones,
 * as in the approved colour versions.
 */
export function Wordmark({ className = "", title = "ONYQ" }: { className?: string; title?: string }) {
  return (
    <svg
      className={`wordmark ${className}`}
      viewBox={`0 0 ${LOCKUP_WIDTH} 100`}
      role="img"
      aria-label={title}
      focusable="false"
    >
      <g className="wordmark__mark">
        <path className="wordmark__stone" fillRule="evenodd" fill="currentColor" d={STONE} />
        <path className="wordmark__spark" d={SPARK} />
      </g>
      <g transform="translate(115.5 76) scale(0.1)">
        <path
          className="wordmark__type"
          d={WORDMARK_PATH}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={31}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** The mark on its own (favicon size up to supergraphics). */
export function SparkMark({
  className = "",
  spark = true,
  label,
}: {
  className?: string;
  spark?: boolean;
  label?: string;
}) {
  return (
    <svg
      className={`spark-mark ${className}`}
      viewBox="0 0 100 100"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path className="spark-mark__stone" fillRule="evenodd" fill="currentColor" d={STONE} />
      {spark ? <path className="spark-mark__spark" d={SPARK} /> : null}
    </svg>
  );
}

/** Four-point spark used as bullet, ornament and particle. */
export function Spark({ className = "", size }: { className?: string; size?: number }) {
  return (
    <svg
      className={`spark ${className}`}
      viewBox="24 24 52 52"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path d={SPARK} fill="currentColor" />
    </svg>
  );
}
