/**
 * Mock Database Implementation
 * In-memory SQLite alternative for testing without Python/native compilation
 * Implements the same interface as better-sqlite3 for seamless switching
 */

import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "reviveai-mock.json");

interface MockDB {
  leads: Map<string, any>;
  businesses: Map<string, any>;
  interactions: Map<string, any>;
  save(): void;
  load(): void;
}

const db: MockDB = {
  leads: new Map(),
  businesses: new Map(),
  interactions: new Map(),

  save() {
    const data = {
      leads: Array.from(this.leads.entries()),
      businesses: Array.from(this.businesses.entries()),
      interactions: Array.from(this.interactions.entries()),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  },

  load() {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      this.leads = new Map(data.leads);
      this.businesses = new Map(data.businesses);
      this.interactions = new Map(data.interactions);
    }
  },
};

export class MockStatement {
  private sql: string;
  private params: any[];

  constructor(sql: string) {
    this.sql = sql;
    this.params = [];
  }

  run(...params: any[]) {
    this.params = params;
    const result = { changes: 1, lastInsertRowid: 0 };

    // INSERT simulation
    if (this.sql.includes("INSERT INTO leads")) {
      const lead = {
        id: params[0],
        business_id: params[1],
        name: params[2],
        email: params[3],
        phone: params[4],
        status: "INITIAL",
        contact_consent: "CONSENTED",
        created_at: new Date().toISOString(),
      };
      db.leads.set(lead.id, lead);
      db.save();
    }

    if (this.sql.includes("INSERT INTO interactions")) {
      const interaction = {
        id: params[0],
        lead_id: params[1],
        timestamp: new Date().toISOString(),
        type: params[2],
      };
      db.interactions.set(interaction.id, interaction);
      db.save();
    }

    return result;
  }

  get(...params: any[]) {
    this.params = params;

    // SELECT single lead by ID
    if (this.sql.includes("SELECT * FROM leads WHERE id")) {
      return db.leads.get(params[0]) || null;
    }

    return null;
  }

  all(...params: any[]) {
    this.params = params;

    // SELECT all leads
    if (this.sql.includes("SELECT * FROM leads")) {
      return Array.from(db.leads.values());
    }

    // SELECT stale leads
    if (this.sql.includes("stale")) {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      return Array.from(db.leads.values()).filter(
        (lead) =>
          lead.status === "INITIAL" &&
          lead.contact_consent === "CONSENTED" &&
          new Date(lead.created_at) < threeDaysAgo
      );
    }

    return [];
  }

  bind(...params: any[]) {
    this.params = params;
    return this;
  }
}

export class MockDatabase {
  constructor(dbPath: string) {
    db.load();
  }

  prepare(sql: string) {
    return new MockStatement(sql);
  }

  exec(sql: string) {
    // Schema initialization
    return this;
  }

  close() {
    db.save();
  }
}

export default MockDatabase;
