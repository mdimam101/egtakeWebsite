import { buildProductManagementReport } from "./productManagementAnalytics.js";

export const SALES_PERIOD_OPTIONS = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "last3days", label: "Last 3 days" },
  { key: "thisWeek", label: "This week" },
  { key: "lastWeek", label: "Last week" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "last3months", label: "Last 3 months" },
  { key: "lastYear", label: "Last 1 year" },
];

const list = (value) => Array.isArray(value) ? value : [];
const text = (value) => value == null ? "" : String(value).trim();
const idOf = (value) => text(value && typeof value === "object" ? value._id ?? value.$oid : value);
const pad = (value) => String(value).padStart(2, "0");

function calendarFormatter(timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
}

function localParts(epoch, formatter) {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(epoch))
    .filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute, second: parts.second };
}

// Convert calendar midnight in the selected zone to a UTC instant. This uses
// Intl offsets rather than the execution host's timezone or a fixed UTC offset.
function localMidnight(parts, formatter) {
  const desired = Date.UTC(parts.year, parts.month - 1, parts.day);
  let result = desired;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = localParts(result, formatter);
    const local = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    const corrected = result + desired - local;
    if (corrected === result) break;
    result = corrected;
  }
  return result;
}

function shiftDays(parts, days) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function shiftMonths(parts, months) {
  const index = parts.year * 12 + parts.month - 1 + months;
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { year, month, day: Math.min(parts.day, lastDay) };
}

function orderDate(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === "number") return Number.isFinite(new Date(value).getTime()) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  // Mongoose returns ISO timestamps with a zone. Do not interpret ambiguous
  // timezone-less date-times using whichever timezone the host happens to use.
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*(?:Z|[+-]\d{2}:?\d{2}))?$/i.test(value.trim())) return null;
  const [year, month, day] = value.trim().slice(0, 10).split("-").map(Number);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Date.parse normalizes e.g. February 30 into March. Such malformed API data
  // must be excluded from dated sales rather than silently changing its month.
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) return null;
  const epoch = Date.parse(value);
  return Number.isFinite(epoch) ? epoch : null;
}

// Match the accepted report's duplicate resolution BEFORE checking a date. A
// newer Pending snapshot outside the range must not revive an older sale.
function latestOrders(orders, warn) {
  const unique = new Map();
  for (const order of list(orders)) {
    if (!order || typeof order !== "object") continue;
    const id = idOf(order._id) || text(order.orderId);
    if (!id) { warn("Orders without a stable ID were excluded to prevent duplicate sales."); continue; }
    const previous = unique.get(id);
    if (!previous) { unique.set(id, order); continue; }
    warn("Duplicate order IDs were counted once, using the latest updatedAt snapshot where available.");
    const previousTime = Date.parse(previous.updatedAt);
    const nextTime = Date.parse(order.updatedAt);
    if (Number.isFinite(nextTime) && (!Number.isFinite(previousTime) || nextTime > previousTime)) unique.set(id, order);
    else if ((!Number.isFinite(previousTime) || !Number.isFinite(nextTime) || previousTime === nextTime) && previous.status !== order.status) {
      if (order.status !== "Delivered") unique.set(id, order);
      warn("Conflicting order statuses without a newer timestamp were treated as not Delivered.");
    }
  }
  return [...unique.values()];
}

function rangesFor(now, formatter) {
  const today = localParts(now, formatter);
  const firstOfMonth = { ...today, day: 1 };
  const weekday = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  const monday = shiftDays(today, -((weekday + 6) % 7));
  // End bounds are exclusive. +1ms includes an order stamped exactly at now,
  // while still excluding every timestamp genuinely in the future.
  const currentEnd = now + 1;
  const bounds = {
    all: [null, null],
    today: [localMidnight(today, formatter), currentEnd],
    last3days: [localMidnight(shiftDays(today, -2), formatter), currentEnd],
    thisWeek: [localMidnight(monday, formatter), currentEnd],
    lastWeek: [localMidnight(shiftDays(monday, -7), formatter), localMidnight(monday, formatter)],
    thisMonth: [localMidnight(firstOfMonth, formatter), currentEnd],
    lastMonth: [localMidnight(shiftMonths(firstOfMonth, -1), formatter), localMidnight(firstOfMonth, formatter)],
    last3months: [localMidnight(shiftMonths(today, -3), formatter), currentEnd],
    lastYear: [localMidnight(shiftMonths(today, -12), formatter), currentEnd],
  };
  return SALES_PERIOD_OPTIONS.map((option) => ({ ...option, start: bounds[option.key][0], end: bounds[option.key][1] }));
}


const saleMetrics = (overview) => ({
  deliveredOrders: overview.deliveredOrders,
  soldUnits: overview.soldUnits,
  grossSales: overview.grossSales,
  discount: overview.discount,
  netSales: overview.netSales,
  costOfGoodsSold: overview.costOfGoodsSold,
  grossProfit: overview.grossProfit,
  profitMargin: overview.profitMargin,
});

function breakdown(products, datedOrders, formatter, monthly) {
  const groups = new Map();
  for (const entry of datedOrders) {
    const parts = localParts(entry.date, formatter);
    const key = `${parts.year}-${pad(parts.month)}${monthly ? "" : `-${pad(parts.day)}`}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry.order);
  }
  // A breakdown only needs sold-product costs. Avoid rebuilding the complete
  // inventory for each day in a long report, without changing sales accounting.
  const catalog = new Map();
  for (const product of list(products)) {
    const id = idOf(product?._id);
    if (id && !catalog.has(id)) catalog.set(id, product);
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([key, orders]) => {
    const ids = new Set(orders.flatMap((order) => list(order.items).map((item) => idOf(item?.productId))));
    const referencedProducts = [...ids].map((id) => catalog.get(id)).filter(Boolean);
    const report = buildProductManagementReport(referencedProducts, orders);
    // ISO calendar labels stay unambiguous and cannot shift to another day
    // when a consumer formats them in a different browser timezone.
    return { key, label: key, ...saleMetrics(report.overview) };
  });
}

/**
 * Date windows change sales only; inventory is always the current API snapshot.
 * Reporting date is order.createdAt, not updatedAt or an inferred delivery date.
 * All time preserves the accepted engine's behavior for undated/future orders;
 * dated views exclude them and expose explicit warnings rather than guess dates.
 */
export function createPeriodAnalytics(products, orders, {
  now = new Date(), timeZone = "Asia/Tokyo", period = "all",
} = {}) {
  const epoch = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (!Number.isFinite(epoch)) throw new RangeError("A valid reporting time is required.");
  const formatter = calendarFormatter(timeZone); // Invalid IANA zones fail explicitly.
  const warnings = new Set();
  const unique = latestOrders(orders, (warning) => warnings.add(warning));
  const dated = [];
  let undatedDeliveredOrders = 0;
  let futureDatedDeliveredOrders = 0;
  for (const order of unique) {
    if (order.status !== "Delivered") continue;
    const date = orderDate(order.createdAt);
    if (date === null) undatedDeliveredOrders += 1;
    else if (date > epoch) futureDatedDeliveredOrders += 1;
    else dated.push({ order, date });
  }
  if (undatedDeliveredOrders) warnings.add(`${undatedDeliveredOrders} Delivered order(s) have missing or invalid createdAt dates. All-time totals retain them; dated filters and daily/monthly breakdowns exclude them.`);
  if (futureDatedDeliveredOrders) warnings.add(`${futureDatedDeliveredOrders} Delivered order(s) have future createdAt dates. All-time totals retain them; dated filters and daily/monthly breakdowns exclude them.`);
  const ranges = rangesFor(epoch, formatter);
  const selectedKey = ranges.some((range) => range.key === period) ? period : "all";
  let selectedReport;
  let selectedDated;
  const periods = ranges.map((range) => {
    const inRange = range.key === "all" ? dated : dated.filter((entry) => entry.date >= range.start && entry.date < range.end);
    // All time uses original input so the accepted engine retains its warnings
    // and complete behavior. Other windows use already-resolved current orders.
    const report = buildProductManagementReport(products, range.key === "all" ? orders : inRange.map((entry) => entry.order));
    if (range.key === selectedKey) { selectedReport = report; selectedDated = inRange; }
    return {
      key: range.key, label: range.label,
      start: range.start === null ? null : new Date(range.start).toISOString(),
      end: range.end === null ? null : new Date(range.end).toISOString(),
      overview: report.overview,
    };
  });
  const combinedWarnings = [...new Set([...selectedReport.warnings, ...warnings])];
  return {
    periods,
    selectedPeriod: periods.find((range) => range.key === selectedKey),
    selectedReport: { ...selectedReport, warnings: combinedWarnings },
    daily: breakdown(products, selectedDated, formatter, false),
    monthly: breakdown(products, selectedDated, formatter, true),
    warnings: combinedWarnings,
    undatedDeliveredOrders,
    futureDatedDeliveredOrders,
    timeZone,
    dateField: "createdAt",
  };
}
