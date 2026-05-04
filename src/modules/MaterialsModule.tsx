import React, { useState } from "react";
import { D } from "../theme";
import { Tag, SimpleTable, TabBar, Button } from "../components";
import { MAT_RAW, MAT_CONS } from "../data";

export const MaterialsModule: React.FC = () => {
  const [tab, setTab] = useState("raw");
  const missingMTC    = MAT_RAW.filter(m => m.mtcStatus === "Missing").length;
  const expiredCons   = MAT_CONS.filter(c => c.issueStatus === "Expired").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TabBar tabs={[["raw", "Raw Materials"], ["consumables", "Consumables"]]} active={tab} setActive={setTab} />

      {tab === "raw" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          {missingMTC > 0 && (
            <div style={{ padding: "10px 14px", background: D.failBg, border: `1px solid ${D.failBorder}`, borderRadius: 7, color: D.fail, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              ⚠ {missingMTC} missing MTC(s)
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Button>+ Register Material</Button>
          </div>
          <SimpleTable
            data={MAT_RAW}
            keyField="id"
            columns={[
              { key: "id",           label: "Mat ID",  mono: true, color: () => D.accent },
              { key: "heatNo",       label: "Heat No.", mono: true, color: () => "#6ea4f0" },
              { key: "grade",        label: "Grade",   color: () => D.text },
              { key: "matGroup",     label: "Group",   render: r => <Tag label={String(r.matGroup)} kind="blue" /> },
              { key: "size",         label: "Size" },
              { key: "supplier",     label: "Supplier" },
              { key: "mtcStatus",    label: "MTC",     render: r => <Tag label={String(r.mtcStatus)} kind={r.mtcStatus === "Uploaded" ? "green" : "red"} /> },
              { key: "pmiStatus",    label: "PMI",     render: r => <Tag label={String(r.pmiStatus)} kind={r.pmiStatus === "Pass" ? "green" : "amber"} /> },
              { key: "traceability", label: "Trace",   render: r => <Tag label={String(r.traceability)} kind={r.traceability === "Linked" ? "green" : "red"} /> },
            ]}
          />
        </div>
      )}

      {tab === "consumables" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          {expiredCons > 0 && (
            <div style={{ padding: "10px 14px", background: D.failBg, border: `1px solid ${D.failBorder}`, borderRadius: 7, color: D.fail, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              ⚠ {expiredCons} expired consumable(s)
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Button>+ Register Consumable</Button>
          </div>
          <SimpleTable
            data={MAT_CONS}
            keyField="id"
            columns={[
              { key: "id",             label: "ID",             mono: true, color: () => D.accent },
              { key: "type",           label: "Type" },
              { key: "classification", label: "Classification", color: () => D.text },
              { key: "batch",          label: "Batch",          mono: true, color: () => "#6ea4f0" },
              { key: "manufacturer",   label: "Manufacturer" },
              { key: "location",       label: "Storage" },
              { key: "issueStatus",    label: "Status",         render: r => <Tag label={String(r.issueStatus)} kind={r.issueStatus === "Expired" ? "red" : r.issueStatus === "In Use" ? "green" : "neutral"} /> },
              { key: "expiry",         label: "Expiry",         color: r => r.issueStatus === "Expired" ? D.fail : D.textMid },
              { key: "issuedTo",       label: "Issued To" },
            ]}
          />
        </div>
      )}
    </div>
  );
};
