import React from "react";
import { D } from "../theme";

interface LabelProps {
  c:    string;
  req?: boolean;
}

export const Label: React.FC<LabelProps> = ({ c, req }) => (
  <label
    style={{
      color:         D.textMid,
      fontSize:      11,
      display:       "block",
      marginBottom:  5,
      fontWeight:    600,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}
  >
    {c}
    {req && <span style={{ color: D.fail, marginLeft: 3 }}>*</span>}
  </label>
);
