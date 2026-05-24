import React, { useState } from "react";
import { TabBar } from "../components";
import { MaterialsModule } from "./MaterialsModule";
import { HeatModule }      from "./HeatModule";
import { CertInboxModule } from "./CertInboxModule";

const TABS: [string, string][] = [
  ["materials", "Materials"],
  ["heat",      "Heat Treatment"],
  ["certs",     "Cert Inbox"],
];

export const MaterialsHubModule: React.FC = () => {
  const [tab, setTab] = useState("materials");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TabBar
        tabs={TABS}
        active={tab}
        setActive={setTab}
      />
      <div style={{ flex: 1, overflow: "hidden" }}>
        {tab === "materials" && <MaterialsModule />}
        {tab === "heat"      && <HeatModule />}
        {tab === "certs"     && <CertInboxModule />}
      </div>
    </div>
  );
};
