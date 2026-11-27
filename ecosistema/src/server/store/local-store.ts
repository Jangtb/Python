import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { emptyDatabase, type Database } from "./types";
import { buildSeed } from "./seed";

/**
 * Adaptador de persistencia local (modo demostración / instancia única).
 *
 * - Mantiene la base en memoria y la persiste en DATA_DIR/db.json.
 * - Las escrituras se serializan en una cola y se guardan de forma atómica
 *   (archivo temporal + rename), por lo que un fallo no deja el JSON a medias.
 * - No es apto para despliegues con varias instancias ni para sistemas de
 *   archivos efímeros (p. ej. funciones serverless): para eso existe el
 *   esquema PostgreSQL/Supabase en supabase/migrations.
 */

interface StoreState {
  db: Database | null;
  loading: Promise<Database> | null;
  queue: Promise<unknown>;
  file: string | null;
}

const globalKey = Symbol.for("ecosistema.local-store");
type GlobalWithStore = typeof globalThis & { [globalKey]?: StoreState };

function state(): StoreState {
  const g = globalThis as GlobalWithStore;
  if (!g[globalKey]) g[globalKey] = { db: null, loading: null, queue: Promise.resolve(), file: null };
  return g[globalKey];
}

function dataFile(): string {
  // El directorio de datos se resuelve en tiempo de ejecución: no debe trazarse en el build.
  const dir = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR?.trim() || path.join(/*turbopackIgnore: true*/ process.cwd(), ".data"));
  return path.join(dir, "db.json");
}

async function load(): Promise<Database> {
  const s = state();
  const file = dataFile();
  if (s.db && s.file === file) return s.db;
  if (s.loading && s.file === file) return s.loading;
  s.file = file;
  s.loading = (async () => {
    try {
      const raw = await fs.readFile(file, "utf8");
      const parsed = JSON.parse(raw) as Partial<Database>;
      // Completa colecciones nuevas si el archivo es de una versión anterior.
      const db = { ...emptyDatabase(), ...parsed } as Database;
      s.db = db;
      return db;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const db = process.env.SEED_DEMO === "false" ? emptyDatabase() : buildSeed(new Date());
      await persist(db, file);
      s.db = db;
      return db;
    } finally {
      s.loading = null;
    }
  })();
  return s.loading;
}

async function persist(db: Database, file: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, file);
}

/** Lectura: devuelve la base en memoria. Tratar como solo lectura. */
export async function readDb(): Promise<Readonly<Database>> {
  return load();
}

/**
 * Escritura transaccional: la función recibe una copia de trabajo; si lanza
 * un error no se aplica ningún cambio. Las mutaciones se ejecutan en serie.
 */
export async function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const s = state();
  const run = async () => {
    const current = await load();
    const draft = structuredClone(current);
    const result = await fn(draft);
    await persist(draft, dataFile());
    s.db = draft;
    return result;
  };
  const next = s.queue.then(run, run);
  s.queue = next.catch(() => undefined);
  return next;
}

/** Solo pruebas: olvida el estado en memoria para releer desde disco. */
export function __resetStoreCache(): void {
  const s = state();
  s.db = null;
  s.loading = null;
  s.file = null;
  s.queue = Promise.resolve();
}
