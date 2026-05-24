-- ============================================================
-- WQMS Pro — Supabase Schema
-- Run this in: Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Projects ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  client           TEXT NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('On Track','At Risk','Delayed')),
  progress         INT  NOT NULL DEFAULT 0,
  welds_total      INT  NOT NULL DEFAULT 0,
  welds_complete   INT  NOT NULL DEFAULT 0,
  welds_pending    INT  NOT NULL DEFAULT 0,
  welds_rejected   INT  NOT NULL DEFAULT 0,
  standard         TEXT NOT NULL,
  due              TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── WPS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wps (
  id               TEXT PRIMARY KEY,
  rev              TEXT NOT NULL DEFAULT 'A',
  title            TEXT NOT NULL,
  standard         TEXT NOT NULL,
  processes        TEXT[] NOT NULL DEFAULT '{}',
  material_groups  TEXT[] NOT NULL DEFAULT '{}',
  pqr_ref          TEXT,
  positions        TEXT[] NOT NULL DEFAULT '{}',
  thickness_range  TEXT,
  heat_input       TEXT,
  preheat          TEXT,
  interpass        TEXT,
  consumable       TEXT,
  shielding_gas    TEXT,
  approved_by      TEXT,
  approval_date    TEXT,
  status           TEXT NOT NULL CHECK (status IN ('Active','Pending Review','Expired')),
  expiry_date      TEXT,
  document_path    TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── PQR ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pqr (
  id          TEXT PRIMARY KEY,
  wps_ref     TEXT REFERENCES wps(id) ON DELETE SET NULL,
  test_date   TEXT,
  test_lab    TEXT,
  standard    TEXT,
  result      TEXT,
  tests       TEXT[] DEFAULT '{}',
  document_path TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Welders ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS welders (
  id         TEXT PRIMARY KEY,
  stamp_no   TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  employer   TEXT,
  trade      TEXT,
  status     TEXT NOT NULL CHECK (status IN ('Current','Expiring Soon','Expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS welder_qualifications (
  id             TEXT PRIMARY KEY,
  welder_id      TEXT NOT NULL REFERENCES welders(id) ON DELETE CASCADE,
  standard       TEXT NOT NULL,
  process        TEXT NOT NULL,
  material_group TEXT,
  joint_type     TEXT,
  positions      TEXT[] DEFAULT '{}',
  thickness_range TEXT,
  test_date      TEXT,
  expiry_date    TEXT,
  test_piece     TEXT,
  result         TEXT,
  test_lab       TEXT,
  wps_used       TEXT,
  cert_no        TEXT,
  continuity_ok  BOOLEAN DEFAULT TRUE,
  last_activity  TEXT,
  document_path  TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── Materials ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id            TEXT PRIMARY KEY,
  heat_no       TEXT NOT NULL,
  grade         TEXT NOT NULL,
  standard      TEXT,
  mat_group     TEXT,
  size          TEXT,
  supplier      TEXT,
  mtc_status    TEXT,
  pmi_status    TEXT,
  location      TEXT,
  traceability  TEXT,
  linked_welds  TEXT[] DEFAULT '{}',
  cev           FLOAT,
  supplier_cert TEXT,
  document_path TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Consumables ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consumables (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  classification  TEXT,
  manufacturer    TEXT,
  batch           TEXT,
  location        TEXT,
  issue_status    TEXT,
  expiry          TEXT,
  rebake_status   TEXT,
  issued_to       TEXT,
  wps_compat      TEXT[] DEFAULT '{}',
  document_path   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── NCR ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ncrs (
  id         TEXT PRIMARY KEY,
  weld_id    TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  project    TEXT NOT NULL,
  defect     TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('Open','In Progress','Closed')),
  priority   TEXT NOT NULL CHECK (priority IN ('Critical','High','Medium','Low')),
  raised     TEXT NOT NULL,
  assignee   TEXT,
  capa       TEXT,
  closed_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── VT Reports ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vt_reports (
  id         TEXT PRIMARY KEY,
  job_no     TEXT,
  weld_id    TEXT NOT NULL,
  project    TEXT NOT NULL,
  result     TEXT NOT NULL CHECK (result IN ('PASS','FAIL','CONDITIONAL')),
  date       TEXT NOT NULL,
  inspector  TEXT,
  defects    TEXT[] DEFAULT '{}',
  standard   TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── NDT Records ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ndt_records (
  id              TEXT PRIMARY KEY,
  weld_id         TEXT NOT NULL,
  method          TEXT NOT NULL,
  tech_name       TEXT,
  tech_qual       TEXT,
  result          TEXT,
  accept_std      TEXT,
  date            TEXT,
  defects         TEXT[] DEFAULT '{}',
  repair_required BOOLEAN DEFAULT FALSE,
  ncr_ref         TEXT,
  document_path   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ndt_equipment (
  id            TEXT PRIMARY KEY,
  type          TEXT,
  manufacturer  TEXT,
  model         TEXT,
  serial        TEXT,
  calib_due     TEXT,
  calib_status  TEXT CHECK (calib_status IN ('Valid','Expiring Soon','Expired')),
  location      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ndt_technicians (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  cert        TEXT,
  methods     TEXT[] DEFAULT '{}',
  level       TEXT,
  cert_body   TEXT,
  employer    TEXT,
  expiry_date TEXT,
  status      TEXT CHECK (status IN ('Current','Expiring Soon','Expired')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Heat Treatment ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS heat_treatments (
  id            TEXT PRIMARY KEY,
  job_id        TEXT REFERENCES projects(id) ON DELETE SET NULL,
  component_id  TEXT,
  weld_id       TEXT,
  material      TEXT,
  thickness     FLOAT,
  type          TEXT,
  standard      TEXT,
  target_temp   FLOAT,
  soak_time     INT,
  actual_status TEXT,
  technician    TEXT,
  date          TEXT,
  compliant     BOOLEAN,
  document_path TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── ITP ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itp (
  id              TEXT PRIMARY KEY,
  project_id      TEXT REFERENCES projects(id) ON DELETE CASCADE,
  itp_no          TEXT NOT NULL,
  rev             TEXT DEFAULT 'A',
  component       TEXT,
  standard        TEXT,
  status          TEXT DEFAULT 'Active',
  client_approval TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS itp_steps (
  id               BIGSERIAL PRIMARY KEY,
  itp_id           TEXT NOT NULL REFERENCES itp(id) ON DELETE CASCADE,
  seq              INT NOT NULL,
  activity         TEXT NOT NULL,
  criteria         TEXT,
  method           TEXT,
  hold_type        TEXT CHECK (hold_type IN ('H','W','S')),
  status           TEXT DEFAULT 'Pending' CHECK (status IN ('Completed','In Progress','Pending')),
  signed_inspector TEXT,
  signed_client    TEXT,
  date             TEXT,
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Weld Passports ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weld_passports (
  id                   TEXT PRIMARY KEY,
  project_id           TEXT REFERENCES projects(id) ON DELETE SET NULL,
  component_id         TEXT,
  drawing_no           TEXT,
  joint_no             TEXT,
  spool_no             TEXT,
  weld_type            TEXT,
  joint_design         TEXT,
  size                 TEXT,
  position             TEXT,
  process              TEXT,
  date_welded          TEXT,
  welder_id            TEXT REFERENCES welders(id) ON DELETE SET NULL,
  welder_name          TEXT,
  stamp_no             TEXT,
  qual_ref             TEXT,
  qual_valid           BOOLEAN DEFAULT TRUE,
  coordinator          TEXT,
  inspector            TEXT,
  wps_id               TEXT REFERENCES wps(id) ON DELETE SET NULL,
  wps_rev              TEXT,
  pqr_ref              TEXT,
  standard             TEXT,
  mat_group            TEXT,
  thickness_ok         BOOLEAN DEFAULT TRUE,
  process_ok           BOOLEAN DEFAULT TRUE,
  consumable_ok        BOOLEAN DEFAULT TRUE,
  mat_id               TEXT REFERENCES materials(id) ON DELETE SET NULL,
  heat_no              TEXT,
  mat_cert_ref         TEXT,
  pmi_status           TEXT,
  consumable_id        TEXT REFERENCES consumables(id) ON DELETE SET NULL,
  consumable_batch     TEXT,
  welding_gas          TEXT,
  fitup_status         TEXT,
  inprocess_status     TEXT,
  vt_result            TEXT,
  vt_date              TEXT,
  vt_inspector         TEXT,
  ndt_results          JSONB DEFAULT '[]',
  ht_ref               TEXT,
  ht_type              TEXT,
  ht_result            TEXT,
  dimensional_result   TEXT,
  pressure_test_result TEXT,
  repair_count         INT DEFAULT 0,
  repairs              JSONB DEFAULT '[]',
  ncr_refs             TEXT[] DEFAULT '{}',
  final_status         TEXT,
  overall_status       TEXT DEFAULT 'Pending',
  timeline             JSONB DEFAULT '[]',
  attachments          TEXT[] DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ── Weld Map Nodes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weld_map_nodes (
  id         TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  x          FLOAT NOT NULL,
  y          FLOAT NOT NULL,
  status     TEXT NOT NULL,
  weld_type  TEXT,
  process    TEXT,
  welder     TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Readiness Checks ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS readiness_checks (
  id         BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category   TEXT NOT NULL,
  item       TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('pass','fail','warn')),
  note       TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── MDR Packages ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mdr_packages (
  id           TEXT PRIMARY KEY,
  project_id   TEXT REFERENCES projects(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  rev          TEXT DEFAULT 'A',
  status       TEXT,
  completeness INT DEFAULT 0,
  client       TEXT,
  issue_date   TEXT,
  sections     TEXT[] DEFAULT '{}',
  missing      TEXT[] DEFAULT '{}',
  created_by   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Alerts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id         BIGSERIAL PRIMARY KEY,
  type       TEXT NOT NULL CHECK (type IN ('critical','warn','info')),
  msg        TEXT NOT NULL,
  time       TEXT,
  dismissed  BOOLEAN DEFAULT FALSE,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHASE 2: Cert Inbox Pipeline
-- ============================================================

CREATE TABLE IF NOT EXISTS cert_inbox (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id TEXT UNIQUE NOT NULL,
  gmail_thread_id  TEXT,
  from_email       TEXT,
  from_name        TEXT,
  subject          TEXT,
  body_snippet     TEXT,
  received_at      TIMESTAMPTZ,
  cert_type        TEXT CHECK (cert_type IN ('material','consumable','ndt','heat_treatment','welder_qual','wps','other')),
  extracted        BOOLEAN DEFAULT FALSE,
  processing_error TEXT,
  attachment_count INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS material_cert_register (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id            UUID REFERENCES cert_inbox(id) ON DELETE SET NULL,
  cert_ref            TEXT,
  heat_no             TEXT,
  grade               TEXT,
  standard            TEXT,
  supplier            TEXT,
  test_date           TEXT,
  item_size           TEXT,
  cev                 FLOAT,
  document_path       TEXT,
  document_url        TEXT,
  raw_extracted       JSONB,
  linked_material_id  TEXT REFERENCES materials(id) ON DELETE SET NULL,
  verified            BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consumable_cert_register (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id              UUID REFERENCES cert_inbox(id) ON DELETE SET NULL,
  cert_ref              TEXT,
  classification        TEXT,
  manufacturer          TEXT,
  batch_no              TEXT,
  standard              TEXT,
  test_date             TEXT,
  document_path         TEXT,
  document_url          TEXT,
  raw_extracted         JSONB,
  linked_consumable_id  TEXT REFERENCES consumables(id) ON DELETE SET NULL,
  verified              BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ndt_report_register (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id            UUID REFERENCES cert_inbox(id) ON DELETE SET NULL,
  report_no           TEXT,
  method              TEXT,
  weld_id             TEXT,
  technician          TEXT,
  cert_level          TEXT,
  standard            TEXT,
  result              TEXT,
  test_date           TEXT,
  defects_found       TEXT[],
  document_path       TEXT,
  document_url        TEXT,
  raw_extracted       JSONB,
  linked_ndt_id       TEXT REFERENCES ndt_records(id) ON DELETE SET NULL,
  verified            BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ht_report_register (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id        UUID REFERENCES cert_inbox(id) ON DELETE SET NULL,
  report_no       TEXT,
  ht_type         TEXT,
  component_id    TEXT,
  weld_id         TEXT,
  material        TEXT,
  target_temp     FLOAT,
  soak_time       INT,
  actual_temp     FLOAT,
  result          TEXT,
  test_date       TEXT,
  technician      TEXT,
  document_path   TEXT,
  document_url    TEXT,
  raw_extracted   JSONB,
  linked_ht_id    TEXT REFERENCES heat_treatments(id) ON DELETE SET NULL,
  verified        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS welder_cert_register (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id         UUID REFERENCES cert_inbox(id) ON DELETE SET NULL,
  cert_no          TEXT,
  welder_name      TEXT,
  stamp_no         TEXT,
  standard         TEXT,
  process          TEXT,
  material_group   TEXT,
  positions        TEXT[],
  test_date        TEXT,
  expiry_date      TEXT,
  test_lab         TEXT,
  document_path    TEXT,
  document_url     TEXT,
  raw_extracted    JSONB,
  linked_welder_id TEXT REFERENCES welders(id) ON DELETE SET NULL,
  verified         BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Notification queue (Phase 4 — outbound email)
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL, -- expiry_warning, ncr_alert, mdr_approval
  to_email    TEXT NOT NULL,
  subject     TEXT NOT NULL,
  body_html   TEXT,
  attachment_path TEXT,
  sent        BOOLEAN DEFAULT FALSE,
  sent_at     TIMESTAMPTZ,
  error       TEXT,
  ref_id      TEXT,
  ref_type    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS)
-- Any authenticated user gets full access (solo system)
-- ============================================================

ALTER TABLE projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE wps                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqr                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE welders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE welder_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials             ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumables           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncrs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vt_reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndt_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndt_equipment         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndt_technicians       ENABLE ROW LEVEL SECURITY;
ALTER TABLE heat_treatments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE itp                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE itp_steps             ENABLE ROW LEVEL SECURITY;
ALTER TABLE weld_passports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE weld_map_nodes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_checks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdr_packages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE cert_inbox            ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_cert_register    ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_cert_register  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndt_report_register       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ht_report_register        ENABLE ROW LEVEL SECURITY;
ALTER TABLE welder_cert_register      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue        ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'projects','wps','pqr','welders','welder_qualifications',
    'materials','consumables','ncrs','vt_reports','ndt_records',
    'ndt_equipment','ndt_technicians','heat_treatments','itp','itp_steps',
    'weld_passports','weld_map_nodes','readiness_checks','mdr_packages',
    'alerts','cert_inbox','material_cert_register','consumable_cert_register',
    'ndt_report_register','ht_report_register','welder_cert_register',
    'notification_queue'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "Authenticated full access" ON %I FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE)', t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- Storage buckets (run in Supabase → Storage → New Bucket)
-- Or uncomment to create via SQL if using service role:
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('wps-documents',    'wps-documents',    FALSE),
--   ('pqr-documents',    'pqr-documents',    FALSE),
--   ('certs-material',   'certs-material',   FALSE),
--   ('certs-consumable', 'certs-consumable', FALSE),
--   ('certs-ndt',        'certs-ndt',        FALSE),
--   ('certs-ht',         'certs-ht',         FALSE),
--   ('certs-welder',     'certs-welder',     FALSE),
--   ('mdr-packages',     'mdr-packages',     FALSE),
--   ('weld-passports',   'weld-passports',   FALSE)
-- ON CONFLICT DO NOTHING;
