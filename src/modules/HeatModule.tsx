import React from "react";
import { D } from "../theme";
import { Tag, StatusDot, SimpleTable, Button } from "../components";
import { HT_DATA } from "../data";
import { HT_STATUS_SM } from "../statusMeta";

export const HeatModule: React.FC = () => (
  <div style={{ padding: 20, overflowY: "auto" }}>
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
      <Button>+ New HT Record</Button>
    </div>
    <SimpleTable
      data={HT_DATA}
      keyField="id"
      columns={[
        { key: "id",           label: "ID",          mono: true, color: () => D.accent },
        { key: "weldId",       label: "Weld",        mono: true, color: () => "#6ea4f0" },
        { key: "type",         label: "Type",        render: r => <Tag label={String(r.type)} kind="orange" /> },
        { key: "standard",     label: "Standard" },
        { key: "targetTemp",   label: "Target °C",   center: true, color: () => D.text },
        { key: "soakTime",     label: "Soak (min)",  center: true },
        { key: "actualStatus", label: "Status",      render: r => <StatusDot status={String(r.actualStatus)} meta={HT_STATUS_SM} /> },
        { key: "technician",   label: "Technician" },
        { key: "date",         label: "Date" },
      ]}
    />
  </div>
);
