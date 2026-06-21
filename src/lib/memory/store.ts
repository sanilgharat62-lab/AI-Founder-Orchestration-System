import fs from "fs";
import path from "path";
import os from "os";
import { MemoryStore, AgentName, Citation, FounderScorecard } from "@/types";

const MEMORY_DIR = path.join(os.tmpdir(), "founder-os-memory");

function ensureDir() {
  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

export function saveMemory(store: MemoryStore): void {
  ensureDir();
  const file = path.join(MEMORY_DIR, `${store.id}.json`);
  fs.writeFileSync(file, JSON.stringify(store, null, 2));
}

export function loadMemory(id: string): MemoryStore | null {
  const file = path.join(MEMORY_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function listMemory(): MemoryStore[] {
  ensureDir();
  return fs
    .readdirSync(MEMORY_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(MEMORY_DIR, f), "utf-8")));
}

export function createMemory(idea: string, startupName: string): MemoryStore {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();
  return {
    id,
    startupName,
    idea,
    createdAt: now,
    updatedAt: now,
    roadmaps: [],
    documents: [],
    agentOutputs: {} as Record<AgentName, string>,
  };
}

export function updateMemoryAgent(id: string, agent: AgentName, output: string): void {
  const store = loadMemory(id);
  if (!store) return;
  store.agentOutputs[agent] = output;
  store.updatedAt = new Date().toISOString();
  saveMemory(store);
}

export function updateMemoryCitations(id: string, agent: AgentName, citations: Citation[]): void {
  const store = loadMemory(id);
  if (!store) return;
  if (!store.citations) store.citations = {};
  store.citations[agent] = citations;
  store.updatedAt = new Date().toISOString();
  saveMemory(store);
}

export function updateMemoryScorecard(id: string, scorecard: FounderScorecard): void {
  const store = loadMemory(id);
  if (!store) return;
  store.scorecard = scorecard;
  store.updatedAt = new Date().toISOString();
  saveMemory(store);
}

