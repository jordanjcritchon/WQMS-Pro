import React, { useState } from "react";
import { TabBar } from "../components";
import { VTModule }  from "./VTModule";
import { NDTModule } from "./NDTModule";
import { ITPModule } from "./ITPModule";
import type { CrossModuleTarget } from "../App";

interface Props {
  initialTab?: "vt" | "ndt" | "itp";
  preselect?:  CrossModuleTarget | null;
  onOpenNCR?:  (weldId: string, project: string) => void;
}

const TABS: [string, string][] = [
  ["vt",  "VT Inspection"],
  ["ndt", "NDT Management"],
  ["itp", "ITP / Hold Points"],
];

export const InspectionModule: React.FC<Props> = ({
  initialTab = "vt", preselect, onOpenNCR,
}) => {
  const [tab, setTab] = useState(initialTab);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TabBar
        tabs={TABS}
        active={tab}
        setActive={id => setTab(id as typeof tab)}
      />
      <div style={{ flex: 1, overflow: "hidden" }}>
        {tab === "vt"  && <VTModule  preselect={preselect} onOpenNCR={onOpenNCR} />}
        {tab === "ndt" && <NDTModule />}
        {tab === "itp" && <ITPModule />}
      </div>
    </div>
  );
};
