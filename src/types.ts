// ─── Status Meta ──────────────────────────────────────────────────────────────
export interface StatusMeta {
  dot: string;
  bg:  string;
  text: string;
}
export type StatusMetaMap = Record<string, StatusMeta>;

// ─── WPS / PQR ────────────────────────────────────────────────────────────────
export interface WPS {
  id:             string;
  rev:            string;
  title:          string;
  standard:       string;
  processes:      string[];
  materialGroups: string[];
  pqrRef:         string;
  positions:      string[];
  thicknessRange: string;
  heatInput:      string;
  preheat:        string;
  interpass:      string;
  consumable:     string;
  shieldingGas:   string;
  approvedBy:     string;
  approvalDate:   string;
  status:         "Active" | "Pending Review" | "Expired";
  expiryDate?:    string;
  documentUrl?:   string;
}

export interface PQR {
  id:           string;
  wpsRef:       string;
  testDate:     string;
  testLab:      string;
  standard:     string;
  result:       string;
  tests:        string[];
  documentUrl?: string;
}

// ─── Welders ─────────────────────────────────────────────────────────────────
export interface QualDocument {
  name: string;
  url:  string;
}

export interface WelderQualification {
  id:             string;
  standard:       string;
  process:        string;
  materialGroup:  string;
  jointType:      string;
  positions:      string[];
  thicknessRange: string;
  testDate:       string;
  expiryDate:     string;
  testPiece:      string;
  result:         string;
  testLab:        string;
  wpsUsed:        string;
  certNo:         string;
  continuityOk:   boolean;
  lastActivity:   string;
  // ISO 9606-1 extended fields
  productForm?:                "plate" | "pipe";
  fillerMaterialType?:         string;
  fillerMaterialDesignation?:  string;
  shieldingGas?:               string;
  backingGas?:                 string;
  weldType?:                   "single" | "multi";
  pipeDiameter?:               string;
  preheat?:                    string;
  pwht?:                       string;
  visualResult?:               string;
  bendResult?:                 string;
  fractureResult?:             string;
  radiographicResult?:         string;
  hardnessResult?:             string;
  examinationBody?:            string;
  examinerName?:               string;
  examinerCert?:               string;
  manufacturerName?:           string;
  manufacturerRef?:            string;
  documents?:                  QualDocument[];
}

export interface Welder {
  id:             string;
  stampNo:        string;
  firstName:      string;
  lastName:       string;
  dateOfBirth?:   string;
  birthplace?:    string;
  employer:       string;
  trade:          string;
  photoUrl?:      string;
  status:         "Current" | "Expiring Soon" | "Expired";
  qualifications: WelderQualification[];
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export interface ProjectWelds {
  total:    number;
  complete: number;
  pending:  number;
  rejected: number;
}

export interface ProjectDrawing {
  id:       string;
  name:     string;
  url:      string;
  rotation: number; // 0 | 90 | 180 | 270
}

export interface Project {
  id:        string;
  name:      string;
  client:    string;
  status:    "On Track" | "At Risk" | "Delayed";
  progress:  number;
  welds:     ProjectWelds;
  standard:  string;
  due:       string;
  drawings?: ProjectDrawing[];
}

// ─── NCR ─────────────────────────────────────────────────────────────────────
export interface NCR {
  id:       string;
  weldId:   string;
  project:  string;
  defect:   string;
  status:   "Open" | "In Progress" | "Closed";
  priority: "Critical" | "High" | "Medium" | "Low";
  raised:   string;
  assignee: string;
  capa:     string;
}

// ─── VT Inspection ────────────────────────────────────────────────────────────
export interface VTPhoto {
  url:         string;
  description: string;
}

export interface VTReport {
  id:        string;
  jobNo:     string;
  weldId:    string;
  project:   string;
  result:    "PASS" | "FAIL" | "CONDITIONAL";
  date:      string;
  inspector: string;
  defects:   string[];
  standard:  string;
  notes?:    string;
  photos?:   VTPhoto[];
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export interface Alert {
  id:   number;
  type: "critical" | "warn" | "info";
  msg:  string;
  time: string;
}

// ─── Materials ────────────────────────────────────────────────────────────────
export interface RawMaterial {
  id:            string;
  heatNo:        string;
  grade:         string;
  standard:      string;
  matGroup:      string;
  size:          string;
  supplier:      string;
  mtcStatus:     string;
  pmiStatus:     string;
  location:      string;
  traceability:  string;
  linkedWelds:   string[];
  cev:           number | null;
  supplier_cert: string | null;
}

export interface Consumable {
  id:           string;
  type:         string;
  classification: string;
  manufacturer: string;
  batch:        string;
  location:     string;
  issueStatus:  string;
  expiry:       string;
  rebakeStatus: string;
  issuedTo:     string;
  wpsCompat:    string[];
}

// ─── NDT ─────────────────────────────────────────────────────────────────────
export interface NDTRecord {
  id:             string;
  weldId:         string;
  method:         string;
  techName:       string;
  techQual:       string;
  result:         string;
  acceptStd:      string;
  date:           string;
  defects:        string[];
  repairRequired: boolean;
  ncrRef:         string | null;
}

export interface NDTEquipment {
  id:          string;
  type:        string;
  manufacturer: string;
  model:       string;
  serial:      string;
  calibDue:    string;
  calibStatus: "Valid" | "Expiring Soon" | "Expired";
  location:    string;
}

export interface NDTTechnician {
  id:         string;
  name:       string;
  cert:       string;
  methods:    string[];
  level:      string;
  certBody:   string;
  employer:   string;
  expiryDate: string;
  status:     "Current" | "Expiring Soon" | "Expired";
}

// ─── Heat Treatment ───────────────────────────────────────────────────────────
export interface HeatTreatment {
  id:           string;
  jobId:        string;
  componentId:  string;
  weldId:       string;
  material:     string;
  thickness:    number;
  type:         string;
  standard:     string;
  targetTemp:   number;
  soakTime:     number;
  actualStatus: string;
  technician:   string;
  date:         string;
  compliant:    boolean | null;
}

// ─── ITP ─────────────────────────────────────────────────────────────────────
export interface ITPStep {
  seq:             number;
  activity:        string;
  criteria:        string;
  method:          string;
  holdType:        "H" | "W" | "S";
  status:          "Completed" | "In Progress" | "Pending";
  signedInspector: string;
  signedClient:    string;
  date:            string;
}

export interface ITP {
  id:             string;
  projectId:      string;
  itpNo:          string;
  rev:            string;
  component:      string;
  standard:       string;
  status:         string;
  clientApproval: string;
  steps:          ITPStep[];
}

// ─── Weld Passport ────────────────────────────────────────────────────────────
export interface PassportNDTResult {
  method: string;
  result: string;
  date:   string;
  tech:   string;
  note?:  string;
}

export interface PassportRepair {
  repairNo: number;
  date:     string;
  by:       string;
  desc:     string;
}

export interface PassportTimeline {
  event: string;
  date:  string;
  by:    string;
  note:  string;
}

export interface WeldPassport {
  id:               string;
  projectId:        string;
  componentId:      string;
  drawingNo:        string;
  jointNo:          string;
  spoolNo:          string;
  weldType:         string;
  jointDesign:      string;
  size:             string;
  position:         string;
  process:          string;
  dateWelded:       string;
  welderId:         string;
  welderName:       string;
  stampNo:          string;
  qualRef:          string;
  qualValid:        boolean;
  coordinator:      string;
  inspector:        string;
  wpsId:            string;
  wpsRev:           string;
  pqrRef:           string;
  standard:         string;
  matGroup:         string;
  thicknessOk:      boolean;
  processOk:        boolean;
  consumableOk:     boolean;
  matId:            string;
  heatNo:           string;
  matCertRef:       string;
  pmiStatus:        string;
  consumableId:     string;
  consumableBatch:  string;
  weldingGas:       string;
  fitupStatus:      string;
  inprocessStatus:  string;
  vtResult:         string;
  vtDate:           string;
  vtInspector:      string;
  ndtResults:       PassportNDTResult[];
  htRef:            string | null;
  htType:           string | null;
  htResult:         string | null;
  dimensionalResult: string;
  pressureTestResult: string;
  repairCount:      number;
  repairs:          PassportRepair[];
  ncrRefs:          string[];
  finalStatus:      string;
  overallStatus:    string;
  timeline:         PassportTimeline[];
  attachments:      string[];
}

// ─── Weld Map ─────────────────────────────────────────────────────────────────
export interface WeldMapNode {
  id:       string;
  x:        number;
  y:        number;
  status:   string;
  weldType: string;
  process:  string;
  welder:   string;
}

// ─── Readiness ────────────────────────────────────────────────────────────────
export interface ReadinessCheck {
  item:   string;
  status: "pass" | "fail" | "warn";
  note:   string;
}

export interface ReadinessCategory {
  documents:   ReadinessCheck[];
  personnel:   ReadinessCheck[];
  materials:   ReadinessCheck[];
  consumables: ReadinessCheck[];
  equipment:   ReadinessCheck[];
  process:     ReadinessCheck[];
}

// ─── MDR ─────────────────────────────────────────────────────────────────────
export interface MDRPackage {
  id:           string;
  projectId:    string;
  title:        string;
  rev:          string;
  status:       string;
  completeness: number;
  client:       string;
  issueDate:    string | null;
  sections:     string[];
  missing:      string[];
  createdBy:    string;
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
export interface NavItem {
  id:    string;
  icon:  string;
  label: string;
  group: string;
}

// ─── SimpleTable column spec ─────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TableColumn<T = any> {
  key:     string;
  label:   string;
  mono?:   boolean;
  center?: boolean;
  color?:  (row: T) => string;
  render?: (row: T) => React.ReactNode;
}

import type React from "react";
