// Minimal file-system ISR cache handler. Mirrors Next's default singular
// cacheHandler (packages/next/src/server/lib/incremental-cache/file-system-cache.ts),
// covering only the cases this demo exercises.
//
// Files written per APP_PAGE entry, mimicking Next's layout:
//   {key}.html              raw HTML body
//   {key}.rsc               RSC payload buffer (when not a fallback)
//   {key}.segments/...      per-segment RSC payload buffers
//   {key}.meta              JSON metadata: headers, status, postponed, segmentPaths
//
// Storage path: .next/my-isr/

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

const STORAGE_DIR = join(process.cwd(), ".next", "my-isr");
const LOG_PATH = "/tmp/isr-cache.log";

const log = (msg) =>
  appendFileSync(
    LOG_PATH,
    `${new Date().toISOString()} [pid=${process.pid}] ${msg}\n`,
  );

mkdirSync(STORAGE_DIR, { recursive: true });

function pathFor(key) {
  // The cache key already starts with /; map it to a file under STORAGE_DIR.
  return join(STORAGE_DIR, key);
}

function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function readBufferIfExists(p) {
  return existsSync(p) ? readFileSync(p) : undefined;
}

function readJsonIfExists(p) {
  if (!existsSync(p)) return undefined;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return undefined;
  }
}

export default class IsrCacheHandler {
  constructor() {}

  async get(key) {
    const base = pathFor(key);
    const htmlPath = `${base}.html`;
    if (!existsSync(htmlPath)) {
      log(`get: ${key} -> MISS`);
      return null;
    }

    const html = readFileSync(htmlPath, "utf8");
    const meta = readJsonIfExists(`${base}.meta`) ?? {};
    const rscData = readBufferIfExists(`${base}.rsc`);

    let segmentData;
    if (Array.isArray(meta.segmentPaths)) {
      segmentData = new Map();
      const segDir = `${base}.segments`;
      for (const seg of meta.segmentPaths) {
        const segPath = join(segDir, `${seg}.segment.rsc`);
        const buf = readBufferIfExists(segPath);
        if (buf) segmentData.set(seg, buf);
      }
    }

    log(`get: ${key} -> HIT`);
    return {
      lastModified: meta.lastModified ?? Date.now(),
      value: {
        kind: "APP_PAGE",
        html,
        rscData,
        postponed: meta.postponed,
        headers: meta.headers,
        status: meta.status,
        segmentData,
      },
    };
  }

  async set(key, data, ctx) {
    if (!data) return;

    if (data.kind !== "APP_PAGE" && data.kind !== "APP_ROUTE") {
      log(`set: ${key} skip kind=${data.kind}`);
      return;
    }

    const base = pathFor(key);
    ensureDir(`${base}.placeholder`);

    if (data.kind === "APP_PAGE") {
      writeFileSync(`${base}.html`, data.html);

      if (data.rscData) {
        writeFileSync(`${base}.rsc`, data.rscData);
      }

      let segmentPaths;
      if (data.segmentData) {
        segmentPaths = [];
        const segDir = `${base}.segments`;
        for (const [segmentPath, buffer] of data.segmentData) {
          segmentPaths.push(segmentPath);
          const segFile = join(segDir, `${segmentPath}.segment.rsc`);
          ensureDir(segFile);
          writeFileSync(segFile, buffer);
        }
      }

      const meta = {
        headers: data.headers,
        status: data.status,
        postponed: data.postponed,
        segmentPaths,
        lastModified: Date.now(),
      };
      writeFileSync(`${base}.meta`, JSON.stringify(meta));
      log(`set: ${key} APP_PAGE revalidate=${ctx?.cacheControl?.revalidate}`);
    } else {
      // APP_ROUTE
      writeFileSync(`${base}.body`, data.body);
      const meta = {
        headers: data.headers,
        status: data.status,
        lastModified: Date.now(),
      };
      writeFileSync(`${base}.meta`, JSON.stringify(meta));
      log(`set: ${key} APP_ROUTE`);
    }
  }

  async revalidateTag(tags) {
    log(`revalidateTag: ${JSON.stringify(tags)}`);
  }

  resetRequestCache() {}
}
