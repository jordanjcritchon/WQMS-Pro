import type {
  WPS, PQR, Welder, Project, NCR, VTReport, Alert,
  RawMaterial, Consumable, NDTRecord, NDTEquipment, NDTTechnician,
  HeatTreatment, ITP, WeldPassport, WeldMapNode, ReadinessCategory,
  MDRPackage,
} from "../types";

export const WPS_DATA: WPS[] = [
  { id:"WPS-001",rev:"B",title:"Carbon Steel Butt – SMAW",standard:"ISO 15614-1",processes:["111"],materialGroups:["1.1","1.2"],pqrRef:"PQR-001",positions:["PA","PC","PF"],thicknessRange:"3–40 mm",heatInput:"0.8–2.5 kJ/mm",preheat:"Min 50°C",interpass:"Max 250°C",consumable:"E7016/E7018",shieldingGas:"N/A",approvedBy:"J. Mitchell",approvalDate:"2023-06-15",status:"Active" },
  { id:"WPS-002",rev:"A",title:"316L Stainless – TIG/MIG",standard:"ISO 15614-1",processes:["141","131"],materialGroups:["6.1","6.2"],pqrRef:"PQR-002",positions:["PA","PF","H-L045"],thicknessRange:"2–30 mm",heatInput:"0.3–1.5 kJ/mm",preheat:"None",interpass:"Max 150°C",consumable:"ER316L",shieldingGas:"Ar 99.99%",approvedBy:"S. Wren",approvalDate:"2023-09-01",status:"Active" },
  { id:"WPS-003",rev:"C",title:"P1 Carbon Steel – SAW",standard:"ASME IX",processes:["121"],materialGroups:["P1"],pqrRef:"PQR-003",positions:["PA"],thicknessRange:"10–75 mm",heatInput:"2.0–5.0 kJ/mm",preheat:"Min 10°C",interpass:"Max 300°C",consumable:"F7A2-EM12K",shieldingGas:"Flux OK10.71",approvedBy:"T. Barnes",approvalDate:"2022-11-20",status:"Active" },
  { id:"WPS-004",rev:"A",title:"Duplex 2205 – TIG/MAG",standard:"ISO 15614-1",processes:["141","135"],materialGroups:["7.1"],pqrRef:"PQR-004",positions:["PA","PC"],thicknessRange:"3–25 mm",heatInput:"0.5–2.0 kJ/mm",preheat:"None",interpass:"Max 100°C",consumable:"ER2209",shieldingGas:"Ar+2%N₂",approvedBy:"J. Mitchell",approvalDate:"2024-01-10",status:"Active" },
  { id:"WPS-005",rev:"A",title:"P8 Austenitic SS – SMAW",standard:"ASME IX",processes:["111"],materialGroups:["P8"],pqrRef:"PQR-005",positions:["PA","PC","PF","PG"],thicknessRange:"3–38 mm",heatInput:"0.5–2.0 kJ/mm",preheat:"None",interpass:"Max 175°C",consumable:"E308L-16",shieldingGas:"N/A",approvedBy:"S. Wren",approvalDate:"2023-03-22",status:"Pending Review",expiryDate:"2026-03-22" },
  { id:"WPS-006",rev:"B",title:"AS 3992 Gr1 – MAG Fillet",standard:"AS 3992",processes:["135"],materialGroups:["AS-1","AS-2"],pqrRef:"PQR-006",positions:["PA","PB","PD","PF"],thicknessRange:"4–50 mm",heatInput:"0.5–3.0 kJ/mm",preheat:"Per AS/NZS 1554",interpass:"Max 250°C",consumable:"ER70S-6",shieldingGas:"Ar+15%CO₂",approvedBy:"T. Barnes",approvalDate:"2022-05-01",status:"Expired",expiryDate:"2025-05-01" },
];

export const PQR_DATA: PQR[] = [
  { id:"PQR-001",wpsRef:"WPS-001",testDate:"2023-05-20",testLab:"ALS Industrial",   standard:"ISO 15614-1",result:"Pass",tests:["Tensile","Bend","Hardness","Macro"] },
  { id:"PQR-002",wpsRef:"WPS-002",testDate:"2023-08-10",testLab:"Bureau Veritas",   standard:"ISO 15614-1",result:"Pass",tests:["Tensile","Bend","Corrosion","Ferrite","Macro"] },
  { id:"PQR-003",wpsRef:"WPS-003",testDate:"2022-10-05",testLab:"Lloyd's Register", standard:"ASME IX",    result:"Pass",tests:["Tensile","Bend","CVN Impact","Hardness"] },
  { id:"PQR-004",wpsRef:"WPS-004",testDate:"2023-12-01",testLab:"DNV GL",           standard:"ISO 15614-1",result:"Pass",tests:["Tensile","Bend","Ferrite","Corrosion","Macro"] },
  { id:"PQR-005",wpsRef:"WPS-005",testDate:"2023-02-14",testLab:"ALS Industrial",   standard:"ASME IX",    result:"Pass",tests:["Tensile","Bend","Delta Ferrite"] },
  { id:"PQR-006",wpsRef:"WPS-006",testDate:"2022-04-10",testLab:"Bureau Veritas",   standard:"AS 3992",    result:"Pass",tests:["Tensile","Bend","Macro"] },
];

export const WELDER_DATA: Welder[] = [
  { id:"WQR-001",stampNo:"W-0047",firstName:"James", lastName:"Kowalski", employer:"Apex Fabrication",status:"Current",      trade:"Boilermaker/Welder",
    qualifications:[
      { id:"Q-001-A",standard:"ISO 9606-1",process:"111",materialGroup:"1.1",jointType:"Butt Weld",positions:["PA","PC","PF"],thicknessRange:"3–40 mm",testDate:"2023-04-10",expiryDate:"2026-04-10",testPiece:"BW–t12–D>–PA/PC/PF",result:"Pass",testLab:"ALS Industrial",wpsUsed:"WPS-001",certNo:"CERT-001-A",continuityOk:true, lastActivity:"2025-11-20" },
      { id:"Q-001-B",standard:"ISO 9606-1",process:"141",materialGroup:"6.1",jointType:"Butt Weld",positions:["PA","PF"],       thicknessRange:"2–20 mm",testDate:"2022-09-15",expiryDate:"2025-09-15",testPiece:"BW–t6",           result:"Pass",testLab:"Bureau Veritas",wpsUsed:"WPS-002",certNo:"CERT-001-B",continuityOk:false,lastActivity:"2024-08-01" },
    ],
  },
  { id:"WQR-002",stampNo:"W-0052",firstName:"Maria", lastName:"Santos",   employer:"Apex Fabrication",status:"Current",      trade:"Welder",
    qualifications:[
      { id:"Q-002-A",standard:"ISO 9606-1",process:"141",materialGroup:"6.1",jointType:"Butt Weld",positions:["PA","PC","PF","H-L045"],thicknessRange:"2–30 mm",testDate:"2024-01-20",expiryDate:"2027-01-20",testPiece:"BW–t8", result:"Pass",testLab:"DNV GL",          wpsUsed:"WPS-002",certNo:"CERT-002-A",continuityOk:true, lastActivity:"2025-12-05" },
      { id:"Q-002-B",standard:"ISO 9606-1",process:"135",materialGroup:"7.1",jointType:"Butt Weld",positions:["PA","PC"],          thicknessRange:"3–25 mm",testDate:"2024-03-05",expiryDate:"2027-03-05",testPiece:"BW–t10",result:"Pass",testLab:"Bureau Veritas",wpsUsed:"WPS-004",certNo:"CERT-002-B",continuityOk:true, lastActivity:"2025-10-18" },
    ],
  },
  { id:"WQR-003",stampNo:"W-0039",firstName:"David", lastName:"Nguyen",   employer:"Steel Masters",   status:"Expiring Soon",trade:"Boilermaker",
    qualifications:[
      { id:"Q-003-A",standard:"ASME IX (QW-300)",process:"111",materialGroup:"P1",jointType:"Butt Weld",positions:["PA","PC","PF","PG"],thicknessRange:"3–38 mm",testDate:"2023-06-01",expiryDate:"2026-06-01",testPiece:"BW–t10–6G",result:"Pass",testLab:"Lloyd's Register",wpsUsed:"WPS-001",certNo:"CERT-003-A",continuityOk:true,lastActivity:"2025-09-30" },
    ],
  },
  { id:"WQR-004",stampNo:"W-0061",firstName:"Sarah", lastName:"Thompson", employer:"Apex Fabrication",status:"Current",      trade:"Welder",
    qualifications:[
      { id:"Q-004-A",standard:"ISO 9606-1",process:"135",materialGroup:"1.1",jointType:"Fillet Weld",positions:["PA","PB","PD","PF"],thicknessRange:"4–50 mm",testDate:"2024-06-10",expiryDate:"2027-06-10",testPiece:"FW–t10",result:"Pass",testLab:"Bureau Veritas",wpsUsed:"WPS-006",certNo:"CERT-004-A",continuityOk:true,lastActivity:"2025-12-01" },
    ],
  },
  { id:"WQR-005",stampNo:"W-0028",firstName:"Robert",lastName:"Malik",    employer:"Steel Masters",   status:"Expired",      trade:"Boilermaker/Welder",
    qualifications:[
      { id:"Q-005-A",standard:"ISO 9606-1",process:"111",materialGroup:"1.2",jointType:"Butt Weld",positions:["PA","PC","PF"],thicknessRange:"3–40 mm",testDate:"2020-03-01",expiryDate:"2023-03-01",testPiece:"BW–t12",result:"Pass",testLab:"ALS Industrial",wpsUsed:"WPS-001",certNo:"CERT-005-A",continuityOk:false,lastActivity:"2022-11-01" },
    ],
  },
];

export const PROJECTS: Project[] = [
  { id:"PRJ-001",name:"Pressure Vessel – Tank Farm B",   client:"BHP Minerals",   status:"On Track",progress:72,welds:{total:144,complete:103,pending:28, rejected:4 },standard:"AS 4041 / AS 3992",       due:"2026-05-30" },
  { id:"PRJ-002",name:"Mining Conveyor Structure",       client:"Rio Tinto",      status:"At Risk",  progress:45,welds:{total:320,complete:144,pending:88, rejected:12},standard:"AS 1554.1 / AS 3992",     due:"2026-04-15" },
  { id:"PRJ-003",name:"Gas Pipeline – Distribution",    client:"APA Group",      status:"On Track",progress:88,welds:{total:96, complete:84, pending:10, rejected:2 },standard:"ASME B31.3 / AS 4041",     due:"2026-03-31" },
  { id:"PRJ-004",name:"Defence Facility – Structural",  client:"Defence Housing",status:"Delayed",  progress:28,welds:{total:210,complete:59, pending:120,rejected:8 },standard:"AS 1554.1 SP",             due:"2026-06-01" },
];

export const NCR_DATA: NCR[] = [
  { id:"NCR-001",weldId:"W-002",project:"Pressure Vessel – Tank Farm B",  defect:"Undercut 0.8mm + Porosity",              status:"Open",       priority:"High",     raised:"2025-11-16",assignee:"J. Mitchell",capa:"Re-grind and re-weld. Submit repair WPS." },
  { id:"NCR-002",weldId:"W-025",project:"Gas Pipeline – Distribution",    defect:"Crack – surface breaking",               status:"In Progress",priority:"Critical", raised:"2026-01-12",assignee:"S. Wren",   capa:"Remove weld section. PWHT review." },
  { id:"NCR-003",weldId:"W-018",project:"Mining Conveyor Structure",      defect:"Spatter – client objection",             status:"Closed",     priority:"Low",      raised:"2025-12-03",assignee:"T. Barnes", capa:"Grind spatter, client accepted." },
  { id:"NCR-004",weldId:"W-047",project:"Defence Facility – Structural",  defect:"Incorrect WPS applied (WPS-006 expired)",status:"Open",       priority:"Critical", raised:"2026-02-01",assignee:"J. Mitchell",capa:"Stop work. Identify all affected welds." },
  { id:"NCR-005",weldId:"W-089",project:"Mining Conveyor Structure",      defect:"Fillet leg length undersized",           status:"In Progress",priority:"Medium",   raised:"2025-12-10",assignee:"T. Barnes", capa:"Deposit additional pass. Re-inspect." },
];

export const VT_REPORTS: VTReport[] = [
  { id:"VTR-001",jobNo:"JOB-2024-001",weldId:"W-001",project:"Pressure Vessel – Tank Farm B",  result:"PASS",       date:"2025-11-15",inspector:"John Mitchell",defects:[],                             standard:"ISO 5817 – Level B" },
  { id:"VTR-002",jobNo:"JOB-2024-001",weldId:"W-002",project:"Pressure Vessel – Tank Farm B",  result:"FAIL",       date:"2025-11-16",inspector:"Susan Wren",  defects:["Undercut 0.8mm","Porosity 2mm dia"], standard:"ISO 5817 – Level B" },
  { id:"VTR-003",jobNo:"JOB-2024-002",weldId:"W-015",project:"Mining Conveyor Structure",      result:"PASS",       date:"2025-12-01",inspector:"Tom Barnes",  defects:[],                             standard:"AS 1554.1 SP"       },
  { id:"VTR-004",jobNo:"JOB-2024-002",weldId:"W-018",project:"Mining Conveyor Structure",      result:"CONDITIONAL",date:"2025-12-03",inspector:"Tom Barnes",  defects:["Minor spatter"],              standard:"AS 1554.1 GP"       },
  { id:"VTR-005",jobNo:"JOB-2024-003",weldId:"W-022",project:"Gas Pipeline – Distribution",   result:"PASS",       date:"2026-01-10",inspector:"John Mitchell",defects:[],                             standard:"ASME B31.3"         },
  { id:"VTR-006",jobNo:"JOB-2024-003",weldId:"W-025",project:"Gas Pipeline – Distribution",   result:"FAIL",       date:"2026-01-12",inspector:"Susan Wren",  defects:["Crack detected – auto reject"],standard:"ASME B31.3"         },
];

export const ALERTS: Alert[] = [
  { id:1,type:"critical",msg:"WPS-006 expired — used on W-047 (PRJ-004). Immediate stop-work required.",    time:"2h ago" },
  { id:2,type:"warn",    msg:"Welder W-0028 (Robert Malik) qualification expired. Not permitted to weld.",  time:"1d ago" },
  { id:3,type:"warn",    msg:"WPS-005 review due 2026-03-22.",                                               time:"3d ago" },
  { id:4,type:"info",    msg:"3 inspections overdue on PRJ-002. ITP hold points uncleared.",                 time:"5d ago" },
  { id:5,type:"warn",    msg:"TC-003 thermocouple calibration expires 2026-04-15.",                          time:"2d ago" },
];

export const MAT_RAW: RawMaterial[] = [
  { id:"MAT-001",heatNo:"H-44721",  grade:"AS/NZS 3678-350",standard:"AS/NZS 3678",matGroup:"1.2",size:"12mm plate",supplier:"BlueScope Steel",        mtcStatus:"Uploaded",pmiStatus:"Pass",   location:"Workshop Bay 1",traceability:"Linked", linkedWelds:["W-001","W-002"],cev:0.43,supplier_cert:"MTC-MAT-001.pdf" },
  { id:"MAT-002",heatNo:"H-77820",  grade:"316/316L SS",      standard:"ASTM A240",  matGroup:"6.1",size:"8mm plate", supplier:"Atlas Specialty Metals", mtcStatus:"Uploaded",pmiStatus:"Pass",   location:"Workshop Bay 2",traceability:"Linked", linkedWelds:["W-022"],        cev:null,supplier_cert:"MTC-MAT-002.pdf" },
  { id:"MAT-003",heatNo:"H-12094",  grade:"4140 Alloy Steel", standard:"ASTM A108",  matGroup:"3.2",size:"45mm bar",  supplier:"OneSteel",               mtcStatus:"Uploaded",pmiStatus:"Pass",   location:"Yard – Rack C", traceability:"Linked", linkedWelds:["W-002"],        cev:0.72,supplier_cert:"MTC-MAT-003.pdf" },
  { id:"MAT-004",heatNo:"UNKNOWN",  grade:"AS/NZS 3678-250",  standard:"AS/NZS 3678",matGroup:"1.1",size:"10mm plate",supplier:"Unknown",                mtcStatus:"Missing", pmiStatus:"Pending",location:"Yard – Loose",  traceability:"Missing",linkedWelds:[],              cev:null,supplier_cert:null },
];

export const MAT_CONS: Consumable[] = [
  { id:"CONS-001",type:"Electrode",classification:"E7018",  manufacturer:"Lincoln Electric",batch:"LE-2024-4471",  location:"Oven A",          issueStatus:"In Use", expiry:"2026-12-31",rebakeStatus:"Baked 2026-01-10",issuedTo:"W-0047 / PRJ-001",wpsCompat:["WPS-001","WPS-003"] },
  { id:"CONS-002",type:"Wire",     classification:"ER316L", manufacturer:"ESAB",            batch:"ESAB-2025-0082",location:"Store – Shelf 3",  issueStatus:"In Stock",expiry:"2027-06-30",rebakeStatus:"N/A",            issuedTo:"—",                 wpsCompat:["WPS-002"]           },
  { id:"CONS-003",type:"Wire",     classification:"ER2209", manufacturer:"Bohler",          batch:"BH-2024-8812",  location:"Store – Shelf 4",  issueStatus:"In Use", expiry:"2027-01-15",rebakeStatus:"N/A",            issuedTo:"W-0052 / PRJ-001",  wpsCompat:["WPS-004"]           },
  { id:"CONS-004",type:"Wire",     classification:"ER70S-6",manufacturer:"Lincoln Electric",batch:"LE-2023-9901",  location:"Site",             issueStatus:"Expired",expiry:"2025-06-30",rebakeStatus:"N/A",            issuedTo:"—",                 wpsCompat:["WPS-006"]           },
];

export const NDT_DATA: NDTRecord[] = [
  { id:"NDT-001",weldId:"W-001",method:"MT",techName:"P. Chen",     techQual:"ISO 9712 L2 MT",result:"Pass",acceptStd:"ISO 17638",  date:"2025-11-22",defects:[],                                     repairRequired:false,ncrRef:null      },
  { id:"NDT-002",weldId:"W-002",method:"UT",techName:"K. Watanabe", techQual:"ISO 9712 L2 UT",result:"Fail",acceptStd:"AS 2207",    date:"2025-11-23",defects:["Planar discontinuity 6mm at 4mm depth"],repairRequired:true, ncrRef:"NCR-001" },
  { id:"NDT-003",weldId:"W-022",method:"RT",techName:"A. Petrova",  techQual:"ISO 9712 L2 RT",result:"Pass",acceptStd:"ASME B31.3",date:"2026-01-11",defects:[],                                     repairRequired:false,ncrRef:null      },
  { id:"NDT-004",weldId:"W-025",method:"PT",techName:"P. Chen",     techQual:"ISO 9712 L2 PT",result:"Fail",acceptStd:"ASME B31.3",date:"2026-01-12",defects:["Linear indication 18mm – surface crack"],repairRequired:true, ncrRef:"NCR-002" },
];

export const NDT_EQUIP: NDTEquipment[] = [
  { id:"EQ-MT-001",type:"MPI Yoke",          manufacturer:"Magnaflux",    model:"Y-7",     serial:"MF-77401",   calibDue:"2026-08-01",calibStatus:"Valid",   location:"Workshop" },
  { id:"EQ-UT-001",type:"UT Flaw Detector",  manufacturer:"GE Inspection",model:"USM 36",  serial:"GE-102984",  calibDue:"2026-06-15",calibStatus:"Valid",   location:"NDT Lab"  },
  { id:"EQ-RT-001",type:"X-Ray Unit",        manufacturer:"Yxlon",        model:"MG452",   serial:"YX-88210",   calibDue:"2026-04-01",calibStatus:"Valid",   location:"RT Bunker"},
  { id:"EQ-UT-002",type:"Phased Array UT",   manufacturer:"Eddyfi",       model:"Mantis",  serial:"ED-MA-1047", calibDue:"2025-12-01",calibStatus:"Expired", location:"Workshop" },
];

export const NDT_TECHS: NDTTechnician[] = [
  { id:"TECH-001",name:"P. Chen",     cert:"ISO 9712",methods:["MT","PT"],   level:"Level 2",certBody:"AINDT",employer:"Apex Fabrication",expiryDate:"2027-06-30",status:"Current"       },
  { id:"TECH-002",name:"K. Watanabe",cert:"ISO 9712",methods:["UT"],        level:"Level 2",certBody:"AINDT",employer:"NDT Solutions",   expiryDate:"2026-09-15",status:"Current"       },
  { id:"TECH-003",name:"A. Petrova", cert:"ISO 9712",methods:["RT","VT"],   level:"Level 2",certBody:"AINDT",employer:"NDT Solutions",   expiryDate:"2026-12-01",status:"Current"       },
  { id:"TECH-004",name:"S. Kumar",   cert:"ISO 9712",methods:["UT","MT"],   level:"Level 3",certBody:"ASNT",employer:"IndTech NDT",     expiryDate:"2026-02-28",status:"Expiring Soon"  },
];

export const HT_DATA: HeatTreatment[] = [
  { id:"HT-001",jobId:"PRJ-001",componentId:"COMP-A14",weldId:"W-001",material:"AS/NZS 3678-350",thickness:32,type:"PWHT",           standard:"AS 4458",          targetTemp:620,soakTime:90, actualStatus:"Pass",   technician:"R. Sharma",date:"2025-11-20",compliant:true  },
  { id:"HT-002",jobId:"PRJ-001",componentId:"COMP-B07",weldId:"W-002",material:"4140 Alloy Steel",thickness:45,type:"PWHT",           standard:"AS 4458",          targetTemp:650,soakTime:135,actualStatus:"Pending", technician:"R. Sharma",date:"2026-01-14",compliant:null  },
  { id:"HT-003",jobId:"PRJ-003",componentId:"COMP-P09",weldId:"W-022",material:"316/316L SS",     thickness:8, type:"Solution Anneal",standard:"ASME VIII Div.1",targetTemp:1050,soakTime:45,actualStatus:"Fail",    technician:"K. Lee",   date:"2026-01-10",compliant:false },
];

export const ITP_DATA: ITP[] = [
  {
    id:"ITP-001",projectId:"PRJ-001",itpNo:"ITP-PV-001",rev:"B",component:"Pressure Vessel Shell",standard:"AS 4041 / AS 3992",status:"Active",clientApproval:"Approved",
    steps:[
      { seq:1,activity:"Material Receiving & MTC Review",criteria:"Grade correct. MTC verified.",             method:"Document Review",       holdType:"H",status:"Completed",  signedInspector:"J.Mitchell",signedClient:"BHP-QA",date:"2025-10-01" },
      { seq:2,activity:"Fit-up & Joint Preparation",     criteria:"Gap ≤3mm, alignment ±1.5mm",             method:"Visual + Dimensional",  holdType:"W",status:"Completed",  signedInspector:"J.Mitchell",signedClient:"",      date:"2025-10-15" },
      { seq:3,activity:"Preheat Verification",           criteria:"Min 50°C for t>25mm",                    method:"Thermocouple",          holdType:"W",status:"Completed",  signedInspector:"J.Mitchell",signedClient:"",      date:"2025-11-01" },
      { seq:4,activity:"Post-weld VT Inspection",        criteria:"ISO 5817 Level B",                       method:"VT per ISO 17637",      holdType:"H",status:"Completed",  signedInspector:"J.Mitchell",signedClient:"BHP-QA",date:"2025-11-15" },
      { seq:5,activity:"PWHT",                           criteria:"620°C ±15°C. Soak 90 min.",              method:"Thermocouple Chart",    holdType:"W",status:"Completed",  signedInspector:"J.Mitchell",signedClient:"",      date:"2025-11-20" },
      { seq:6,activity:"NDT – MT",                       criteria:"No relevant indications. ISO 17638.",    method:"MT (Yoke)",             holdType:"H",status:"In Progress",signedInspector:"",          signedClient:"",      date:""           },
      { seq:7,activity:"Final Dimensional Inspection",   criteria:"All dims per drawing ±1mm.",             method:"Dimensional",           holdType:"H",status:"Pending",    signedInspector:"",          signedClient:"",      date:""           },
      { seq:8,activity:"Hydrotest",                      criteria:"1.5× design pressure. No leaks.",        method:"Hydrostatic",           holdType:"H",status:"Pending",    signedInspector:"",          signedClient:"",      date:""           },
    ],
  },
];

export const WELD_PASSPORTS: WeldPassport[] = [
  {
    id:"W-001",projectId:"PRJ-001",componentId:"COMP-A14",drawingNo:"DWG-0047-RevC",jointNo:"J-001",spoolNo:"SP-A14-01",
    weldType:"Butt Weld – Full Penetration",jointDesign:"Single-V groove 60°",size:"t12mm / D168.3",position:"PC (2G)",
    process:"111 – SMAW",dateWelded:"2025-11-10",welderId:"WQR-001",welderName:"James Kowalski",stampNo:"W-0047",
    qualRef:"CERT-001-A",qualValid:true,coordinator:"J. Mitchell",inspector:"John Mitchell",
    wpsId:"WPS-001",wpsRev:"B",pqrRef:"PQR-001",standard:"ISO 15614-1 / AS 4041",matGroup:"1.2",
    thicknessOk:true,processOk:true,consumableOk:true,matId:"MAT-001",heatNo:"H-44721",
    matCertRef:"MTC-MAT-001.pdf",pmiStatus:"Pass",consumableId:"CONS-001",consumableBatch:"LE-2024-4471",weldingGas:"N/A",
    fitupStatus:"Pass",inprocessStatus:"Pass",vtResult:"PASS",vtDate:"2025-11-15",vtInspector:"John Mitchell",
    ndtResults:[{method:"MT",result:"Pass",date:"2025-11-22",tech:"P. Chen"}],
    htRef:"HT-001",htType:"PWHT",htResult:"Pass",dimensionalResult:"Pass",pressureTestResult:"Pending",
    repairCount:0,repairs:[],ncrRefs:[],finalStatus:"Accepted",overallStatus:"Accepted",
    timeline:[
      {event:"Created",         date:"2025-11-08",by:"J. Mitchell",note:"Weld record created in WQMS"},
      {event:"Fit-up Inspected",date:"2025-11-09",by:"J. Mitchell",note:"Joint prep approved"},
      {event:"Welded",          date:"2025-11-10",by:"W-0047",     note:"Welded PA/PC. Interpass checked."},
      {event:"VT Inspected",    date:"2025-11-15",by:"John Mitchell",note:"PASS – ISO 5817 Level B"},
      {event:"PWHT",            date:"2025-11-20",by:"R. Sharma",  note:"620°C / 90 min – COMPLIANT"},
      {event:"NDT – MT",        date:"2025-11-22",by:"P. Chen",    note:"PASS – no relevant indications"},
      {event:"Accepted",        date:"2025-11-24",by:"J. Mitchell",note:"All hold points cleared. Released for MDR."},
    ],
    attachments:["VT-Report-W001.pdf","HT-RPT-001.pdf","NDT-RPT-001.pdf"],
  },
  {
    id:"W-002",projectId:"PRJ-001",componentId:"COMP-A14",drawingNo:"DWG-0047-RevC",jointNo:"J-002",spoolNo:"SP-A14-01",
    weldType:"Butt Weld – Full Penetration",jointDesign:"Single-V groove 60°",size:"t12mm / D168.3",position:"PF (3G)",
    process:"111 – SMAW",dateWelded:"2025-11-11",welderId:"WQR-001",welderName:"James Kowalski",stampNo:"W-0047",
    qualRef:"CERT-001-A",qualValid:true,coordinator:"J. Mitchell",inspector:"Susan Wren",
    wpsId:"WPS-001",wpsRev:"B",pqrRef:"PQR-001",standard:"ISO 15614-1 / AS 4041",matGroup:"1.2",
    thicknessOk:true,processOk:true,consumableOk:true,matId:"MAT-001",heatNo:"H-44721",
    matCertRef:"MTC-MAT-001.pdf",pmiStatus:"Pass",consumableId:"CONS-001",consumableBatch:"LE-2024-4471",weldingGas:"N/A",
    fitupStatus:"Pass",inprocessStatus:"Pass",vtResult:"FAIL",vtDate:"2025-11-16",vtInspector:"Susan Wren",
    ndtResults:[{method:"UT",result:"Fail",date:"2025-11-23",tech:"K. Watanabe",note:"Planar discontinuity 6mm"}],
    htRef:"HT-002",htType:"PWHT",htResult:"Pending",dimensionalResult:"Pending",pressureTestResult:"Pending",
    repairCount:1,
    repairs:[{repairNo:1,date:"2025-11-28",by:"W-0047",desc:"Excavate and re-weld undercut zone. Repair WPS-001 applied."}],
    ncrRefs:["NCR-001"],finalStatus:"Under Repair",overallStatus:"NCR Open",
    timeline:[
      {event:"Created",          date:"2025-11-09",by:"J. Mitchell",note:"Weld record created"},
      {event:"Welded",           date:"2025-11-11",by:"W-0047",     note:"Welded PF."},
      {event:"VT – FAIL",        date:"2025-11-16",by:"Susan Wren", note:"FAIL – undercut 0.8mm + porosity"},
      {event:"NCR Raised",       date:"2025-11-16",by:"Susan Wren", note:"NCR-001 raised"},
      {event:"Repair Commenced", date:"2025-11-28",by:"W-0047",     note:"Excavation and repair in progress"},
    ],
    attachments:["VT-Report-W002-FAIL.pdf","NCR-001.pdf","NDT-RPT-002.pdf"],
  },
  {
    id:"W-022",projectId:"PRJ-003",componentId:"COMP-P09",drawingNo:"DWG-0088-RevA",jointNo:"J-022",spoolNo:"SP-P09-03",
    weldType:"Butt Weld – Full Penetration",jointDesign:"Single-V groove 70°",size:"t8mm / D88.9",position:"PF (3G)",
    process:"141/131 – TIG/MIG",dateWelded:"2026-01-08",welderId:"WQR-002",welderName:"Maria Santos",stampNo:"W-0052",
    qualRef:"CERT-002-A",qualValid:true,coordinator:"S. Wren",inspector:"John Mitchell",
    wpsId:"WPS-002",wpsRev:"A",pqrRef:"PQR-002",standard:"ISO 15614-1 / ASME B31.3",matGroup:"6.1",
    thicknessOk:true,processOk:true,consumableOk:true,matId:"MAT-002",heatNo:"H-77820",
    matCertRef:"MTC-MAT-002.pdf",pmiStatus:"Pass",consumableId:"CONS-002",consumableBatch:"ESAB-2025-0082",weldingGas:"Ar 99.99%",
    fitupStatus:"Pass",inprocessStatus:"Pass",vtResult:"PASS",vtDate:"2026-01-10",vtInspector:"John Mitchell",
    ndtResults:[{method:"RT",result:"Pass",date:"2026-01-11",tech:"A. Petrova"}],
    htRef:"HT-003",htType:"Solution Anneal",htResult:"Fail",dimensionalResult:"Pass",pressureTestResult:"Pending",
    repairCount:0,repairs:[],ncrRefs:[],finalStatus:"HT Non-Conformance",overallStatus:"Conditional",
    timeline:[
      {event:"Created",              date:"2026-01-06",by:"S. Wren",     note:"Weld record created"},
      {event:"Welded",               date:"2026-01-08",by:"W-0052",      note:"TIG root, MIG fill. Purge gas used."},
      {event:"VT Inspected",         date:"2026-01-10",by:"John Mitchell",note:"PASS – ISO 5817 Level B"},
      {event:"RT",                   date:"2026-01-11",by:"A. Petrova",  note:"PASS – no relevant indications"},
      {event:"Solution Anneal – FAIL",date:"2026-01-10",by:"K. Lee",     note:"TC1 overshot 1082°C. Repeat required."},
    ],
    attachments:["VT-Report-W022.pdf","NDT-RPT-004.pdf","HT-RPT-004.pdf"],
  },
  {
    id:"W-025",projectId:"PRJ-003",componentId:"COMP-P11",drawingNo:"DWG-0088-RevA",jointNo:"J-025",spoolNo:"SP-P11-01",
    weldType:"Butt Weld – Full Penetration",jointDesign:"Double-V groove",size:"t10mm / D114.3",position:"H-L045 (5G)",
    process:"141/131 – TIG/MIG",dateWelded:"2026-01-10",welderId:"WQR-002",welderName:"Maria Santos",stampNo:"W-0052",
    qualRef:"CERT-002-A",qualValid:true,coordinator:"S. Wren",inspector:"Susan Wren",
    wpsId:"WPS-002",wpsRev:"A",pqrRef:"PQR-002",standard:"ISO 15614-1 / ASME B31.3",matGroup:"6.1",
    thicknessOk:true,processOk:true,consumableOk:true,matId:"MAT-002",heatNo:"H-77820",
    matCertRef:"MTC-MAT-002.pdf",pmiStatus:"Pass",consumableId:"CONS-002",consumableBatch:"ESAB-2025-0082",weldingGas:"Ar 99.99%",
    fitupStatus:"Pass",inprocessStatus:"Pass",vtResult:"FAIL",vtDate:"2026-01-12",vtInspector:"Susan Wren",
    ndtResults:[{method:"PT",result:"Fail",date:"2026-01-12",tech:"P. Chen",note:"Linear indication 18mm – surface crack"}],
    htRef:null,htType:null,htResult:null,dimensionalResult:"Pending",pressureTestResult:"Pending",
    repairCount:0,repairs:[],ncrRefs:["NCR-002"],finalStatus:"Rejected – Crack",overallStatus:"Rejected",
    timeline:[
      {event:"Created",   date:"2026-01-09",by:"S. Wren",    note:"Weld record created"},
      {event:"Welded",    date:"2026-01-10",by:"W-0052",     note:"TIG root, MIG fill."},
      {event:"VT – FAIL", date:"2026-01-12",by:"Susan Wren", note:"FAIL – crack detected"},
      {event:"NCR Raised",date:"2026-01-12",by:"Susan Wren", note:"NCR-002 raised. Critical."},
    ],
    attachments:["VT-Report-W025-FAIL.pdf","NCR-002.pdf","NDT-RPT-005.pdf"],
  },
];

export const WELD_MAP_NODES: WeldMapNode[] = [
  {id:"W-001",x:18,y:25,status:"Accepted",       weldType:"Butt",  process:"111",welder:"W-0047"},
  {id:"W-002",x:35,y:25,status:"NCR Open",       weldType:"Butt",  process:"111",welder:"W-0047"},
  {id:"W-003",x:52,y:25,status:"Accepted",       weldType:"Butt",  process:"111",welder:"W-0039"},
  {id:"W-004",x:70,y:25,status:"Pending VT",     weldType:"Butt",  process:"141",welder:"W-0052"},
  {id:"W-005",x:18,y:50,status:"Welded",         weldType:"Fillet",process:"135",welder:"W-0061"},
  {id:"W-006",x:35,y:50,status:"Pending NDT",    weldType:"Butt",  process:"111",welder:"W-0047"},
  {id:"W-007",x:52,y:50,status:"Accepted",       weldType:"Fillet",process:"135",welder:"W-0061"},
  {id:"W-008",x:70,y:50,status:"Repair Required",weldType:"Butt",  process:"111",welder:"W-0039"},
  {id:"W-009",x:18,y:75,status:"Not Started",    weldType:"Butt",  process:"111",welder:"—"},
  {id:"W-010",x:35,y:75,status:"Fit-up Complete",weldType:"Fillet",process:"135",welder:"W-0061"},
  {id:"W-011",x:52,y:75,status:"Accepted",       weldType:"Butt",  process:"111",welder:"W-0047"},
  {id:"W-012",x:70,y:75,status:"Pending VT",     weldType:"Butt",  process:"141",welder:"W-0052"},
];

export const READINESS_CHECKS: Record<string, ReadinessCategory> = {
  "PRJ-001": {
    documents:[
      {item:"Latest drawing revision (RevC)",       status:"pass",note:"DWG-0047-RevC issued 2025-10-01"},
      {item:"Approved WPS available (WPS-001)",     status:"pass",note:"WPS-001 Rev B – Active"},
      {item:"ITP approved by client",               status:"pass",note:"ITP-PV-001 Rev B – BHP approved"},
      {item:"Client specification loaded",          status:"pass",note:"BHP-SPEC-WLD-001 loaded"},
      {item:"Relevant procedures current",          status:"pass",note:"AS 4041, AS 3992 procedures current"},
    ],
    personnel:[
      {item:"Assigned welder (W-0047) qualified for process 111",status:"pass",note:"ISO 9606-1 CERT-001-A – valid to 2026-04-10"},
      {item:"Welder continuity valid",              status:"pass",note:"Last activity 2025-11-20"},
      {item:"Inspector assigned",                   status:"pass",note:"John Mitchell – CSWIP 3.1"},
      {item:"NDT technician qualified (MT)",        status:"pass",note:"P. Chen – ISO 9712 L2 MT"},
    ],
    materials:[
      {item:"Material received (MAT-001)",          status:"pass",note:"AS/NZS 3678-350 t12mm – in Workshop Bay 1"},
      {item:"Heat number recorded",                 status:"pass",note:"H-44721"},
      {item:"MTC uploaded",                         status:"pass",note:"MTC-MAT-001.pdf uploaded"},
      {item:"PMI complete",                         status:"pass",note:"PMI result: PASS"},
      {item:"Material linked to weld map",          status:"pass",note:"Linked to W-001 through W-012"},
    ],
    consumables:[
      {item:"Correct consumable available (E7018)", status:"pass",note:"CONS-001 – LE-2024-4471 in Oven A"},
      {item:"Batch traceability recorded",          status:"pass",note:"Batch LE-2024-4471 on file"},
      {item:"Consumable not expired",               status:"pass",note:"Expiry 2026-12-31"},
      {item:"Storage conditions acceptable",        status:"pass",note:"Oven A – 120°C confirmed"},
      {item:"Re-bake status valid",                 status:"pass",note:"Baked 2026-01-10"},
    ],
    equipment:[
      {item:"Welding machine assigned (M-007)",               status:"pass",note:"Lincoln Invertec V350 – calibrated"},
      {item:"NDT equipment calibration current (EQ-MT-001)",  status:"pass",note:"MPI Yoke – valid to 2026-08-01"},
      {item:"Heat treatment equipment available",             status:"pass",note:"Furnace HT-2 – available"},
      {item:"Measuring equipment current",                    status:"pass",note:"Vernier + digital gauges – calibrated"},
    ],
    process:[
      {item:"WPS matches material and thickness",  status:"pass",note:"WPS-001: Group 1.2, t3–40mm – MATCH"},
      {item:"Welder qualified for position (PC/PF)",status:"pass",note:"CERT-001-A covers PA/PC/PF"},
      {item:"Preheat requirement defined",         status:"pass",note:"Min 50°C for t>25mm – per WPS-001"},
      {item:"PWHT requirement defined",            status:"pass",note:"620°C / 90 min – per AS 4458"},
      {item:"Hold points configured in ITP",       status:"pass",note:"8 hold/witness points in ITP-PV-001"},
      {item:"Inspection sequence approved",        status:"pass",note:"ITP-PV-001 client approved"},
    ],
  },
  "PRJ-004": {
    documents:[
      {item:"Latest drawing revision issued",      status:"pass",note:"DWG-DEF-001-RevA issued"},
      {item:"Approved WPS available",              status:"fail",note:"WPS-006 EXPIRED 2025-05-01 – must be renewed or alternate applied"},
      {item:"ITP approved by client",              status:"warn",note:"ITP draft submitted, awaiting client approval"},
      {item:"Client specification loaded",         status:"pass",note:"DEF-SPEC-001 loaded"},
      {item:"Relevant procedures current",         status:"pass",note:"AS 1554.1 SP current"},
    ],
    personnel:[
      {item:"Assigned welder (W-0039) qualified",  status:"warn",note:"Expiring Soon – expires 2026-06-01 (63 days)"},
      {item:"Welder continuity valid",             status:"pass",note:"Last activity 2025-09-30"},
      {item:"Inspector assigned",                  status:"pass",note:"Tom Barnes – CSWIP 3.1"},
      {item:"NDT technician qualified",            status:"warn",note:"S. Kumar – Expiring Soon (2026-02-28)"},
    ],
    materials:[
      {item:"Material received",                   status:"fail",note:"MAT-004 heat number UNKNOWN – not traced"},
      {item:"Heat number recorded",                status:"fail",note:"Missing – MAT-004 unidentified"},
      {item:"MTC uploaded",                        status:"fail",note:"No MTC on file for MAT-004"},
      {item:"PMI complete",                        status:"warn",note:"PMI pending for MAT-004"},
      {item:"Material linked to weld map",         status:"warn",note:"W-047 material link incomplete"},
    ],
    consumables:[
      {item:"Correct consumable (ER70S-6)",        status:"fail",note:"CONS-004 EXPIRED 2025-06-30 – remove from site"},
      {item:"Batch traceability recorded",         status:"pass",note:"Batch LE-2023-9901 on file"},
      {item:"Consumable not expired",              status:"fail",note:"EXPIRED – must be replaced"},
      {item:"Storage conditions acceptable",       status:"pass",note:"Stored correctly"},
      {item:"Re-bake status",                      status:"pass",note:"N/A (solid wire)"},
    ],
    equipment:[
      {item:"Welding machine assigned",            status:"pass",note:"Miller Dynasty 350 – assigned"},
      {item:"NDT equipment calibration current",   status:"fail",note:"EQ-UT-002 (PAUT) EXPIRED 2025-12-01 – cannot use"},
      {item:"Heat treatment equipment",            status:"pass",note:"N/A for this weld type"},
      {item:"Measuring equipment current",         status:"pass",note:"Calibrated gauges available"},
    ],
    process:[
      {item:"WPS matches material and thickness",  status:"fail",note:"WPS-006 EXPIRED – critical blocker"},
      {item:"Welder qualified for position",       status:"pass",note:"W-0039 covers PA – position matches"},
      {item:"Preheat defined",                     status:"pass",note:"Per AS/NZS 1554"},
      {item:"PWHT defined",                        status:"pass",note:"Not required for t16mm carbon steel"},
      {item:"Hold points configured",              status:"warn",note:"ITP not yet approved – hold points tentative"},
      {item:"Inspection sequence approved",        status:"warn",note:"Client approval pending"},
    ],
  },
};

export const MDR_PACKAGES: MDRPackage[] = [
  { id:"MDR-001",projectId:"PRJ-001",title:"Pressure Vessel Tank Farm B – MDR Package A",rev:"B",status:"For Review",completeness:87,client:"BHP Minerals", issueDate:"2026-02-15",sections:["title_page","document_index","project_summary","drawings","material_traceability","wps_pqr","welder_quals","inspection_records","ndt_records","heat_treatment","ncr_summary","release_cert"],missing:["Hydrotest result","Final dimensional report"],createdBy:"J. Mitchell" },
  { id:"MDR-002",projectId:"PRJ-003",title:"Gas Pipeline Distribution – MDR Full Package",rev:"A",status:"Draft",        completeness:62,client:"APA Group",  issueDate:null,         sections:["title_page","document_index","project_summary","material_traceability","wps_pqr","welder_quals","inspection_records","ndt_records"],                                                                         missing:["Heat treatment repeat result","NCR-002 closure","ITP final sign-off","Release cert"],createdBy:"S. Wren" },
];
