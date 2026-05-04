import React from "react";
import { D } from "../theme";

interface ButtonProps {
  children:  React.ReactNode;
  onClick?:  () => void;
  color?:    string;
  outline?:  boolean;
  style?:    React.CSSProperties;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children, onClick, color, outline, style: s, disabled,
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    style={{
      background:    outline ? "transparent" : color || D.accent,
      border:        `1px solid ${outline ? (color || D.border) : (color || D.accent)}`,
      color:         outline ? (color || D.textMid) : "#fff",
      padding:       "7px 14px",
      borderRadius:  6,
      cursor:        disabled ? "not-allowed" : "pointer",
      fontWeight:    500,
      fontSize:      13,
      fontFamily:    "'Inter',sans-serif",
      opacity:       disabled ? 0.4 : 1,
      letterSpacing: "-0.01em",
      lineHeight:    1,
      ...s,
    }}
  >
    {children}
  </button>
);
