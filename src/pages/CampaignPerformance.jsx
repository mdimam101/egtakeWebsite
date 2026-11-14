import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { campaignPerformanceUrl } from "../helpers/campaignPerformance";
import "../styles/CampaignPerformance.css";
import { aggregateCampaignEvents } from "../helpers/campaignMetrics";

const ranges = [1, 2, 3, 6, 12, 24, 48, 72];
const date = value => value ? new Date(value).toLocaleString() : "—";
const metrics = [
  ["websiteVisits", "Website visits"],
  ["productViews", "Product views"],
  ["addToCart", "Add to cart"],
  ["averageScrollPercent", "Average scroll"],
];

export default function CampaignPerformance() {
  const [events, setEvents] = useState([]);
  const [range, setRange] = useState("1");
  const [now, setNow] = useState(Date.now);
  const campaigns = useMemo(() => aggregateCampaignEvents(events, range, now), [events, range, now]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const request = useRef(0);
  const busyDelete = useRef(false);
  const controller = useRef(null);

  const load = useCallback(async () => {
    const current = ++request.current;
    controller.current?.abort();
    controller.current = new AbortController();
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(campaignPerformanceUrl, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.current.signal,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load campaigns");
      if (!Array.isArray(result.data)) throw new Error("Invalid campaign response");
      if (request.current !== current) return;
      const timestamp = Date.now();
      const rows = aggregateCampaignEvents(result.data, "all", timestamp);
      setEvents(result.data);
      setNow(timestamp);
      setSelectedId(id => rows.some(row => row.campaignId === id) ? id : rows[0]?.campaignId ?? null);
    } catch (err) {
      if (current === request.current && err.name !== "AbortError") setError(err.message);
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, []);
   useEffect(() => {
    void load();
    const timer = setInterval(() => { if (!busyDelete.current) void load(); }, 60000);
    return () => { clearInterval(timer); request.current += 1; controller.current?.abort(); };
  }, [load]);

  const remove = async id => {
    if (busyDelete.current || !window.confirm(`Delete all performance data for campaign "${id}"? Other campaigns will be preserved. Active reporting may recreate it.`)) return;
    busyDelete.current = true;
    setDeleting(id);
    request.current += 1;
    controller.current?.abort();
    setLoading(false);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${campaignPerformanceUrl}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to delete campaign");
      setEvents(rows => rows.filter(row => row.campaignId !== id));
      setSelectedId(current => current === id ? null : current);
    } catch (err) { setError(err.message); }
    finally { busyDelete.current = false; setDeleting(null); }
  };

  const selected = campaigns.find(row => row.campaignId === selectedId);
  return <section className="campaign-page">
    <header className="campaign-hero">
      <div><p>Campaign analytics</p><h1>Campaign Performance</h1><p>Compare visits, product views, cart actions and scroll engagement.</p></div>
      <button onClick={load} disabled={loading || deleting !== null}>{loading ? "Refreshing…" : "Refresh"}</button>
    </header>
    <div className="campaign-toolbar">
      <label>Time range <select value={range} onChange={event => { setRange(event.target.value); setNow(Date.now()); }}>
        <option value="all">All time</option>
        {ranges.map(hours => <option key={hours} value={hours}>Last {hours < 24 ? `${hours} hour${hours > 1 ? "s" : ""}` : `${hours / 24} day${hours > 24 ? "s" : ""}`}</option>)}
      </select></label>
      <span>Newest campaigns first · refreshes every minute</span>
    </div>
     <p className="campaign-note">Figures use server event timestamps within the selected rolling period. Visits are reported sessions, not unique people. Scroll records one maximum-depth sample when an attributed session is first hidden or exited. Campaigns without activity in this period show zero counts.</p>
    {error && <p role="alert" className="campaign-error">{error}</p>}
    <div className="campaign-layout" aria-busy={loading}>
      <div className="campaign-list">
        {!loading && !error && campaigns.length === 0 && <p>No campaign data yet. Use <code>?campaignId=YOUR_META_CAMPAIGN_ID</code> in the landing URL.</p>}
        {campaigns.map(campaign => <article key={campaign.campaignId} className={selectedId === campaign.campaignId ? "active" : ""}>
          <button className="campaign-open" onClick={() => setSelectedId(campaign.campaignId)} aria-pressed={selectedId === campaign.campaignId}>
            <strong>{campaign.campaignId}</strong><small>First activity: {date(campaign.createdAt)}</small><span>{campaign.websiteVisits ?? 0} visits · {campaign.productViews ?? 0} views</span>
          </button>
          <button className="campaign-delete" disabled={deleting !== null} onClick={() => remove(campaign.campaignId)} aria-label={`Delete campaign ${campaign.campaignId}`}>{deleting === campaign.campaignId ? "Deleting…" : "Delete"}</button>
        </article>)}
      </div>
      <section className="campaign-details">
        {selected ? <>
          <h2>{selected.campaignId}</h2><p>{range === "all" ? "All-time performance" : `Last ${Number(range) < 24 ? `${range} hour(s)` : `${Number(range) / 24} day(s)`}`} · as of {date(now)}</p>
          <div className="campaign-metrics">{metrics.map(([key, label]) => <div key={key}><span>{label}</span><strong>{key === "averageScrollPercent" ? selected[key] == null ? "No samples" : `${selected[key]}%` : (selected[key] ?? 0).toLocaleString()}</strong></div>)}</div>
          <dl><dt>Scroll samples</dt><dd>{selected.scrollSamples ?? 0}</dd><dt>First activity</dt><dd>{date(selected.createdAt)}</dd><dt>Latest activity</dt><dd>{date(selected.updatedAt)}</dd></dl>
        </> : <p>{loading ? "Loading campaigns…" : "Select a campaign to view its details."}</p>}
      </section>
    </div>
  </section>;
}