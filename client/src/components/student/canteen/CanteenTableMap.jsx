/**
 * CanteenTableMap — fully transparent overlay.
 * Numbers are rendered directly on each table with zero background.
 * Only a selection ring appears when a table is clicked.
 */

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

const CanteenTableMap = ({ selectedTable, onSelect, t }) => {
  return (
    <div className="w-full">
      {/* Map container */}
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

        {/* SVG overlay — fully transparent except selection ring */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-label="Canteen table map"
        >
          {TABLE_AREAS.map((table) => {
            const isSelected = selectedTable === table.id;
            const cx = table.x + table.w / 2;
            const cy = table.y + table.h / 2;

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
                {/* Transparent hit area — green ring only when selected */}
                <rect
                  x={table.x}
                  y={table.y}
                  width={table.w}
                  height={table.h}
                  rx="1.2"
                  ry="1.2"
                  fill={isSelected ? 'rgba(34,197,94,0.18)' : 'transparent'}
                  stroke={isSelected ? '#22c55e' : 'transparent'}
                  strokeWidth={isSelected ? '0.8' : '0'}
                  style={{ transition: 'fill 0.15s, stroke 0.15s' }}
                />

                {/* Number — white with dark shadow, sits right on the table */}
                <text
                  x={cx}
                  y={cy + 0.2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isSelected ? '4.5' : '3.8'}
                  fontWeight="900"
                  fill={isSelected ? '#22c55e' : '#ffffff'}
                  style={{
                    pointerEvents: 'none',
                    fontFamily: 'system-ui, sans-serif',
                    filter: isSelected
                      ? 'drop-shadow(0 0 1.5px #000) drop-shadow(0 0 1.5px #000)'
                      : 'drop-shadow(0 0.5px 1.2px rgba(0,0,0,0.9)) drop-shadow(0 0 2px rgba(0,0,0,0.8))',
                    transition: 'fill 0.15s, font-size 0.15s',
                  }}
                >
                  {table.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected badge */}
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
