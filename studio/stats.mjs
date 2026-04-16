// ABOUTME: Privacy-friendly visitor counter — daily-salted SHA-256 hashes (no raw IPs
// ABOUTME: persisted), JSON file storage, debounced atomic writes, bot-UA filtering.
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { dirname } from 'node:path';

// Match common crawlers / link-preview fetchers so they don't inflate counts.
// Telegram's link-preview bot is "TelegramBot (like TwitterBot)" — we want it filtered
// because the publish pipeline posts shareable links and each preview would otherwise count.
const BOT_RE = /bot\b|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|gptbot|chatgpt|claude|perplexity|headlesschrome|playwright|puppeteer/i;

const RETENTION_DAYS = 90;
const FLUSH_DEBOUNCE_MS = 2000;

export function createStats({ file } = {}) {
  if (!file) throw new Error('stats file path required');

  let data = blank();
  let loaded = false;
  let saltCache = { day: null, salt: null };
  let writeTimer = null;
  let inflight = null;

  async function load() {
    try {
      const raw = await readFile(file, 'utf8');
      const parsed = JSON.parse(raw);
      data = { ...blank(), ...parsed };
      data.totals = { ...blank().totals, ...(parsed.totals ?? {}) };
      data.daily  = parsed.daily  ?? {};
      data.pieces = parsed.pieces ?? {};
      data.salts  = parsed.salts  ?? {};
    } catch {
      // first run or corrupt file — start clean
    }
    loaded = true;
  }

  function record(req, slugOrNull) {
    if (!loaded) return;
    const ua = String(req.headers['user-agent'] ?? '');
    if (BOT_RE.test(ua)) return;

    const ip = clientIp(req);
    const day = todayUtc();
    const hash = visitorHash(ip, ua, day);

    data.totals.views++;

    const dayBucket = data.daily[day] ?? { views: 0, uniques: 0, _seen: {} };
    dayBucket.views++;
    if (!dayBucket._seen[hash]) {
      dayBucket._seen[hash] = 1;
      dayBucket.uniques++;
    }
    data.daily[day] = dayBucket;

    const key = slugOrNull ?? '_root';
    const piece = data.pieces[key] ?? { views: 0, lastSeen: null };
    piece.views++;
    piece.lastSeen = new Date().toISOString();
    data.pieces[key] = piece;

    pruneOldDays();
    scheduleWrite();
  }

  function summary() {
    const daily = {};
    for (const [day, info] of Object.entries(data.daily)) {
      const { _seen, ...rest } = info;
      daily[day] = rest;
    }
    return {
      version: data.version,
      started: data.started,
      totals: data.totals,
      daily,
      pieces: data.pieces,
    };
  }

  function visitorHash(ip, ua, day) {
    const salt = getDailySalt(day);
    return createHash('sha256')
      .update(salt).update('|')
      .update(ip).update('|')
      .update(ua)
      .digest('hex').slice(0, 16);
  }

  function getDailySalt(day) {
    if (saltCache.day === day) return saltCache.salt;
    if (!data.salts[day]) data.salts[day] = randomBytes(16).toString('hex');
    saltCache = { day, salt: data.salts[day] };
    return saltCache.salt;
  }

  function pruneOldDays() {
    const cutoff = isoDay(Date.now() - RETENTION_DAYS * 86_400_000);
    for (const day of Object.keys(data.daily))  if (day < cutoff) delete data.daily[day];
    for (const day of Object.keys(data.salts))  if (day < cutoff) delete data.salts[day];
  }

  function scheduleWrite() {
    if (writeTimer) return;
    writeTimer = setTimeout(() => { writeTimer = null; flush().catch(() => {}); }, FLUSH_DEBOUNCE_MS);
    writeTimer.unref?.();
  }

  async function flush() {
    if (inflight) await inflight;
    inflight = (async () => {
      try {
        await mkdir(dirname(file), { recursive: true });
        const tmp = file + '.tmp';
        await writeFile(tmp, JSON.stringify(data));
        await rename(tmp, file);
      } catch (err) {
        console.error('[stats] flush failed:', err.message);
      }
    })();
    try { await inflight; } finally { inflight = null; }
  }

  return { load, record, summary, flush };
}

export function clientIp(req) {
  const cf = req.headers['cf-connecting-ip'];
  if (cf) return String(cf).trim();
  const real = req.headers['x-real-ip'];
  if (real) return String(real).trim();
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress ?? '';
}

function todayUtc() { return isoDay(Date.now()); }
function isoDay(ms) { return new Date(ms).toISOString().slice(0, 10); }

function blank() {
  return {
    version: 1,
    started: new Date().toISOString(),
    totals: { views: 0 },
    daily: {},
    pieces: {},
    salts: {},
  };
}
