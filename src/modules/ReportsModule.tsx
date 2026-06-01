import React, { useState } from "react";
import { TabBar } from "../components";
import { VTModule } from "./VTModule";
import { NDTModule } from "./NDTModule";
import { HeatModule } from "./HeatModule";
import { CertInboxModule } from "./CertInboxModule";

const TABS: [string,string][] = [
  ["vt", "VT Reports"],
  ["ndt", "NDT Management"],
  ["heat", "Heat Treatment"],
  ["inbox", "Cert Inbox"]
];

export const ReportsModule: React.FC = () => {
  const [tab, setTab] = useState("vt");
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TabBar tabs={TABS} active={tab} setActive={setTab} />
      <div style={{ flex: 1, overflow: "hidden" }}>
        {tab === "vt"  && <VTModule />}
        {tab === "ndt" && <NDTModule />}
        {tab === "heat"&& <HeatModule />}
        {tab === "inbox"&& <CertInboxModule context="reports" />}
      </div>
    </div>
  );
};

export default ReportsModule;
