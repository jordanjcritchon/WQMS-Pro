import React from "react";
import { D } from "../theme";

interface CardProps {
  children: React.ReactNode;
  s?:       React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, s, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background:   D.surface,
      border:       `1px solid ${D.border}`,
      borderRadius: 8,
      boxShadow:    D.shadow,
      cursor:       onClick ? "pointer" : undefined,
      ...s,
    }}
  >
    {children}
  </div>
);
