// SQLite implementation of the document store (Node's built-in node:sqlite, no native build step).
// One table holds every collection as JSON; filters use json_extract so the laptop experience matches
// Firestore semantics closely enough for development and demos.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';
import { matchesWhere, sortDocs } from './store.js';

const FIELD_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const SQL_OPS = new Set(['==', '!=', '<', '<=', '>', '>=']);
const isScalar = (v) => v === null || ['string', 'number', 'boolean'].includes(typeof v);
const nativeClause = ([f, op, v]) => FIELD_RE.test(f) && SQL_OPS.has(op) && isScalar(v);

export function createSqliteStore() {
  fs.mkdirSync(path.dirname(config.db.file), { recursive: true });
  const db = new DatabaseSync(config.db.file);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS docs (
      col        TEXT NOT NULL,
      id         TEXT NOT NULL,
      data       TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (col, id)
    );
    CREATE INDEX IF NOT EXISTS idx_docs_user    ON docs(col, json_extract(data, '$.userId'));
    CREATE INDEX IF NOT EXISTS idx_docs_expires ON docs(col, json_extract(data, '$.expiresAt'));
  `);

  const stmts = new Map();
  const prep = (sql) => {
    let s = stmts.get(sql);
    if (!s) {
      s = db.prepare(sql);
      stmts.set(sql, s);
    }
    return s;
  };
  const parse = (row) => {
    try {
      return JSON.parse(row.data);
    } catch {
      return null;
    }
  };

  /** Translate the query into SQL where possible; anything exotic is filtered in memory afterwards. */
  function buildSelect(col, query = {}, { countOnly = false } = {}) {
    const params = [col];
    const clauses = ['col = ?'];
    const residual = [];
    for (const clause of query.where || []) {
      if (!nativeClause(clause)) {
        residual.push(clause);
        continue;
      }
      const [field, op, value] = clause;
      const expr = `json_extract(data, '$.${field}')`;
      if (value === null) {
        clauses.push(op === '==' ? `${expr} IS NULL` : `${expr} IS NOT NULL`);
      } else {
        clauses.push(`${expr} ${op === '==' ? '=' : op} ?`);
        params.push(typeof value === 'boolean' ? Number(value) : value);
      }
    }
    let sql = `SELECT ${countOnly ? 'COUNT(*) AS n' : 'data'} FROM docs WHERE ${clauses.join(' AND ')}`;
    const orderBy = (query.orderBy || []).filter(([f]) => FIELD_RE.test(f));
    const sortedInSql = !countOnly && !residual.length && orderBy.length > 0;
    if (sortedInSql) {
      sql += ` ORDER BY ${orderBy
        .map(([f, d]) => `json_extract(data, '$.${f}') IS NULL, json_extract(data, '$.${f}') ${d === 'desc' ? 'DESC' : 'ASC'}`)
        .join(', ')}`;
      if (query.limit) {
        sql += ' LIMIT ?';
        params.push(Number(query.limit));
      }
    }
    return { sql, params, residual, sortedInSql };
  }

  return {
    driver: 'sqlite',

    async get(col, id) {
      const row = prep('SELECT data FROM docs WHERE col = ? AND id = ?').get(col, String(id));
      return row ? parse(row) : null;
    },

    async set(col, id, doc) {
      const data = { ...doc, id: String(id) };
      prep('INSERT OR REPLACE INTO docs (col, id, data, updated_at) VALUES (?, ?, ?, ?)').run(
        col,
        String(id),
        JSON.stringify(data),
        new Date().toISOString(),
      );
      return data;
    },

    async update(col, id, patch) {
      const current = await this.get(col, id);
      if (!current) return null;
      return this.set(col, id, { ...current, ...patch });
    },

    async remove(col, id) {
      return prep('DELETE FROM docs WHERE col = ? AND id = ?').run(col, String(id)).changes > 0;
    },

    async find(col, query = {}) {
      const { sql, params, residual, sortedInSql } = buildSelect(col, query);
      let docs = prep(sql).all(...params).map(parse).filter(Boolean);
      if (residual.length) docs = docs.filter((d) => matchesWhere(d, residual));
      if (!sortedInSql) {
        docs = sortDocs(docs, query.orderBy || []);
        if (query.limit) docs = docs.slice(0, query.limit);
      }
      return docs;
    },

    async count(col, query = {}) {
      const allNative = (query.where || []).every(nativeClause);
      if (allNative) {
        const { sql, params } = buildSelect(col, query, { countOnly: true });
        return prep(sql).get(...params).n;
      }
      return (await this.find(col, query)).length;
    },

    async removeWhere(col, query = {}) {
      const docs = await this.find(col, query);
      const del = prep('DELETE FROM docs WHERE col = ? AND id = ?');
      let n = 0;
      for (const d of docs) n += del.run(col, d.id).changes;
      return n;
    },

    /** Raw handle — used only by the one-off migration from the previous schema. */
    _raw: db,
  };
}
