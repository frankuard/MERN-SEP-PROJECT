/**
 * CanteenTableMap
 * ───────────────
 * Real aerial canteen photo with an SVG overlay.
 * Each table has a compact light pill showing its number
 * centered exactly on the table surface — easy to read at a glance.
 * Clicking selects the table; selected state shows a green ring + green pill.
 */

// ─── Table hit-area data (% of image width × height) ─────────────────────
// Row 1: Tables 1, 2, 3  |  Row 2: Tables 4, 5, 6  |  Row 3: Tables 7, 8, 9
const TABLE_AREAS = [
  { id: '1', x: 18.5, y: 27.0, w: 15.0, h: 15.0 },
  { id: '2', x: 37.5, y: 24.5, w: 15.5, h: 15.0 },
  { id: '3', x: 57.5, y: 24.0, w: 15.5, h: 15.0 },
  { id: '4', x: 18.5, y: 42.5, w: 15.0, h: 15.0 },
  { id: '5', x: 37.5, y: 41.0, w: 15.5, h: 15.0 },
  { id: '6', x: 57.5, y: 40.0, w: 15.5, h: 15.0 },
  { id: '7', x: 18.5, y: 57.5, w: 15.0, h: 15.0 },
  { id: '8', x: 37.5, y: 56.5, w: 15.5, h: 15.0 },
  { id: '9', x: 57.5, y: 55.5, w: 15.5, h: 15.0 },
];

// Pill size — tight enough to sit right on the table surface
const PILL_W = 5.2;   // width  in SVG units (% of viewBox)
const PILL_H = 3.0;   // height in SVG units
const PILL_R = 0.8;   // corner radius

const CanteenTableMap = ({ selectedTable, onSelect, t }) => {
  return (
    <div className="w-full">
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs font-bold" style={{ color: t.textMuted }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-white/70 bg-white/80" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-green-500 bg-green-400" />
          Selected
        </span>
      </div>

      {/* Map container — aspect ratio preserved */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border"
        style={{ paddingBottom: '73%', borderColor: t.border, boxShadow: t.shadowSoft }}
      >
        {/* Photo */}
        <img
          src="/canteen/canteen-map.jpg"
          alt="Canteen floor plan"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {/* SVG overlay */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-label="Canteen table map"
        >
          {TABLE_AREAS.map((table) => {
            const isSelected = selectedTable === table.id;

            // Centre of this table's hit-area
            const cx = table.x + table.w / 2;
            const cy = table.y + table.h / 2;

            // Pill top-left corner (centred on the table)
            const px = cx - PILL_W / 2;
            const py = cy - PILL_H / 2;

            return (
              <g
                key={table.id}
                role="button"
                aria-label={`Table ${table.id}`}
                tabIndex={0}
                onClick={() => onSelect(table.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(table.id); }}
                style={{ cursor: 'pointer' }}
              >
                {/* Invisible click area covering whole table */}
                <rect
                  x={table.x}
                  y={table.y}
                  width={table.w}
                  height={table.h}
                  rx="1.2"
                  ry="1.2"
                  fill="transparent"
                  stroke={isSelected ? '#22c55e' : 'transparent'}
                  strokeWidth={isSelected ? '0.7' : '0'}
                  style={{ transition: 'stroke 0.15s' }}
                />

                {/* Light pill background */}
                <rect
                  x={px}
                  y={py}
                  width={PILL_W}
                  height={PILL_H}
                  rx={PILL_R}
                  ry={PILL_R}
                  fill={isSelected ? '#22c55e' : 'rgba(255,255,255,0.88)'}
                  style={{ transition: 'fill 0.15s', filter: 'drop-shadow(0 0.3px 1px rgba(0,0,0,0.35))' }}
                />

                {/* Number text — dark on white, white on green */}
                <text
                  x={cx}
                  y={cy + 0.15}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="2.2"
                  fontWeight="800"
                  fill={isSelected ? '#ffffff' : '#1a1a1a'}
                  style={{
                    pointerEvents: 'none',
                    fontFamily: 'system-ui, sans-serif',
                    letterSpacing: '0.01em',
                  }}
                >
                  {table.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected table floating badge */}
        {selectedTable && (
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold shadow-lg"
            style={{ backgroundColor: '#22c55e', color: '#fff', pointerEvents: 'none', whiteSpace: 'nowrap' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Table {selectedTable} selected
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-[11px]" style={{ color: t.textMuted }}>
        Tap a table on the map to select it
      </p>
    </div>
  );
};

export default CanteenTableMap;
