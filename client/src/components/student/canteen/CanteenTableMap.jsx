/**
 * CanteenTableMap
 * ───────────────
 * Renders the real canteen aerial photo as an interactive SVG overlay.
 * Each <area> maps to an actual table visible in the image.
 * Clicking a table selects it; the selected table is highlighted with
 * a green ring. All hit-areas are percentage-based so the map scales
 * correctly on any screen size (desktop, tablet, mobile).
 *
 * Props
 *  - selectedTable  : string  – currently selected table ("1"…"9") or ""
 *  - onSelect       : fn(string) – called with the table number string
 *  - t              : theme object from parent
 */

// ─── Table hit-area data (percentage of image width × height) ─────────────
// Coordinates derived from the aerial canteen photo (1024 × 768 approx).
// Each entry: { id, label, x, y, w, h }  – all in % of container.
// Row 1: Tables 1, 2, 3  (top row, ~y 27–42%)
// Row 2: Tables 4, 5, 6  (middle row, ~y 43–57%)
// Row 3: Tables 7, 8, 9  (bottom row, ~y 57–72%)
const TABLE_AREAS = [
  // Row 1
  { id: '1', label: 'Table 1', x: 18.5, y: 27.0, w: 15.0, h: 15.0 },
  { id: '2', label: 'Table 2', x: 37.5, y: 24.5, w: 15.5, h: 15.0 },
  { id: '3', label: 'Table 3', x: 57.5, y: 24.0, w: 15.5, h: 15.0 },
  // Row 2
  { id: '4', label: 'Table 4', x: 18.5, y: 42.5, w: 15.0, h: 15.0 },
  { id: '5', label: 'Table 5', x: 37.5, y: 41.0, w: 15.5, h: 15.0 },
  { id: '6', label: 'Table 6', x: 57.5, y: 40.0, w: 15.5, h: 15.0 },
  // Row 3
  { id: '7', label: 'Table 7', x: 18.5, y: 57.5, w: 15.0, h: 15.0 },
  { id: '8', label: 'Table 8', x: 37.5, y: 56.5, w: 15.5, h: 15.0 },
  { id: '9', label: 'Table 9', x: 57.5, y: 55.5, w: 15.5, h: 15.0 },
];

const CanteenTableMap = ({ selectedTable, onSelect, t }) => {
  return (
    <div className="w-full">
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs font-bold" style={{ color: t.textMuted }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded-sm border-2 border-white/60 bg-white/20" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5 rounded-sm border-2 border-green-400 bg-green-400/30" />
          Selected
        </span>
      </div>

      {/* Map container – intrinsic ratio preserved via padding-bottom trick */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border"
        style={{
          paddingBottom: '73%', // 768/1024 ≈ 75%; use ~73% to match this image's ratio
          borderColor: t.border,
          boxShadow: t.shadowSoft,
        }}
      >
        {/* Background image */}
        <img
          src="/canteen/canteen-map.jpg"
          alt="Canteen floor plan"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {/* SVG overlay for click areas */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-label="Canteen table map"
        >
          {TABLE_AREAS.map((table) => {
            const isSelected = selectedTable === table.id;
            return (
              <g key={table.id} role="button" aria-label={table.label} tabIndex={0}
                onClick={() => onSelect(table.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(table.id); }}
                style={{ cursor: 'pointer' }}
              >
                {/* Hit-area rectangle */}
                <rect
                  x={table.x}
                  y={table.y}
                  width={table.w}
                  height={table.h}
                  rx="1.5"
                  ry="1.5"
                  fill={isSelected ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.15)'}
                  stroke={isSelected ? '#22c55e' : 'rgba(255,255,255,0.55)'}
                  strokeWidth={isSelected ? '0.8' : '0.5'}
                  style={{ transition: 'fill 0.18s, stroke 0.18s' }}
                />

                {/* Table number badge */}
                <text
                  x={table.x + table.w / 2}
                  y={table.y + table.h / 2 + 0.3}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="3.8"
                  fontWeight="900"
                  fill={isSelected ? '#ffffff' : 'rgba(255,255,255,0.9)'}
                  style={{
                    pointerEvents: 'none',
                    textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                    fontFamily: 'system-ui, sans-serif',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {table.id}
                </text>

                {/* Green check mark when selected */}
                {isSelected && (
                  <text
                    x={table.x + table.w - 2.2}
                    y={table.y + 2.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="3"
                    fill="#22c55e"
                    style={{ pointerEvents: 'none', fontWeight: 900 }}
                  >
                    ✓
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Selected table badge overlay */}
        {selectedTable && (
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-extrabold shadow-lg"
            style={{
              backgroundColor: '#22c55e',
              color: '#fff',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Table {selectedTable} selected
          </div>
        )}
      </div>

      {/* Tap hint on mobile */}
      <p className="mt-2 text-center text-[11px]" style={{ color: t.textMuted }}>
        Tap a table on the map to select it
      </p>
    </div>
  );
};

export default CanteenTableMap;
