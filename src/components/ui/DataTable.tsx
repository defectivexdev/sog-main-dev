import React from "react";
import { motion } from "framer-motion";

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyText?: string;
  keyExtractor: (item: T) => string;
}

export default function DataTable<T>({ columns, data, emptyText = "ไม่มีข้อมูล", keyExtractor }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#64748b", padding: "32px", background: "rgba(15,22,41,0.5)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="sog-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                style={{ 
                  textAlign: col.align || "left",
                  width: col.width || "auto"
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIdx) => (
            <motion.tr 
              key={keyExtractor(item)} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(rowIdx * 0.05, 0.5) }}
            >
              {columns.map((col, colIdx) => (
                <td 
                  key={colIdx} 
                  data-label={col.header}
                  style={{ textAlign: col.align || "left" }}
                >
                  {col.render ? col.render(item) : col.accessor ? String(item[col.accessor]) : null}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
