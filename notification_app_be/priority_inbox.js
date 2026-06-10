/**
 * Stage 6 – Priority Inbox
 *
 * Fetches notifications from the evaluation API and ranks them using a composite
 * score that combines:
 *   - Type weight : Placement (3) > Result (2) > Event (1)
 *   - Recency     : Unix timestamp of the notification (ms)
 *
 * Score = (weight × 10_000_000_000_000) + timestamp_ms
 *
 * This ensures type weight always dominates, and within the same type the
 * most-recent notification wins.
 *
 * Maintains the top-N efficiently using a Min-Heap so that as new
 * notifications stream in we only keep the best N at any time — O(log N)
 * per insertion vs O(N log N) for a full sort.
 */

'use strict';

const axios  = require('axios');
const logger = require('../logging_middleware/logger');

// ─── Configuration ────────────────────────────────────────────────────────────
const API_URL  = 'http://4.224.186.213/evaluation-service/notifications';
const TOP_N    = parseInt(process.argv[2], 10) || 10;   // default top-10; pass a number as CLI arg

// Type weights (Placement > Result > Event)
const TYPE_WEIGHT = {
  Placement : 3,
  Result    : 2,
  Event     : 1,
};

// ─── Scoring helper ───────────────────────────────────────────────────────────
function parseTimestamp(raw) {
  if (!raw) return 0;
  // API returns "YYYY-MM-DD HH:MM:SS" — replace space with T for valid ISO 8601
  return new Date(raw.replace(' ', 'T')).getTime() || 0;
}

function score(notification) {
  const weight  = TYPE_WEIGHT[notification.Type] || 0;
  const tsMs    = parseTimestamp(notification.Timestamp);
  return (weight * 10_000_000_000_000) + tsMs;
}

// ─── Min-Heap for Top-N ───────────────────────────────────────────────────────
// Keeps exactly N elements; the root is always the *lowest-priority* element
// so we can quickly decide whether a new notification beats the worst in the heap.

class MinHeap {
  constructor(capacity) {
    this.capacity = capacity;
    this.data     = [];                     // [ { notification, score } ]
  }

  get size() { return this.data.length; }

  _swap(i, j) {
    [this.data[i], this.data[j]] = [this.data[j], this.data[i]];
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.data[parent].score > this.data[i].score) {
        this._swap(parent, i);
        i = parent;
      } else break;
    }
  }

  _sinkDown(i) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.data[l].score < this.data[smallest].score) smallest = l;
      if (r < n && this.data[r].score < this.data[smallest].score) smallest = r;
      if (smallest === i) break;
      this._swap(i, smallest);
      i = smallest;
    }
  }

  // Returns the minimum score in the heap (i.e. worst item currently kept)
  peekMin() {
    return this.data.length ? this.data[0].score : -Infinity;
  }

  push(notification, notifScore) {
    if (this.size < this.capacity) {
      this.data.push({ notification, score: notifScore });
      this._bubbleUp(this.data.length - 1);
    } else if (notifScore > this.peekMin()) {
      // New item beats the current worst — replace root
      this.data[0] = { notification, score: notifScore };
      this._sinkDown(0);
    }
    // Otherwise the new item is not good enough — discard
  }

  // Return items sorted highest-score first (descending priority)
  toSortedArray() {
    return [...this.data]
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.notification);
  }
}

// ─── Display helper ───────────────────────────────────────────────────────────
const TYPE_LABEL = {
  Placement : '🏢 Placement',
  Result    : '📋 Result   ',
  Event     : '🎉 Event    ',
};

function formatTable(notifications) {
  const SEPARATOR = '─'.repeat(105);
  const lines = [
    '',
    `  ╔${'═'.repeat(103)}╗`,
    `  ║${'   🔔  PRIORITY INBOX — TOP ' + notifications.length + ' NOTIFICATIONS'.padEnd(76)}║`,
    `  ╚${'═'.repeat(103)}╝`,
    '',
    `  ${'Rank'.padEnd(6)}${'Type'.padEnd(16)}${'Timestamp'.padEnd(24)}${'Message'}`,
    `  ${SEPARATOR}`,
  ];

  notifications.forEach((n, idx) => {
    const rank    = `#${idx + 1}`.padEnd(6);
    const type    = (TYPE_LABEL[n.Type] || n.Type).padEnd(16);
    const ts      = (n.Timestamp || '').padEnd(24);
    const message = n.Message || '';
    lines.push(`  ${rank}${type}${ts}${message}`);
  });

  lines.push(`  ${SEPARATOR}`);
  lines.push('');
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  logger.info('priority-inbox', `starting priority inbox – requesting top ${TOP_N} notifications`);

  // 1. Obtain auth token via existing logger infrastructure
  const token = await logger.getAuthToken();
  if (!token) {
    logger.error('priority-inbox', 'failed to acquire auth token – aborting');
    process.exit(1);
  }
  logger.info('priority-inbox', 'auth token acquired successfully');

  // 2. Fetch notifications from the evaluation API
  let rawNotifications = [];
  try {
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const body = response.data;
    rawNotifications =
      body.notifications ||
      body.data          ||
      (Array.isArray(body) ? body : []);

    logger.info('priority-inbox', `fetched ${rawNotifications.length} raw notifications from API`);
  } catch (err) {
    logger.error('priority-inbox', `API fetch failed: ${err.message}`);
    process.exit(1);
  }

  if (rawNotifications.length === 0) {
    logger.warn('priority-inbox', 'no notifications returned by API');
    console.log('\n  No notifications found.\n');
    return;
  }

  // 3. Build priority ranking using Min-Heap (O(M log N), M = total, N = top-N)
  const heap = new MinHeap(TOP_N);

  for (const notif of rawNotifications) {
    const s = score(notif);
    heap.push(notif, s);
  }

  const topNotifications = heap.toSortedArray();
  logger.info('priority-inbox', `computed top ${topNotifications.length} priority notifications`);

  // 4. Display results
  console.log(formatTable(topNotifications));

  // 5. Also print raw JSON for verification
  console.log('  Raw JSON output:\n');
  console.log(JSON.stringify(topNotifications, null, 2));
  console.log('');
}

main();
