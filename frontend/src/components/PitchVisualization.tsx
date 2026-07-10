import { Lineup, LineupPlayerEntry } from '../types/football';

interface PitchVisualizationProps {
  home: Lineup;
  away: Lineup;
}

const PITCH_W = 600;
const PITCH_H = 400;

/**
 * Convert API-Football's "row:col" grid string into pitch coordinates.
 * Row 1 is the goalkeeper; higher rows move toward the opposing goal.
 * `flip` mirrors the away team so both sides face each other.
 */
const gridToPoint = (
  grid: string | null,
  maxRow: number,
  flip: boolean
): { x: number; y: number } | null => {
  if (!grid) {
    return null;
  }
  const [rowStr, colStr] = grid.split(':');
  const row = Number(rowStr);
  const col = Number(colStr);
  if (!Number.isFinite(row) || !Number.isFinite(col)) {
    return null;
  }

  // Columns within a row are 1-indexed and centered; estimate column count by
  // row (defenses/midfields/attacks rarely exceed 5 across).
  const colSpread = 5;
  const xRatio = (col - 0.5) / colSpread;
  const yRatio = (row - 1) / Math.max(maxRow - 1, 1);

  const halfHeight = PITCH_H / 2 - 20;
  const y = flip
    ? PITCH_H / 2 + halfHeight * (1 - yRatio)
    : PITCH_H / 2 - halfHeight * (1 - yRatio);
  const x = 40 + xRatio * (PITCH_W - 80);

  return { x, y };
};

const PlayerDot = ({
  entry,
  point,
  color,
}: {
  entry: LineupPlayerEntry;
  point: { x: number; y: number };
  color: string;
}) => (
  <g>
    <circle cx={point.x} cy={point.y} r={14} fill={color} stroke="white" strokeWidth={2} />
    <text
      x={point.x}
      y={point.y + 4}
      textAnchor="middle"
      fontSize={11}
      fontWeight="bold"
      fill="white"
    >
      {entry.player.number ?? ''}
    </text>
    <text
      x={point.x}
      y={point.y + 26}
      textAnchor="middle"
      fontSize={10}
      fill="#374151"
    >
      {entry.player.name.length > 14
        ? `${entry.player.name.slice(0, 13)}…`
        : entry.player.name}
    </text>
  </g>
);

const PitchVisualization = ({ home, away }: PitchVisualizationProps) => {
  const maxRow = 6;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
        className="mx-auto w-full max-w-2xl"
        role="img"
        aria-label={`تشكيلة ${home.team.name} مقابل ${away.team.name}`}
      >
        {/* Pitch background */}
        <rect x={0} y={0} width={PITCH_W} height={PITCH_H} fill="#2f7d3c" rx={8} />
        <rect
          x={8}
          y={8}
          width={PITCH_W - 16}
          height={PITCH_H - 16}
          fill="none"
          stroke="white"
          strokeWidth={2}
        />
        <line x1={8} y1={PITCH_H / 2} x2={PITCH_W - 8} y2={PITCH_H / 2} stroke="white" strokeWidth={2} />
        <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={40} fill="none" stroke="white" strokeWidth={2} />

        {home.startXI.map((entry) => {
          const point = gridToPoint(entry.player.grid, maxRow, false);
          return point ? (
            <PlayerDot key={entry.player.id} entry={entry} point={point} color="#1d4ed8" />
          ) : null;
        })}
        {away.startXI.map((entry) => {
          const point = gridToPoint(entry.player.grid, maxRow, true);
          return point ? (
            <PlayerDot key={entry.player.id} entry={entry} point={point} color="#dc2626" />
          ) : null;
        })}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-6 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-blue-700" /> {home.team.name}
          {home.formation ? ` (${home.formation})` : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-600" /> {away.team.name}
          {away.formation ? ` (${away.formation})` : ''}
        </span>
      </div>
    </div>
  );
};

export default PitchVisualization;
