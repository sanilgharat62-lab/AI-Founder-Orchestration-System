import fs from "fs";
import path from "path";

export interface ToolRunRecord {
  id: string;
  memoryId?: string;
  startupName?: string;
  action: string;
  title: string;
  summary: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface WaitlistLeadRecord {
  id: string;
  memoryId?: string;
  startupName?: string;
  name: string;
  email: string;
  role?: string;
  createdAt: string;
}

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "tool-runs.json");
const WAITLIST_FILE = path.join(DB_DIR, "waitlist-leads.json");

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]");
  if (!fs.existsSync(WAITLIST_FILE)) fs.writeFileSync(WAITLIST_FILE, "[]");
}

function readAll(): ToolRunRecord[] {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as ToolRunRecord[];
}

function writeAll(records: ToolRunRecord[]) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(records, null, 2));
}

export function saveToolRun(record: Omit<ToolRunRecord, "id" | "createdAt">) {
  const records = readAll();
  const saved: ToolRunRecord = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
    ...record,
  };
  records.unshift(saved);
  writeAll(records.slice(0, 300));
  return saved;
}

export function listToolRuns(memoryId?: string, limit = 8) {
  const records = readAll();
  return records
    .filter((record) => !memoryId || record.memoryId === memoryId)
    .slice(0, limit);
}

export function saveWaitlistLead(record: Omit<WaitlistLeadRecord, "id" | "createdAt">) {
  ensureDb();
  const leads = JSON.parse(fs.readFileSync(WAITLIST_FILE, "utf-8")) as WaitlistLeadRecord[];
  const saved: WaitlistLeadRecord = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
    ...record,
  };
  leads.unshift(saved);
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify(leads.slice(0, 1000), null, 2));
  saveToolRun({
    memoryId: saved.memoryId,
    startupName: saved.startupName,
    action: "waitlist-lead",
    title: "Waitlist Lead",
    summary: `${saved.name || "New lead"} joined the waitlist for ${saved.startupName || "the landing page"}.`,
    metadata: { email: saved.email, role: saved.role },
  });
  return saved;
}
