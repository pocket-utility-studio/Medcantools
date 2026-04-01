/**
 * DiamondSpinner — round brilliant cut gem (top view), spinning.
 * Clean stroked geometry, scales crisply at any size.
 */

export default function DiamondSpinner({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="dg-diamond-spin"
      aria-hidden="true"
    >
      {/* Girdle circle */}
      <circle cx="50" cy="50" r="44" strokeWidth="1.8" />

      {/* Table octagon */}
      <polygon points="59.9,26.0 74.0,40.1 74.0,59.9 59.9,74.0 40.1,74.0 26.0,59.9 26.0,40.1 40.1,26.0" strokeWidth="1.2" />

      {/* Bezel / kite lines */}
      <path strokeWidth="1.2" d="M 50.0,6.0 L 40.1,26.0 M 50.0,6.0 L 59.9,26.0 M 81.1,18.9 L 59.9,26.0 M 81.1,18.9 L 74.0,40.1 M 94.0,50.0 L 74.0,40.1 M 94.0,50.0 L 74.0,59.9 M 81.1,81.1 L 74.0,59.9 M 81.1,81.1 L 59.9,74.0 M 50.0,94.0 L 59.9,74.0 M 50.0,94.0 L 40.1,74.0 M 18.9,81.1 L 40.1,74.0 M 18.9,81.1 L 26.0,59.9 M 6.0,50.0 L 26.0,59.9 M 6.0,50.0 L 26.0,40.1 M 18.9,18.9 L 26.0,40.1 M 18.9,18.9 L 40.1,26.0" />

      {/* Star facet lines */}
      <path strokeWidth="1.0" d="M 59.9,26.0 L 66.8,9.3 M 74.0,40.1 L 90.7,33.2 M 74.0,59.9 L 90.7,66.8 M 59.9,74.0 L 66.8,90.7 M 40.1,74.0 L 33.2,90.7 M 26.0,59.9 L 9.3,66.8 M 26.0,40.1 L 9.3,33.2 M 40.1,26.0 L 33.2,9.3" />

      {/* Upper girdle facets */}
      <path strokeWidth="0.7" d="M 66.8,9.3 L 50.0,6.0 M 66.8,9.3 L 81.1,18.9 M 90.7,33.2 L 81.1,18.9 M 90.7,33.2 L 94.0,50.0 M 90.7,66.8 L 94.0,50.0 M 90.7,66.8 L 81.1,81.1 M 66.8,90.7 L 81.1,81.1 M 66.8,90.7 L 50.0,94.0 M 33.2,90.7 L 50.0,94.0 M 33.2,90.7 L 18.9,81.1 M 9.3,66.8 L 18.9,81.1 M 9.3,66.8 L 6.0,50.0 M 9.3,33.2 L 6.0,50.0 M 9.3,33.2 L 18.9,18.9 M 33.2,9.3 L 18.9,18.9 M 33.2,9.3 L 50.0,6.0" />
    </svg>
  )
}
