import React, { useState } from "react";
import { TabBar } from "../components";
import { WeldMapModule }      from "./WeldMapModule";
import { WeldPassportModule } from "./WeldPassportModule";
import { TraceabilityModule } from "./TraceabilityModule";
import type { CrossModuleTarget } from "../App";

interface Props {
  initialTab?:   "map" | "passport" | "traceability";
  preselect?:    string | null;
  openNCR?:      (weldId: string, project: string) => void;
  openVT?:       (weldId: string, project: string) => void;
}

const TABS: [string, string][] = [
  ["map",          "Weld Map"],
  ["passport",     "Weld Passport"],
  ["traceability", "Traceability"],
];

export const WeldRegisterModule: React.FC<Props> = ({
  initialTab = "map", preselect, openNCR, openVT,
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
        {tab === "map"          && <WeldMapModule openPassport={id => { setTab("passport"); }} openNCR={openNCR ?? (() => {})} openVT={openVT ?? (() => {})} />}
        {tab === "passport"     && <WeldPassportModule preselect={preselect} />}
        {tab === "traceability" && <TraceabilityModule />}
      </div>
    </div>
  );
};
