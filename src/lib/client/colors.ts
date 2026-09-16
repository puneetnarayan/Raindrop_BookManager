// Pastel palette used for Space colors and, by extension, resource card tinting.
export const PASTEL_COLORS = [
  "#FECACA", // red-200
  "#FED7AA", // orange-200
  "#FDE68A", // amber-200
  "#D9F99D", // lime-200
  "#BBF7D0", // green-200
  "#99F6E4", // teal-200
  "#A5F3FC", // cyan-200
  "#BFDBFE", // blue-200
  "#C7D2FE", // indigo-200
  "#DDD6FE", // violet-200
  "#F5D0FE", // fuchsia-200
  "#FBCFE8", // pink-200
];

const DEFAULT_CARD_TINT = "#E5E7EB"; // neutral-200

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

/** Returns an rgba() string tinted from a base hex color, for card backgrounds. */
export function pastelTint(hex: string | undefined, alpha: number): string {
  const rgb = hex ? hexToRgb(hex) : null;
  const [r, g, b] = rgb ?? hexToRgb(DEFAULT_CARD_TINT)!;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
