// Group the full event history, retaining inactive campaigns in every range.
export function aggregateCampaignEvents(events, hours = "all", now = Date.now()) {
  const cutoff = hours === "all" ? -Infinity : now - Number(hours) * 3600000;
  const groups = new Map();
  for (const event of events) {
    if (typeof event?.campaignId !== "string" || !event.campaignId) continue;
    const time = Date.parse(event.createdAt);
    if (!Number.isFinite(time) || time > now) continue;
    let row = groups.get(event.campaignId);
    if (!row) {
      row = { campaignId: event.campaignId, createdAt: event.createdAt, updatedAt: event.createdAt,
        websiteVisits: 0, productViews: 0, addToCart: 0, scrollSamples: 0, scrollTotal: 0, seen: new Set() };
      groups.set(event.campaignId, row);
    }
    if (time < Date.parse(row.createdAt)) row.createdAt = event.createdAt;
    if (time > Date.parse(row.updatedAt)) row.updatedAt = event.createdAt;
    if (time < cutoff) continue;
    if (typeof event.eventId === "string") {
      if (row.seen.has(event.eventId)) continue;
      row.seen.add(event.eventId);
    }
    for (const key of ["websiteVisits", "productViews", "addToCart"]) {
      if (Number.isSafeInteger(event[key]) && event[key] >= 0) row[key] += event[key];
    }
    if (typeof event.scrollPercent === "number" && Number.isFinite(event.scrollPercent) && event.scrollPercent >= 0 && event.scrollPercent <= 100) {
      row.scrollSamples += 1;
      row.scrollTotal += event.scrollPercent;
    }
  }
  return Array.from(groups.values(), (group) => {
    const row = { ...group };
    delete row.seen;
    delete row.scrollTotal;
    return { ...row, averageScrollPercent: row.scrollSamples ? Math.round(group.scrollTotal / row.scrollSamples * 100) / 100 : null };
  }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.campaignId.localeCompare(b.campaignId));
}
