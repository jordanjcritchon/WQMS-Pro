import React from "react";
import { D } from "../theme";
import { Card } from "./Card";
import { TH, TD } from "./TableCell";
import type { TableColumn } from "../types";

interface SimpleTableProps<T extends object> {
  data:       T[];
  columns:    TableColumn<T>[];
  keyField?:  keyof T;
}

export function SimpleTable<T extends object>({
  data, columns, keyField = "id" as keyof T,
}: SimpleTableProps<T>) {
  return (
    <Card s={{ overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {columns.map(c => <TH key={c.key} center={c.center}>{c.label}</TH>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={String((row as Record<string, unknown>)[keyField as string])}
              style={{
                borderBottom: `1px solid ${D.borderSoft}`,
                background:   i % 2 === 0 ? D.surface : "transparent",
              }}
            >
              {columns.map(c => (
                <TD
                  key={c.key}
                  mono={c.mono}
                  center={c.center}
                  color={c.color ? c.color(row) : undefined}
                >
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                </TD>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
