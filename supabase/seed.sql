-- ============================================================
-- WQMS Pro — Seed Data
-- Run AFTER schema.sql
-- Supabase → SQL Editor → New Query → Paste → Run
-- ============================================================

-- Projects
INSERT INTO projects (id,name,client,status,progress,welds_total,welds_complete,welds_pending,welds_rejected,standard,due) VALUES
('PRJ-001','Pressure Vessel – Tank Farm B','BHP Minerals','On Track',72,144,103,28,4,'AS 4041 / AS 3992','2026-05-30'),
('PRJ-002','Mining Conveyor Structure','Rio Tinto','At Risk',45,320,144,88,12,'AS 1554.1 / AS 3992','2026-04-15'),
('PRJ-003','Gas Pipeline – Distribution','APA Group','On Track',88,96,84,10,2,'ASME B31.3 / AS 4041','2026-03-31'),
('PRJ-004','Defence Facility – Structural','Defence Housing','Delayed',28,210,59,120,8,'AS 1554.1 SP','2026-06-01')
ON CONFLICT (id) DO NOTHING;

-- WPS
INSERT INTO wps (id,rev,title,standard,processes,material_groups,pqr_ref,positions,thickness_range,heat_input,preheat,interpass,consumable,shielding_gas,approved_by,approval_date,status) VALUES
('WPS-001','B','Carbon Steel Butt – SMAW','ISO 15614-1',ARRAY['111'],ARRAY['1.1','1.2'],'PQR-001',ARRAY['PA','PC','PF'],'3–40 mm','0.8–2.5 kJ/mm','Min 50°C','Max 250°C','E7016/E7018','N/A','J. Mitchell','2023-06-15','Active'),
('WPS-002','A','316L Stainless – TIG/MIG','ISO 15614-1',ARRAY['141','131'],ARRAY['6.1','6.2'],'PQR-002',ARRAY['PA','PF','H-L045'],'2–30 mm','0.3–1.5 kJ/mm','None','Max 150°C','ER316L','Ar 99.99%','S. Wren','2023-09-01','Active'),
('WPS-003','C','P1 Carbon Steel – SAW','ASME IX',ARRAY['121'],ARRAY['P1'],'PQR-003',ARRAY['PA'],'10–75 mm','2.0–5.0 kJ/mm','Min 10°C','Max 300°C','F7A2-EM12K','Flux OK10.71','T. Barnes','2022-11-20','Active'),
('WPS-004','A','Duplex 2205 – TIG/MAG','ISO 15614-1',ARRAY['141','135'],ARRAY['7.1'],'PQR-004',ARRAY['PA','PC'],'3–25 mm','0.5–2.0 kJ/mm','None','Max 100°C','ER2209','Ar+2%N₂','J. Mitchell','2024-01-10','Active'),
('WPS-005','A','P8 Austenitic SS – SMAW','ASME IX',ARRAY['111'],ARRAY['P8'],'PQR-005',ARRAY['PA','PC','PF','PG'],'3–38 mm','0.5–2.0 kJ/mm','None','Max 175°C','E308L-16','N/A','S. Wren','2023-03-22','Pending Review'),
('WPS-006','B','AS 3992 Gr1 – MAG Fillet','AS 3992',ARRAY['135'],ARRAY['AS-1','AS-2'],'PQR-006',ARRAY['PA','PB','PD','PF'],'4–50 mm','0.5–3.0 kJ/mm','Per AS/NZS 1554','Max 250°C','ER70S-6','Ar+15%CO₂','T. Barnes','2022-05-01','Expired')
ON CONFLICT (id) DO NOTHING;

-- PQR
INSERT INTO pqr (id,wps_ref,test_date,test_lab,standard,result,tests) VALUES
('PQR-001','WPS-001','2023-05-20','ALS Industrial','ISO 15614-1','Pass',ARRAY['Tensile','Bend','Hardness','Macro']),
('PQR-002','WPS-002','2023-08-10','Bureau Veritas','ISO 15614-1','Pass',ARRAY['Tensile','Bend','Corrosion','Ferrite','Macro']),
('PQR-003','WPS-003','2022-10-05','Lloyd''s Register','ASME IX','Pass',ARRAY['Tensile','Bend','CVN Impact','Hardness']),
('PQR-004','WPS-004','2023-12-01','DNV GL','ISO 15614-1','Pass',ARRAY['Tensile','Bend','Ferrite','Corrosion','Macro']),
('PQR-005','WPS-005','2023-02-14','ALS Industrial','ASME IX','Pass',ARRAY['Tensile','Bend','Delta Ferrite']),
('PQR-006','WPS-006','2022-04-10','Bureau Veritas','AS 3992','Pass',ARRAY['Tensile','Bend','Macro'])
ON CONFLICT (id) DO NOTHING;

-- Welders
INSERT INTO welders (id,stamp_no,first_name,last_name,employer,trade,status) VALUES
('WQR-001','W-0047','James','Kowalski','Apex Fabrication','Boilermaker/Welder','Current'),
('WQR-002','W-0052','Maria','Santos','Apex Fabrication','Welder','Current'),
('WQR-003','W-0039','David','Nguyen','Steel Masters','Boilermaker','Expiring Soon'),
('WQR-004','W-0061','Sarah','Thompson','Apex Fabrication','Welder','Current'),
('WQR-005','W-0028','Robert','Malik','Steel Masters','Boilermaker/Welder','Expired')
ON CONFLICT (id) DO NOTHING;

-- Welder Qualifications
INSERT INTO welder_qualifications (id,welder_id,standard,process,material_group,joint_type,positions,thickness_range,test_date,expiry_date,test_piece,result,test_lab,wps_used,cert_no,continuity_ok,last_activity) VALUES
('Q-001-A','WQR-001','ISO 9606-1','111','1.1','Butt Weld',ARRAY['PA','PC','PF'],'3–40 mm','2023-04-10','2026-04-10','BW–t12–D>–PA/PC/PF','Pass','ALS Industrial','WPS-001','CERT-001-A',TRUE,'2025-11-20'),
('Q-001-B','WQR-001','ISO 9606-1','141','6.1','Butt Weld',ARRAY['PA','PF'],'2–20 mm','2022-09-15','2025-09-15','BW–t6','Pass','Bureau Veritas','WPS-002','CERT-001-B',FALSE,'2024-08-01'),
('Q-002-A','WQR-002','ISO 9606-1','141','6.1','Butt Weld',ARRAY['PA','PC','PF','H-L045'],'2–30 mm','2024-01-20','2027-01-20','BW–t8','Pass','DNV GL','WPS-002','CERT-002-A',TRUE,'2025-12-05'),
('Q-002-B','WQR-002','ISO 9606-1','135','7.1','Butt Weld',ARRAY['PA','PC'],'3–25 mm','2024-03-05','2027-03-05','BW–t10','Pass','Bureau Veritas','WPS-004','CERT-002-B',TRUE,'2025-10-18'),
('Q-003-A','WQR-003','ASME IX (QW-300)','111','P1','Butt Weld',ARRAY['PA','PC','PF','PG'],'3–38 mm','2023-06-01','2026-06-01','BW–t10–6G','Pass','Lloyd''s Register','WPS-001','CERT-003-A',TRUE,'2025-09-30'),
('Q-004-A','WQR-004','ISO 9606-1','135','1.1','Fillet Weld',ARRAY['PA','PB','PD','PF'],'4–50 mm','2024-06-10','2027-06-10','FW–t10','Pass','Bureau Veritas','WPS-006','CERT-004-A',TRUE,'2025-12-01'),
('Q-005-A','WQR-005','ISO 9606-1','111','1.2','Butt Weld',ARRAY['PA','PC','PF'],'3–40 mm','2020-03-01','2023-03-01','BW–t12','Pass','ALS Industrial','WPS-001','CERT-005-A',FALSE,'2022-11-01')
ON CONFLICT (id) DO NOTHING;

-- Materials
INSERT INTO materials (id,heat_no,grade,standard,mat_group,size,supplier,mtc_status,pmi_status,location,traceability,linked_welds,cev,supplier_cert) VALUES
('MAT-001','H-44721','AS/NZS 3678-350','AS/NZS 3678','1.2','12mm plate','BlueScope Steel','Uploaded','Pass','Workshop Bay 1','Linked',ARRAY['W-001','W-002'],0.43,'MTC-MAT-001.pdf'),
('MAT-002','H-77820','316/316L SS','ASTM A240','6.1','8mm plate','Atlas Specialty Metals','Uploaded','Pass','Workshop Bay 2','Linked',ARRAY['W-022'],NULL,'MTC-MAT-002.pdf'),
('MAT-003','H-12094','4140 Alloy Steel','ASTM A108','3.2','45mm bar','OneSteel','Uploaded','Pass','Yard – Rack C','Linked',ARRAY['W-002'],0.72,'MTC-MAT-003.pdf'),
('MAT-004','UNKNOWN','AS/NZS 3678-250','AS/NZS 3678','1.1','10mm plate','Unknown','Missing','Pending','Yard – Loose','Missing',ARRAY[]::TEXT[],NULL,NULL)
ON CONFLICT (id) DO NOTHING;

-- Consumables
INSERT INTO consumables (id,type,classification,manufacturer,batch,location,issue_status,expiry,rebake_status,issued_to,wps_compat) VALUES
('CONS-001','Electrode','E7018','Lincoln Electric','LE-2024-4471','Oven A','In Use','2026-12-31','Baked 2026-01-10','W-0047 / PRJ-001',ARRAY['WPS-001','WPS-003']),
('CONS-002','Wire','ER316L','ESAB','ESAB-2025-0082','Store – Shelf 3','In Stock','2027-06-30','N/A','—',ARRAY['WPS-002']),
('CONS-003','Wire','ER2209','Bohler','BH-2024-8812','Store – Shelf 4','In Use','2027-01-15','N/A','W-0052 / PRJ-001',ARRAY['WPS-004']),
('CONS-004','Wire','ER70S-6','Lincoln Electric','LE-2023-9901','Site','Expired','2025-06-30','N/A','—',ARRAY['WPS-006'])
ON CONFLICT (id) DO NOTHING;

-- NCR
INSERT INTO ncrs (id,weld_id,project,project_id,defect,status,priority,raised,assignee,capa) VALUES
('NCR-001','W-002','Pressure Vessel – Tank Farm B','PRJ-001','Undercut 0.8mm + Porosity','Open','High','2025-11-16','J. Mitchell','Re-grind and re-weld. Submit repair WPS.'),
('NCR-002','W-025','Gas Pipeline – Distribution','PRJ-003','Crack – surface breaking','In Progress','Critical','2026-01-12','S. Wren','Remove weld section. PWHT review.'),
('NCR-003','W-018','Mining Conveyor Structure','PRJ-002','Spatter – client objection','Closed','Low','2025-12-03','T. Barnes','Grind spatter, client accepted.'),
('NCR-004','W-047','Defence Facility – Structural','PRJ-004','Incorrect WPS applied (WPS-006 expired)','Open','Critical','2026-02-01','J. Mitchell','Stop work. Identify all affected welds.'),
('NCR-005','W-089','Mining Conveyor Structure','PRJ-002','Fillet leg length undersized','In Progress','Medium','2025-12-10','T. Barnes','Deposit additional pass. Re-inspect.')
ON CONFLICT (id) DO NOTHING;

-- VT Reports
INSERT INTO vt_reports (id,job_no,weld_id,project,result,date,inspector,defects,standard) VALUES
('VTR-001','JOB-2024-001','W-001','Pressure Vessel – Tank Farm B','PASS','2025-11-15','John Mitchell',ARRAY[]::TEXT[],'ISO 5817 – Level B'),
('VTR-002','JOB-2024-001','W-002','Pressure Vessel – Tank Farm B','FAIL','2025-11-16','Susan Wren',ARRAY['Undercut 0.8mm','Porosity 2mm dia'],'ISO 5817 – Level B'),
('VTR-003','JOB-2024-002','W-015','Mining Conveyor Structure','PASS','2025-12-01','Tom Barnes',ARRAY[]::TEXT[],'AS 1554.1 SP'),
('VTR-004','JOB-2024-002','W-018','Mining Conveyor Structure','CONDITIONAL','2025-12-03','Tom Barnes',ARRAY['Minor spatter'],'AS 1554.1 GP'),
('VTR-005','JOB-2024-003','W-022','Gas Pipeline – Distribution','PASS','2026-01-10','John Mitchell',ARRAY[]::TEXT[],'ASME B31.3'),
('VTR-006','JOB-2024-003','W-025','Gas Pipeline – Distribution','FAIL','2026-01-12','Susan Wren',ARRAY['Crack detected – auto reject'],'ASME B31.3')
ON CONFLICT (id) DO NOTHING;

-- NDT Records
INSERT INTO ndt_records (id,weld_id,method,tech_name,tech_qual,result,accept_std,date,defects,repair_required,ncr_ref) VALUES
('NDT-001','W-001','MT','P. Chen','ISO 9712 L2 MT','Pass','ISO 17638','2025-11-22',ARRAY[]::TEXT[],FALSE,NULL),
('NDT-002','W-002','UT','K. Watanabe','ISO 9712 L2 UT','Fail','AS 2207','2025-11-23',ARRAY['Planar discontinuity 6mm at 4mm depth'],TRUE,'NCR-001'),
('NDT-003','W-022','RT','A. Petrova','ISO 9712 L2 RT','Pass','ASME B31.3','2026-01-11',ARRAY[]::TEXT[],FALSE,NULL),
('NDT-004','W-025','PT','P. Chen','ISO 9712 L2 PT','Fail','ASME B31.3','2026-01-12',ARRAY['Linear indication 18mm – surface crack'],TRUE,'NCR-002')
ON CONFLICT (id) DO NOTHING;

-- NDT Equipment
INSERT INTO ndt_equipment (id,type,manufacturer,model,serial,calib_due,calib_status,location) VALUES
('EQ-MT-001','MPI Yoke','Magnaflux','Y-7','MF-77401','2026-08-01','Valid','Workshop'),
('EQ-UT-001','UT Flaw Detector','GE Inspection','USM 36','GE-102984','2026-06-15','Valid','NDT Lab'),
('EQ-RT-001','X-Ray Unit','Yxlon','MG452','YX-88210','2026-04-01','Valid','RT Bunker'),
('EQ-UT-002','Phased Array UT','Eddyfi','Mantis','ED-MA-1047','2025-12-01','Expired','Workshop')
ON CONFLICT (id) DO NOTHING;

-- NDT Technicians
INSERT INTO ndt_technicians (id,name,cert,methods,level,cert_body,employer,expiry_date,status) VALUES
('TECH-001','P. Chen','ISO 9712',ARRAY['MT','PT'],'Level 2','AINDT','Apex Fabrication','2027-06-30','Current'),
('TECH-002','K. Watanabe','ISO 9712',ARRAY['UT'],'Level 2','AINDT','NDT Solutions','2026-09-15','Current'),
('TECH-003','A. Petrova','ISO 9712',ARRAY['RT','VT'],'Level 2','AINDT','NDT Solutions','2026-12-01','Current'),
('TECH-004','S. Kumar','ISO 9712',ARRAY['UT','MT'],'Level 3','ASNT','IndTech NDT','2026-02-28','Expiring Soon')
ON CONFLICT (id) DO NOTHING;

-- Heat Treatment
INSERT INTO heat_treatments (id,job_id,component_id,weld_id,material,thickness,type,standard,target_temp,soak_time,actual_status,technician,date,compliant) VALUES
('HT-001','PRJ-001','COMP-A14','W-001','AS/NZS 3678-350',32,'PWHT','AS 4458',620,90,'Pass','R. Sharma','2025-11-20',TRUE),
('HT-002','PRJ-001','COMP-B07','W-002','4140 Alloy Steel',45,'PWHT','AS 4458',650,135,'Pending','R. Sharma','2026-01-14',NULL),
('HT-003','PRJ-003','COMP-P09','W-022','316/316L SS',8,'Solution Anneal','ASME VIII Div.1',1050,45,'Fail','K. Lee','2026-01-10',FALSE)
ON CONFLICT (id) DO NOTHING;

-- ITP
INSERT INTO itp (id,project_id,itp_no,rev,component,standard,status,client_approval) VALUES
('ITP-001','PRJ-001','ITP-PV-001','B','Pressure Vessel Shell','AS 4041 / AS 3992','Active','Approved')
ON CONFLICT (id) DO NOTHING;

INSERT INTO itp_steps (itp_id,seq,activity,criteria,method,hold_type,status,signed_inspector,signed_client,date) VALUES
('ITP-001',1,'Material Receiving & MTC Review','Grade correct. MTC verified.','Document Review','H','Completed','J.Mitchell','BHP-QA','2025-10-01'),
('ITP-001',2,'Fit-up & Joint Preparation','Gap ≤3mm, alignment ±1.5mm','Visual + Dimensional','W','Completed','J.Mitchell','','2025-10-15'),
('ITP-001',3,'Preheat Verification','Min 50°C for t>25mm','Thermocouple','W','Completed','J.Mitchell','','2025-11-01'),
('ITP-001',4,'Post-weld VT Inspection','ISO 5817 Level B','VT per ISO 17637','H','Completed','J.Mitchell','BHP-QA','2025-11-15'),
('ITP-001',5,'PWHT','620°C ±15°C. Soak 90 min.','Thermocouple Chart','W','Completed','J.Mitchell','','2025-11-20'),
('ITP-001',6,'NDT – MT','No relevant indications. ISO 17638.','MT (Yoke)','H','In Progress','','',''),
('ITP-001',7,'Final Dimensional Inspection','All dims per drawing ±1mm.','Dimensional','H','Pending','','',''),
('ITP-001',8,'Hydrotest','1.5× design pressure. No leaks.','Hydrostatic','H','Pending','','','');

-- Weld Map Nodes (PRJ-001)
INSERT INTO weld_map_nodes (id,project_id,x,y,status,weld_type,process,welder) VALUES
('W-001','PRJ-001',18,25,'Accepted','Butt','111','W-0047'),
('W-002','PRJ-001',35,25,'NCR Open','Butt','111','W-0047'),
('W-003','PRJ-001',52,25,'Accepted','Butt','111','W-0039'),
('W-004','PRJ-001',70,25,'Pending VT','Butt','141','W-0052'),
('W-005','PRJ-001',18,50,'Welded','Fillet','135','W-0061'),
('W-006','PRJ-001',35,50,'Pending NDT','Butt','111','W-0047'),
('W-007','PRJ-001',52,50,'Accepted','Fillet','135','W-0061'),
('W-008','PRJ-001',70,50,'Repair Required','Butt','111','W-0039'),
('W-009','PRJ-001',18,75,'Not Started','Butt','111','—'),
('W-010','PRJ-001',35,75,'Fit-up Complete','Fillet','135','W-0061'),
('W-011','PRJ-001',52,75,'Accepted','Butt','111','W-0047'),
('W-012','PRJ-001',70,75,'Pending VT','Butt','141','W-0052')
ON CONFLICT (id) DO NOTHING;

-- Weld Passports
INSERT INTO weld_passports
  (id,project_id,component_id,drawing_no,joint_no,spool_no,weld_type,joint_design,size,position,
   process,date_welded,welder_id,welder_name,stamp_no,qual_ref,qual_valid,coordinator,inspector,
   wps_id,wps_rev,pqr_ref,standard,mat_group,thickness_ok,process_ok,consumable_ok,
   mat_id,heat_no,mat_cert_ref,pmi_status,consumable_id,consumable_batch,welding_gas,
   fitup_status,inprocess_status,vt_result,vt_date,vt_inspector,
   ndt_results,ht_ref,ht_type,ht_result,dimensional_result,pressure_test_result,
   repair_count,repairs,ncr_refs,final_status,overall_status,timeline,attachments)
VALUES
(
  'W-001','PRJ-001','COMP-A14','DWG-0047-RevC','J-001','SP-A14-01',
  'Butt Weld – Full Penetration','Single-V groove 60°','t12mm / D168.3','PC (2G)',
  '111 – SMAW','2025-11-10','WQR-001','James Kowalski','W-0047','CERT-001-A',TRUE,'J. Mitchell','John Mitchell',
  'WPS-001','B','PQR-001','ISO 15614-1 / AS 4041','1.2',TRUE,TRUE,TRUE,
  'MAT-001','H-44721','MTC-MAT-001.pdf','Pass','CONS-001','LE-2024-4471','N/A',
  'Pass','Pass','PASS','2025-11-15','John Mitchell',
  '[{"method":"MT","result":"Pass","date":"2025-11-22","tech":"P. Chen"}]',
  'HT-001','PWHT','Pass','Pass','Pending',
  0,'[]',ARRAY[]::TEXT[],'Accepted','Accepted',
  '[{"event":"Created","date":"2025-11-08","by":"J. Mitchell","note":"Weld record created in WQMS"},{"event":"Welded","date":"2025-11-10","by":"W-0047","note":"Welded PA/PC."},{"event":"VT Inspected","date":"2025-11-15","by":"John Mitchell","note":"PASS – ISO 5817 Level B"},{"event":"PWHT","date":"2025-11-20","by":"R. Sharma","note":"620°C / 90 min – COMPLIANT"},{"event":"NDT – MT","date":"2025-11-22","by":"P. Chen","note":"PASS"},{"event":"Accepted","date":"2025-11-24","by":"J. Mitchell","note":"All hold points cleared."}]',
  ARRAY['VT-Report-W001.pdf','HT-RPT-001.pdf','NDT-RPT-001.pdf']
),
(
  'W-002','PRJ-001','COMP-A14','DWG-0047-RevC','J-002','SP-A14-01',
  'Butt Weld – Full Penetration','Single-V groove 60°','t12mm / D168.3','PF (3G)',
  '111 – SMAW','2025-11-11','WQR-001','James Kowalski','W-0047','CERT-001-A',TRUE,'J. Mitchell','Susan Wren',
  'WPS-001','B','PQR-001','ISO 15614-1 / AS 4041','1.2',TRUE,TRUE,TRUE,
  'MAT-001','H-44721','MTC-MAT-001.pdf','Pass','CONS-001','LE-2024-4471','N/A',
  'Pass','Pass','FAIL','2025-11-16','Susan Wren',
  '[{"method":"UT","result":"Fail","date":"2025-11-23","tech":"K. Watanabe","note":"Planar discontinuity 6mm"}]',
  'HT-002','PWHT','Pending','Pending','Pending',
  1,'[{"repairNo":1,"date":"2025-11-28","by":"W-0047","desc":"Excavate and re-weld undercut zone."}]',
  ARRAY['NCR-001'],'Under Repair','NCR Open',
  '[{"event":"Created","date":"2025-11-09","by":"J. Mitchell","note":"Weld record created"},{"event":"VT – FAIL","date":"2025-11-16","by":"Susan Wren","note":"FAIL – undercut + porosity"},{"event":"NCR Raised","date":"2025-11-16","by":"Susan Wren","note":"NCR-001 raised"}]',
  ARRAY['VT-Report-W002-FAIL.pdf','NCR-001.pdf']
),
(
  'W-022','PRJ-003','COMP-P09','DWG-0088-RevA','J-022','SP-P09-03',
  'Butt Weld – Full Penetration','Single-V groove 70°','t8mm / D88.9','PF (3G)',
  '141/131 – TIG/MIG','2026-01-08','WQR-002','Maria Santos','W-0052','CERT-002-A',TRUE,'S. Wren','John Mitchell',
  'WPS-002','A','PQR-002','ISO 15614-1 / ASME B31.3','6.1',TRUE,TRUE,TRUE,
  'MAT-002','H-77820','MTC-MAT-002.pdf','Pass','CONS-002','ESAB-2025-0082','Ar 99.99%',
  'Pass','Pass','PASS','2026-01-10','John Mitchell',
  '[{"method":"RT","result":"Pass","date":"2026-01-11","tech":"A. Petrova"}]',
  'HT-003','Solution Anneal','Fail','Pass','Pending',
  0,'[]',ARRAY[]::TEXT[],'HT Non-Conformance','Conditional',
  '[{"event":"Created","date":"2026-01-06","by":"S. Wren","note":"Weld record created"},{"event":"VT Inspected","date":"2026-01-10","by":"John Mitchell","note":"PASS"},{"event":"Solution Anneal – FAIL","date":"2026-01-10","by":"K. Lee","note":"TC1 overshot 1082°C."}]',
  ARRAY['VT-Report-W022.pdf','HT-RPT-004.pdf']
),
(
  'W-025','PRJ-003','COMP-P11','DWG-0088-RevA','J-025','SP-P11-01',
  'Butt Weld – Full Penetration','Double-V groove','t10mm / D114.3','H-L045 (5G)',
  '141/131 – TIG/MIG','2026-01-10','WQR-002','Maria Santos','W-0052','CERT-002-A',TRUE,'S. Wren','Susan Wren',
  'WPS-002','A','PQR-002','ISO 15614-1 / ASME B31.3','6.1',TRUE,TRUE,TRUE,
  'MAT-002','H-77820','MTC-MAT-002.pdf','Pass','CONS-002','ESAB-2025-0082','Ar 99.99%',
  'Pass','Pass','FAIL','2026-01-12','Susan Wren',
  '[{"method":"PT","result":"Fail","date":"2026-01-12","tech":"P. Chen","note":"Linear indication 18mm – surface crack"}]',
  NULL,NULL,NULL,'Pending','Pending',
  0,'[]',ARRAY['NCR-002'],'Rejected – Crack','Rejected',
  '[{"event":"Created","date":"2026-01-09","by":"S. Wren","note":"Weld record created"},{"event":"VT – FAIL","date":"2026-01-12","by":"Susan Wren","note":"FAIL – crack detected"},{"event":"NCR Raised","date":"2026-01-12","by":"Susan Wren","note":"NCR-002 raised. Critical."}]',
  ARRAY['VT-Report-W025-FAIL.pdf','NCR-002.pdf']
)
ON CONFLICT (id) DO NOTHING;

-- MDR Packages
INSERT INTO mdr_packages (id,project_id,title,rev,status,completeness,client,issue_date,sections,missing,created_by) VALUES
('MDR-001','PRJ-001','Pressure Vessel Tank Farm B – MDR Package A','B','For Review',87,'BHP Minerals','2026-02-15',
  ARRAY['title_page','document_index','project_summary','drawings','material_traceability','wps_pqr','welder_quals','inspection_records','ndt_records','heat_treatment','ncr_summary','release_cert'],
  ARRAY['Hydrotest result','Final dimensional report'],'J. Mitchell'),
('MDR-002','PRJ-003','Gas Pipeline Distribution – MDR Full Package','A','Draft',62,'APA Group',NULL,
  ARRAY['title_page','document_index','project_summary','material_traceability','wps_pqr','welder_quals','inspection_records','ndt_records'],
  ARRAY['Heat treatment repeat result','NCR-002 closure','ITP final sign-off','Release cert'],'S. Wren')
ON CONFLICT (id) DO NOTHING;

-- Alerts
INSERT INTO alerts (type,msg,time,project_id) VALUES
('critical','WPS-006 expired — used on W-047 (PRJ-004). Immediate stop-work required.','2h ago','PRJ-004'),
('warn','Welder W-0028 (Robert Malik) qualification expired. Not permitted to weld.','1d ago',NULL),
('warn','WPS-005 review due 2026-03-22.','3d ago',NULL),
('info','3 inspections overdue on PRJ-002. ITP hold points uncleared.','5d ago','PRJ-002'),
('warn','TC-003 thermocouple calibration expires 2026-04-15.','2d ago',NULL);

-- Readiness Checks — PRJ-001
INSERT INTO readiness_checks (project_id,category,item,status,note) VALUES
('PRJ-001','documents','Latest drawing revision (RevC)','pass','DWG-0047-RevC issued 2025-10-01'),
('PRJ-001','documents','Approved WPS available (WPS-001)','pass','WPS-001 Rev B – Active'),
('PRJ-001','documents','ITP approved by client','pass','ITP-PV-001 Rev B – BHP approved'),
('PRJ-001','documents','Client specification loaded','pass','BHP-SPEC-WLD-001 loaded'),
('PRJ-001','documents','Relevant procedures current','pass','AS 4041, AS 3992 procedures current'),
('PRJ-001','personnel','Assigned welder (W-0047) qualified for process 111','pass','ISO 9606-1 CERT-001-A – valid to 2026-04-10'),
('PRJ-001','personnel','Welder continuity valid','pass','Last activity 2025-11-20'),
('PRJ-001','personnel','Inspector assigned','pass','John Mitchell – CSWIP 3.1'),
('PRJ-001','personnel','NDT technician qualified (MT)','pass','P. Chen – ISO 9712 L2 MT'),
('PRJ-001','materials','Material received (MAT-001)','pass','AS/NZS 3678-350 t12mm – in Workshop Bay 1'),
('PRJ-001','materials','Heat number recorded','pass','H-44721'),
('PRJ-001','materials','MTC uploaded','pass','MTC-MAT-001.pdf uploaded'),
('PRJ-001','materials','PMI complete','pass','PMI result: PASS'),
('PRJ-001','materials','Material linked to weld map','pass','Linked to W-001 through W-012'),
('PRJ-001','consumables','Correct consumable available (E7018)','pass','CONS-001 – LE-2024-4471 in Oven A'),
('PRJ-001','consumables','Batch traceability recorded','pass','Batch LE-2024-4471 on file'),
('PRJ-001','consumables','Consumable not expired','pass','Expiry 2026-12-31'),
('PRJ-001','consumables','Storage conditions acceptable','pass','Oven A – 120°C confirmed'),
('PRJ-001','consumables','Re-bake status valid','pass','Baked 2026-01-10'),
('PRJ-001','equipment','Welding machine assigned (M-007)','pass','Lincoln Invertec V350 – calibrated'),
('PRJ-001','equipment','NDT equipment calibration current (EQ-MT-001)','pass','MPI Yoke – valid to 2026-08-01'),
('PRJ-001','equipment','Heat treatment equipment available','pass','Furnace HT-2 – available'),
('PRJ-001','equipment','Measuring equipment current','pass','Vernier + digital gauges – calibrated'),
('PRJ-001','process','WPS matches material and thickness','pass','WPS-001: Group 1.2, t3–40mm – MATCH'),
('PRJ-001','process','Welder qualified for position (PC/PF)','pass','CERT-001-A covers PA/PC/PF'),
('PRJ-001','process','Preheat requirement defined','pass','Min 50°C for t>25mm – per WPS-001'),
('PRJ-001','process','PWHT requirement defined','pass','620°C / 90 min – per AS 4458'),
('PRJ-001','process','Hold points configured in ITP','pass','8 hold/witness points in ITP-PV-001'),
('PRJ-001','process','Inspection sequence approved','pass','ITP-PV-001 client approved'),
-- PRJ-004 (blockers)
('PRJ-004','documents','Latest drawing revision issued','pass','DWG-DEF-001-RevA issued'),
('PRJ-004','documents','Approved WPS available','fail','WPS-006 EXPIRED 2025-05-01 – must be renewed'),
('PRJ-004','documents','ITP approved by client','warn','ITP draft submitted, awaiting client approval'),
('PRJ-004','documents','Client specification loaded','pass','DEF-SPEC-001 loaded'),
('PRJ-004','documents','Relevant procedures current','pass','AS 1554.1 SP current'),
('PRJ-004','personnel','Assigned welder (W-0039) qualified','warn','Expiring Soon – expires 2026-06-01'),
('PRJ-004','personnel','Welder continuity valid','pass','Last activity 2025-09-30'),
('PRJ-004','personnel','Inspector assigned','pass','Tom Barnes – CSWIP 3.1'),
('PRJ-004','personnel','NDT technician qualified','warn','S. Kumar – Expiring Soon (2026-02-28)'),
('PRJ-004','materials','Material received','fail','MAT-004 heat number UNKNOWN – not traced'),
('PRJ-004','materials','Heat number recorded','fail','Missing – MAT-004 unidentified'),
('PRJ-004','materials','MTC uploaded','fail','No MTC on file for MAT-004'),
('PRJ-004','materials','PMI complete','warn','PMI pending for MAT-004'),
('PRJ-004','materials','Material linked to weld map','warn','W-047 material link incomplete'),
('PRJ-004','consumables','Correct consumable (ER70S-6)','fail','CONS-004 EXPIRED 2025-06-30 – remove from site'),
('PRJ-004','consumables','Batch traceability recorded','pass','Batch LE-2023-9901 on file'),
('PRJ-004','consumables','Consumable not expired','fail','EXPIRED – must be replaced'),
('PRJ-004','consumables','Storage conditions acceptable','pass','Stored correctly'),
('PRJ-004','consumables','Re-bake status','pass','N/A (solid wire)'),
('PRJ-004','equipment','Welding machine assigned','pass','Miller Dynasty 350 – assigned'),
('PRJ-004','equipment','NDT equipment calibration current','fail','EQ-UT-002 (PAUT) EXPIRED 2025-12-01'),
('PRJ-004','equipment','Heat treatment equipment','pass','N/A for this weld type'),
('PRJ-004','equipment','Measuring equipment current','pass','Calibrated gauges available'),
('PRJ-004','process','WPS matches material and thickness','fail','WPS-006 EXPIRED – critical blocker'),
('PRJ-004','process','Welder qualified for position','pass','W-0039 covers PA'),
('PRJ-004','process','Preheat defined','pass','Per AS/NZS 1554'),
('PRJ-004','process','PWHT defined','pass','Not required for t16mm carbon steel'),
('PRJ-004','process','Hold points configured','warn','ITP not yet approved – hold points tentative'),
('PRJ-004','process','Inspection sequence approved','warn','Client approval pending');
