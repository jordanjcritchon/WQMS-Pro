import type { NavItem } from "./types";

export const NAV: NavItem[] = [
  { id: "dashboard",    icon: "DB", label: "Dashboard",         group: "platform"   },
  { id: "projects",     icon: "PJ", label: "Projects",          group: "platform"   },
  { id: "weldregister", icon: "WR", label: "Weld Register",     group: "welding"    },
  { id: "wps",          icon: "WP", label: "WPS & PQR",         group: "welding"    },
  { id: "inspection",   icon: "IN", label: "Inspection",        group: "welding"    },
  { id: "welders",      icon: "WL", label: "Personnel",         group: "quality"    },
  { id: "materials",    icon: "MT", label: "Materials",         group: "quality"    },
  { id: "ncr",          icon: "NC", label: "NCR / Defects",     group: "quality"    },
  { id: "compliance",   icon: "CM", label: "Compliance",        group: "quality"    },
  { id: "reports",      icon: "RP", label: "Reports & MDR",     group: "system"     },
  { id: "certinbox",   icon: "CI", label: "Cert Inbox",         group: "system"     },
];

export const NAV_GROUPS: Record<string, string> = {
  platform:   "PLATFORM",
  welding:    "WELDING",
  quality:    "QUALITY",
  system:     "SYSTEM",
};
