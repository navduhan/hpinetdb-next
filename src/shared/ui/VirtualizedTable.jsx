import { useMemo, useState } from "react";

export function VirtualizedTable({
  columns,
  rows,
  rowKey,
  rowHeight = 44,
  height = 520,
  onRowClick
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const visibleCount = Math.ceil(height / rowHeight) + 8;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 4);
  const end = Math.min(rows.length, start + visibleCount);
  const visibleRows = rows.slice(start, end);

  const totalHeight = rows.length * rowHeight;
  const topPad = start * rowHeight;

  const gridTemplateColumns = useMemo(
    () => columns.map((col) => col.width || "1fr").join(" "),
    [columns]
  );

  return (
    <div className="hp-vtable" style={{ height }} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      <div className="hp-vtable-head" style={{ gridTemplateColumns }}>
        {columns.map((col) => (
          <div key={col.key}>{col.header}</div>
        ))}
      </div>
      <div className="hp-vtable-body" style={{ height: totalHeight }}>
        <div style={{ transform: `translateY(${topPad}px)` }}>
          {visibleRows.map((row, idx) => (
            <button
              type="button"
              className="hp-vtable-row"
              key={rowKey ? rowKey(row, start + idx) : `${start + idx}`}
              style={{ gridTemplateColumns, height: rowHeight }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <div key={col.key}>{col.render ? col.render(row, start + idx) : row[col.key]}</div>
              ))}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
