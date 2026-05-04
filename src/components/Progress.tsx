import React from "react";
import { D } from "../theme";

interface ProgressProps {
  value:  number;
  color?: string;
  h?:     number;
}

export const Progress: React.FC<ProgressProps> = ({ value, color, h = 6 }) => (
  <div style={{ background: D.border, borderRadius: 99, height: h, overflow: "hidden" }}>
    <div
      style={{
        width:        `${Math.min(100, value || 0)}%`,
        height:       "100%",
        background:   color || D.blue,
        borderRadius: 99,
        transition:   "width 0.5s",
      }}
    />
  </div>
);
