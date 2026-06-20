import React, { useCallback, useEffect, useMemo, useState } from "react";
import SummaryApi from "../common";
import "../styles/AdminTracking.css";

const RANGE_OPTIONS = [
  { key: "1d", label: "Today", days: 1, by: "day" },
  { key: "7d", label: "1 Week", days: 7, by: "day" },
  { key: "30d", label: "1 Month", days: 30, by: "day" },
  { key: "365d", label: "1 Year", days: 365, by: "month" },
];

const TRACKED_METRICS = [
  "visit_website",
  "visit_app",
  "category_click",
  "search",
  "product_view",
  "add_to_cart",
  "order_confirm",
];

const METRIC_LABELS = {
  visit_website: "Website Visits",
  visit_app: "App Visits",
  category_click: "Category Clicks",
  search: "Searches",
  product_view: "Product Views",
  add_to_cart: "Add to Cart",
  order_confirm: "Orders Confirmed",
};

const METRIC_COLORS = {
  visit_website: "#2563eb",
  visit_app: "#06b6d4",
  category_click: "#8b5cf6",
  search: "#f59e0b",
  product_view: "#10b981",
  add_to_cart: "#ef4444",
  order_confirm: "#111827",
};

const pad = (value) => String(value).padStart(2, "0");

const toDateString = (date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
};

const getRangeDates = (days) => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  return { from: toDateString(from), to: toDateString(to) };
};

const formatMetric = (metric) => METRIC_LABELS[metric] || metric;

const compactNumber = (value) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    Number(value || 0),
  );

const AdminTracking = () => {
  const [rangeKey, setRangeKey] = useState("7d");
  const [summary, setSummary] = useState([]);
  const [series, setSeries] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [searchTerms, setSearchTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeRange = RANGE_OPTIONS.find((item) => item.key === rangeKey) || RANGE_OPTIONS[1];
  const { from, to } = useMemo(() => getRangeDates(activeRange.days), [activeRange.days]);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchJson = useCallback(
    async (url) => {
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Analytics request failed");
      }
      return data;
    },
    [authHeaders],
  );

  const loadAnalytics = useCallback(async () => {
    const params = `from=${from}&to=${to}`;
    const metrics = TRACKED_METRICS.join(",");

    setLoading(true);
    setError("");

    try {
      const [summaryRes, seriesRes, subcategoryRes, searchRes] = await Promise.all([
        fetchJson(`${SummaryApi.analytics_basic_summary.url}?${params}`),
        fetchJson(
          `${SummaryApi.analytics_basic_timeseries.url}?${params}&by=${activeRange.by}&metrics=${encodeURIComponent(metrics)}`,
        ),
        fetchJson(`${SummaryApi.analytics_basic_subcategory.url}?${params}`),
        fetchJson(`${SummaryApi.analytics_basic_search_top.url}?${params}&limit=10`),
      ]);

      setSummary(summaryRes.metrics || []);
      setSeries(seriesRes.rows || []);
      setSubcategories(subcategoryRes.rows || []);
      setSearchTerms(searchRes.terms || []);
    } catch (err) {
      setError(err?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [activeRange.by, fetchJson, from, to]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const summaryMap = useMemo(() => {
    return summary.reduce((acc, item) => {
      acc[item._id] = Number(item.count || 0);
      return acc;
    }, {});
  }, [summary]);

  const totalVisits = (summaryMap.visit_website || 0) + (summaryMap.visit_app || 0);
  const conversionRate = totalVisits
    ? Math.round(((summaryMap.order_confirm || 0) / totalVisits) * 1000) / 10
    : 0;

  const chartData = useMemo(() => {
    const buckets = new Map();

    series.forEach((row) => {
      const bucketRaw = row?._id?.bucket;
      const metric = row?._id?.metric;
      if (!bucketRaw || !metric) return;

      const bucket = String(bucketRaw).slice(0, 10);
      if (!buckets.has(bucket)) buckets.set(bucket, { bucket });
      buckets.get(bucket)[metric] = Number(row.count || 0);
    });

    return Array.from(buckets.values()).sort((a, b) => a.bucket.localeCompare(b.bucket));
  }, [series]);

  const maxChartValue = Math.max(
    1,
    ...chartData.flatMap((row) => TRACKED_METRICS.map((metric) => Number(row[metric] || 0))),
  );

  const subcategoryRows = useMemo(() => {
    const rowsBySubCategory = new Map();

    subcategories.forEach((row) => {
      const subCategory = row?._id?.subCategory || "Uncategorized";
      const metric = row?._id?.metric;
      if (!metric) return;

      if (!rowsBySubCategory.has(subCategory)) {
        rowsBySubCategory.set(subCategory, { subCategory, total: 0 });
      }

      const current = rowsBySubCategory.get(subCategory);
      current[metric] = Number(row.count || 0);
      current.total += Number(row.count || 0);
    });

    return Array.from(rowsBySubCategory.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [subcategories]);

  return (
    <div className="tracking-page">
      <div className="tracking-hero">
        <div>
          <p className="tracking-eyebrow">Analytics</p>
          <h1>User Behaviour Tracking</h1>
          <p>
            Website visit, product view, search, cart and order behaviour এক জায়গায় দেখুন।
          </p>
        </div>
        <button type="button" className="tracking-refresh" onClick={loadAnalytics} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="tracking-toolbar">
        <div className="tracking-range-tabs">
          {RANGE_OPTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === rangeKey ? "active" : ""}
              onClick={() => setRangeKey(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="tracking-date-range">
          {from} → {to}
        </span>
      </div>

      {error && <div className="tracking-error">{error}</div>}

      <section className="tracking-kpi-grid">
        <div className="tracking-kpi-card primary">
          <span>Total Visits</span>
          <strong>{compactNumber(totalVisits)}</strong>
          <small>Website + app visits in selected range</small>
        </div>
        <div className="tracking-kpi-card">
          <span>Product Views</span>
          <strong>{compactNumber(summaryMap.product_view)}</strong>
          <small>Products customers opened</small>
        </div>
        <div className="tracking-kpi-card">
          <span>Add to Cart</span>
          <strong>{compactNumber(summaryMap.add_to_cart)}</strong>
          <small>Successful cart actions</small>
        </div>
        <div className="tracking-kpi-card">
          <span>Orders</span>
          <strong>{compactNumber(summaryMap.order_confirm)}</strong>
          <small>{conversionRate}% visit-to-order rate</small>
        </div>
      </section>

      <section className="tracking-card tracking-chart-card">
        <div className="tracking-section-head">
          <div>
            <h2>Behaviour Trend</h2>
            <p>{activeRange.key === "365d" ? "Monthly" : "Daily"} event graph</p>
          </div>
          <div className="tracking-legend">
            {TRACKED_METRICS.slice(0, 6).map((metric) => (
              <span key={metric}>
                <i style={{ background: METRIC_COLORS[metric] }} />
                {formatMetric(metric)}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="tracking-empty">Loading analytics...</div>
        ) : chartData.length === 0 ? (
          <div className="tracking-empty">No analytics found for this range.</div>
        ) : (
          <div className="tracking-chart-scroll">
            <div className="tracking-chart" style={{ minWidth: Math.max(640, chartData.length * 52) }}>
              {chartData.map((row) => (
                <div className="tracking-chart-day" key={row.bucket}>
                  <div className="tracking-bars">
                    {TRACKED_METRICS.slice(0, 6).map((metric) => {
                      const value = Number(row[metric] || 0);
                      return (
                        <span
                          key={metric}
                          title={`${formatMetric(metric)}: ${value}`}
                          style={{
                            height: `${Math.max(4, (value / maxChartValue) * 160)}px`,
                            background: METRIC_COLORS[metric],
                          }}
                        />
                      );
                    })}
                  </div>
                  <small>{row.bucket.slice(5)}</small>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="tracking-grid-two">
        <section className="tracking-card">
          <div className="tracking-section-head">
            <div>
              <h2>Top Sub Categories</h2>
              <p>Category click, product view, cart, order by subcategory</p>
            </div>
          </div>

          <div className="tracking-table-wrap">
            <table className="tracking-table">
              <thead>
                <tr>
                  <th>SubCategory</th>
                  <th>Click</th>
                  <th>View</th>
                  <th>Cart</th>
                  <th>Order</th>
                </tr>
              </thead>
              <tbody>
                {subcategoryRows.length === 0 ? (
                  <tr>
                    <td colSpan="5">No subcategory data found.</td>
                  </tr>
                ) : (
                  subcategoryRows.map((row) => (
                    <tr key={row.subCategory}>
                      <td>{row.subCategory}</td>
                      <td>{row.category_click || 0}</td>
                      <td>{row.product_view || 0}</td>
                      <td>{row.add_to_cart || 0}</td>
                      <td>{row.order_confirm || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tracking-card">
          <div className="tracking-section-head">
            <div>
              <h2>Top Searches</h2>
              <p>Customers are looking for these terms</p>
            </div>
          </div>

          <div className="tracking-search-list">
            {searchTerms.length === 0 ? (
              <div className="tracking-empty compact">No search data found.</div>
            ) : (
              searchTerms.map((term, index) => {
                const count = Number(term.count || 0);
                const max = Math.max(...searchTerms.map((item) => Number(item.count || 0)), 1);
                return (
                  <div className="tracking-search-row" key={`${term._id}-${index}`}>
                    <div>
                      <strong>{term._id || "Unknown"}</strong>
                      <span>{count} searches</span>
                    </div>
                    <div className="tracking-search-meter">
                      <i style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminTracking;