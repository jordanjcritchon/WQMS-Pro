import React, { useState } from "react";
import { D } from "../theme";
import { Tag, StatusDot, SimpleTable, TabBar, Button } from "../components";
import { NDT_DATA, NDT_EQUIP, NDT_TECHS } from "../data";
import { CALIB_SM, TECH_SM, NDT_RESULT_SM } from "../statusMeta";

export const NDTModule: React.FC = () => {
  const [tab, setTab]     = useState("register");
  const expiredEquip      = NDT_EQUIP.filter(e => e.calibStatus === "Expired").length;
  const expiringTechs     = NDT_TECHS.filter(t => t.status === "Expiring Soon").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TabBar
        tabs={[["register","NDT Register"],["equipment","Equipment",expiredEquip],["technicians","Technicians",expiringTechs]]}
        active={tab}
        setActive={setTab}
      />

      {tab === "register" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Button>+ New NDT Record</Button>
          </div>
          <SimpleTable
            data={NDT_DATA}
            keyField="id"
            columns={[
              { key: "id",       label: "ID",          mono: true, color: () => D.accent },
              { key: "weldId",   label: "Weld",        mono: true, color: () => "#6ea4f0" },
              { key: "method",   label: "Method",      render: r => <Tag label={String(r.method)} kind="blue" /> },
              { key: "techName", label: "Technician" },
              { key: "techQual", label: "Qual" },
              { key: "result",   label: "Result",      render: r => <StatusDot status={String(r.result)} meta={NDT_RESULT_SM} /> },
              { key: "acceptStd",label: "Standard" },
              { key: "date",     label: "Date" },
              { key: "ncrRef",   label: "NCR",         render: r => r.ncrRef ? <Tag label={String(r.ncrRef)} kind="red" /> : <span style={{ color: D.textSoft }}>—</span> },
            ]}
          />
        </div>
      )}

      {tab === "equipment" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          {expiredEquip > 0 && (
            <div style={{ padding: "10px 14px", background: D.failBg, border: `1px solid ${D.failBorder}`, borderRadius: 7, color: D.fail, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
              🚨 {expiredEquip} equipment with expired calibration.
            </div>
          )}
          <SimpleTable
            data={NDT_EQUIP}
            keyField="id"
            columns={[
              { key: "id",           label: "ID",           mono: true, color: () => D.accent },
              { key: "type",         label: "Type" },
              { key: "manufacturer", label: "Manufacturer" },
              { key: "model",        label: "Model" },
              { key: "serial",       label: "Serial",       mono: true, color: () => "#6ea4f0" },
              { key: "calibDue",     label: "Calib Due",    color: r => r.calibStatus === "Expired" ? D.fail : r.calibStatus === "Expiring Soon" ? D.warn : D.textMid },
              { key: "calibStatus",  label: "Status",       render: r => <StatusDot status={String(r.calibStatus)} meta={CALIB_SM} /> },
              { key: "location",     label: "Location" },
            ]}
          />
        </div>
      )}

      {tab === "technicians" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <SimpleTable
            data={NDT_TECHS}
            keyField="id"
            columns={[
              { key: "id",         label: "ID",      mono: true, color: () => D.accent },
              { key: "name",       label: "Name",    color: () => D.text },
              { key: "cert",       label: "Cert",    render: r => <Tag label={String(r.cert)} kind="blue" /> },
              { key: "methods",    label: "Methods", render: r => <div style={{ display: "flex", flexWrap: "wrap" }}>{(r.methods as string[]).map(m => <Tag key={m} label={m} kind="neutral" />)}</div> },
              { key: "level",      label: "Level",   color: () => D.text },
              { key: "certBody",   label: "Body" },
              { key: "expiryDate", label: "Expiry",  color: r => r.status === "Expired" ? D.fail : r.status === "Expiring Soon" ? D.warn : D.textMid },
              { key: "status",     label: "Status",  render: r => <StatusDot status={String(r.status)} meta={TECH_SM} /> },
            ]}
          />
        </div>
      )}
    </div>
  );
};
