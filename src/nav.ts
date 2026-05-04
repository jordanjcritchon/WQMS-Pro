import type { NavItem } from "./types";

export const NAV: NavItem[] = [
  { id: "dashboard",    icon: "DB", label: "Dashboard",          group: "main"       },
  { id: "projects",     icon: "PJ", label: "Projects",           group: "main"       },
  { id: "weldmap",      icon: "WM", label: "Weld Maps",          group: "main"       },
  { id: "passport",     icon: "WP", label: "Weld Passport",      group: "main"       },
  { id: "readiness",    icon: "RD", label: "Readiness Checker",  group: "main"       },
  { id: "wps",          icon: "WS", label: "WPS / PQR",          group: "welding"    },
  { id: "wpsvalidate",  icon: "VE", label: "WPS Validation Engine",group: "welding"    },
  { id: "welders",      icon: "WL", label: "Welder Quals",       group: "welding"    },
  { id: "traceability", icon: "TR", label: "Weld Traceability",  group: "welding"    },
  { id: "vt",           icon: "VT", label: "VT Inspection",      group: "inspection" },
  { id: "ndt",          icon: "ND", label: "NDT Management",     group: "inspection" },
  { id: "itp",          icon: "IT", label: "ITP / Hold Points",  group: "inspection" },
  { id: "heat",         icon: "HT", label: "Heat Treatment",     group: "quality"    },
  { id: "materials",    icon: "MT", label: "Materials",          group: "quality"    },
  { id: "ncr",          icon: "NC", label: "NCR / Defects",      group: "quality"    },
  { id: "mdr",          icon: "MD", label: "MDR Builder",        group: "system"     },
  { id: "certinbox",   icon: "CI", label: "Cert Inbox",          group: "system"     },
  { id: "documents",   icon: "DC", label: "Document Control",    group: "system"     },
  { id: "reports",     icon: "RP", label: "Reports",             group: "system"     },
  { id: "settings",    icon: "ST", label: "Settings",            group: "system"     },
];

export const NAV_GROUPS: Record<string, string> = {
  main:       "PLATFORM",
  welding:    "WELDING",
  inspection: "INSPECTION",
  quality:    "QUALITY",
  system:     "SYSTEM",
};
