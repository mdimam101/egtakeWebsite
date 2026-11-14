import SummaryApi from "../common";
import { trackCampaignBasic } from "./campaignPerformance";

export async function trackBasic(type, extra = {}) {
  try { trackCampaignBasic(type); } catch { /* Campaign reporting is independent. */ }
  try {
    await fetch(SummaryApi.track_basic.url, {
      method: SummaryApi.track_basic.method.toUpperCase(),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...extra }),
    });
  } catch {
    // Analytics must never block the user experience.
  }
}

export default trackBasic;