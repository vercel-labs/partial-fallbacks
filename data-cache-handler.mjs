import { createCacheHandler } from "@mrjasonroy/cache-components-cache-handler";
import { appendFileSync } from "node:fs";

const log = (msg) =>
  appendFileSync("/tmp/data-cache.log", `${new Date().toISOString()} ${msg}\n`);

const inner = createCacheHandler({ type: "memory" });

// Wrap to log calls.
const cacheHandler = {
  async get(cacheKey, implicitTags) {
    log(`get: ${JSON.stringify(cacheKey)}`);
    return inner.get(cacheKey, implicitTags);
  },
  async set(cacheKey, pendingEntry) {
    log(`set: ${JSON.stringify(cacheKey)}`);
    return inner.set(cacheKey, pendingEntry);
  },
  async refreshTags() {
    return inner.refreshTags();
  },
  async getExpiration(...tags) {
    return inner.getExpiration(...tags);
  },
  async updateTags(...args) {
    log(`updateTags: ${JSON.stringify(args)}`);
    return inner.updateTags?.(...args);
  },
};

export default cacheHandler;
