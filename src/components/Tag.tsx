import React from "react";
import { D } from "../theme";

type TagKind = "blue" | "green" | "amber" | "red" | "neutral" | "orange" | "purple" | "teal";

interface TagProps {
  label: string;
  kind?: TagKind;
}

const KIND_STYLES: Record<TagKind, { bg: string; c: string; b: string }> = {
  blue:    { bg: D.blueFaint,    c: "#6ea4f0", b: D.blueBorder    },
  green:   { bg: D.passBg,      c: D.pass,    b: D.passBorder    },
  amber:   { bg: D.warnBg,      c: D.warn,    b: D.warnBorder    },
  red:     { bg: D.failBg,      c: D.fail,    b: D.failBorder    },
  neutral: { bg: D.surfaceAlt,  c: D.textMid, b: D.border        },
  orange:  { bg: D.accentFaint, c: D.accent,  b: D.accentBorder  },
  purple:  { bg: D.purpleBg,    c: D.purple,  b: D.purpleBorder  },
  teal:    { bg: D.tealBg,      c: D.teal,    b: D.tealBorder    },
};

export const Tag: React.FC<TagProps> = ({ label, kind = "blue" }) => {
  const k = KIND_STYLES[kind] ?? KIND_STYLES.neutral;
  return (
    <span
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        background:   k.bg,
        color:        k.c,
        border:       `1px solid ${k.b}`,
        borderRadius: 4,
        padding:      "2px 7px",
        fontSize:     11,
        fontWeight:   500,
        marginRight:  3,
        marginBottom: 3,
        letterSpacing: "0.01em",
        lineHeight:   1.5,
      }}
    >
      {label}
    </span>
  );
};
