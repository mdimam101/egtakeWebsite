import { v4 as uuid } from "uuid";
import { backendDomain } from "../common/index.jsx";

export const campaignPerformanceUrl = `${backendDomain}/api/campaign-performance`;
const attributionKey = "pyzara:campaign-attribution";
let attribution;
let visitStarted = false;

// Use ?campaignId={{campaign.id}} in Meta's landing URL. IDs stay strings.
export function getCampaignId() {
  const params = new URLSearchParams(window.location.search);
  const incoming = params.get("campaignId") ?? params.get("utm_id");
  if (incoming !== null) {
    const value = incoming.trim();
    if (value && value.length <= 200) {
      attribution = value;
      try { sessionStorage.setItem(attributionKey, value); } catch { /* Storage may be unavailable. */ }
    }
  }
  if (attribution === undefined) {
    try { attribution = sessionStorage.getItem(attributionKey) || null; } catch { attribution = null; }
  }
  return attribution;
}

export function reportCampaignActivity(metrics, campaignId = getCampaignId(), eventId = uuid()) {
  if (!campaignId) return;
  const payload = { campaignId, eventId, ...metrics };
  // One immutable event ID/payload is reused for transient failures.
  const send = async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(campaignPerformanceUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
        if (response.ok || (response.status < 500 && response.status !== 429)) return;
      } catch { /* Reporting must not interrupt shopping. */ }
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  };
  void send();
}

// One stable visit ID per attributed tab session survives document reloads.
export function startCampaignVisit() {
  if (visitStarted) return;
  const campaignId = getCampaignId();
  if (!campaignId) return;
  visitStarted = true;
  const sessionKey = `pyzara:campaign-session:${campaignId}`;
  let session;
  try { session = JSON.parse(sessionStorage.getItem(sessionKey)); } catch { /* Fall back to in-memory session. */ }
  if (!session || typeof session.visitId !== "string") session = { visitId: uuid(), scrollId: uuid(), sampled: false };
  const persist = () => { try { sessionStorage.setItem(sessionKey, JSON.stringify(session)); } catch { /* Optional storage. */ } };
  persist();
  reportCampaignActivity({ websiteVisits: 1 }, campaignId, session.visitId);
  if (session.sampled) return;
  let maximum = 0;
  let finalized = false;
  const measure = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const percent = height > 0 ? (window.scrollY / height) * 100 : 0;
    maximum = Math.max(maximum, Math.min(100, Math.max(0, percent)));
  };
  const finish = () => {
    if (finalized) return;
    finalized = true;
    measure();
    session.sampled = true;
    persist();
    reportCampaignActivity({ scrollPercent: Math.round(maximum * 100) / 100 }, campaignId, session.scrollId);
    window.removeEventListener("scroll", measure);
    window.removeEventListener("pagehide", finish);
    document.removeEventListener("visibilitychange", onVisibility);
  };
  const onVisibility = () => { if (document.visibilityState === "hidden") finish(); };
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("pagehide", finish);
  document.addEventListener("visibilitychange", onVisibility);
  measure();
}

export function trackCampaignBasic(type) {
  if (type === "visit_website") startCampaignVisit();
  if (type === "product_view") reportCampaignActivity({ productViews: 1 });
  if (type === "add_to_cart") reportCampaignActivity({ addToCart: 1 });
}