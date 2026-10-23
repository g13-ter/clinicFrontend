type PreviewTableProps = {
  headers: string[];
  rows: string[][];
};

export default function PreviewTable({
  headers,
  rows,
}: PreviewTableProps) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
      {/* TABLE HEADER */}
      <div
        className="grid bg-slate-50"
        style={{
          gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
        }}
      >
        {headers.map((header) => (
          <span
            key={header}
            className="truncate px-3 py-2 text-[6px] font-semibold text-slate-500 sm:text-[7px]"
          >
            {header}
          </span>
        ))}
      </div>

      {/* TABLE ROWS */}
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid border-t border-slate-100"
          style={{
            gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
          }}
        >
          {row.map((cell, cellIndex) => (
            <span
              key={`${rowIndex}-${cellIndex}`}
              className={`truncate px-3 py-2 text-[6px] sm:text-[7px] ${
                cellIndex === 0
                  ? "font-medium text-blue-600"
                  : cellIndex === row.length - 1
                    ? "font-medium text-amber-600"
                    : "text-slate-500"
              }`}
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}