import React, { Fragment, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle, FiArrowDown, FiBox, FiCalendar, FiCheckCircle, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiDollarSign, FiLayers, FiPackage,
  FiRefreshCw, FiSearch, FiTrendingUp,
} from "react-icons/fi";
import SummaryApi from "../common";
import { createPeriodAnalytics } from "../helpers/productManagementPeriods";
import { loadProductManagementData } from "../helpers/productManagementData";
import "../styles/ProductManagement.css";

const PAGE_SIZE = 20;
const numberFormat = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 });
const money = (value) => value == null ? "—" : `৳${numberFormat.format(value)}`;
const count = (value) => value == null ? "—" : numberFormat.format(value);
const percent = (value) => value == null ? "—" : `${numberFormat.format(value)}%`;
const profitClass = (value) => value == null ? "" : value < 0 ? "pm-negative" : "pm-positive";

function ProductImage({ src, name }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? (
    <img className="pm-product-image" src={src} alt={name || "Product"} loading="lazy" onError={() => setFailed(true)} />
  ) : <span className="pm-product-image pm-image-placeholder" aria-label="No product image"><FiPackage /></span>;
}

function StockBadge({ status }) {
  const tone = status === "In Stock" ? "good" : status === "Low Stock" ? "low" : status === "Out of Stock" ? "out" : "unknown";
  return <span className={`pm-stock-badge pm-stock-${tone}`}><span />{status || "Unknown stock"}</span>;
}

function Metric({ label, value, icon: Icon, note, tone = "" }) {
  return <div className={`pm-metric ${tone}`}>
    <div className="pm-metric-top"><span>{label}</span>{Icon && <Icon aria-hidden="true" />}</div>
    <strong>{value}</strong>
    {note && <span className="pm-metric-note">{note}</span>}
  </div>;
}

function VariationDetails({ product }) {
  return <div className="pm-variation-panel">
    <div className="pm-variation-heading"><FiLayers /><strong>Variation breakdown</strong><span>{product.name}</span></div>
    <table className="pm-variation-table">
      <caption className="pm-sr-only">Variation inventory and delivered sales for {product.name}</caption>
      <thead><tr>
        <th scope="col">Variation / size</th><th scope="col">Quantity¹</th><th scope="col">Stock</th>
        <th scope="col">Sold</th><th scope="col">Buying price</th><th scope="col">Selling price</th>
        <th scope="col">Unit profit</th><th scope="col">Gross sales</th><th scope="col">Net sales</th>
        <th scope="col">Est. gross profit</th><th scope="col">Margin</th><th scope="col">Stock value</th>
      </tr></thead>
      <tbody>{product.variants.map((variant) => <tr key={variant.id} className={variant.unmatched ? "pm-unmatched-row" : variant.stockStatus === "Low Stock" ? "pm-low-row" : ""}>
        <th scope="row"><div className="pm-variation-identity">
          <ProductImage src={variant.image} name={variant.name || product.name} />
          <div><strong>{variant.unmatched ? "Unmatched order items" : [variant.color, variant.size].filter(Boolean).join(" / ") || "Standard"}</strong>
            <small>{variant.unmatched ? `${[variant.color, variant.size].filter(Boolean).join(" / ") || "Color / size not supplied"} · no stock assigned` : variant.name || "Standard variation"}</small>
            {!variant.unmatched && <StockBadge status={variant.stockStatus} />}
          </div>
        </div></th>
        <td title="Original inventory quantity is not supplied by these APIs">{count(variant.quantity)}</td>
        <td>{count(variant.stock)}</td><td>{count(variant.sold)}</td>
        <td>{money(variant.buyingPrice)}</td><td>{money(variant.sellingPrice)}</td>
        <td className={profitClass(variant.unitProfit)}>{money(variant.unitProfit)}</td>
        <td>{money(variant.grossSales)}</td><td>{money(variant.netSales)}</td>
        <td className={profitClass(variant.grossProfit)}>{money(variant.grossProfit)}</td>
        <td>{percent(variant.profitMargin)}</td><td>{money(variant.stockValue)}</td>
      </tr>)}</tbody>
    </table>
    {product.issues?.length > 0 && <ul className="pm-product-issues">{product.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
  </div>;
}

// A range avoids implying that differently priced variations share one unit price.
function productPrice(product, field) {
  const variants = product.variants.filter((variant) => !variant.unmatched);
  if (!variants.length) return money(product[field]);
  const values = variants.map((variant) => variant[field]);
  if (values.some((value) => value == null)) return "—";
  const low = Math.min(...values);
  const high = Math.max(...values);
  return low === high ? money(low) : `${money(low)} – ${money(high)}`;
}

export default function ProductManagement() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [stock, setStock] = useState("all");
  const [sort, setSort] = useState("netSales");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(new Set());
  const [period, setPeriod] = useState("all");
  const [timeZone, setTimeZone] = useState("Asia/Tokyo");
  const [reportNow, setReportNow] = useState(() => new Date());
  const [breakdown, setBreakdown] = useState("daily");
  const [breakdownPage, setBreakdownPage] = useState(1);
  const clientKey = import.meta.env.VITE_PUBLIC_CLIENT_KEY;
  
  useEffect(() => {
    const timer = setInterval(() => setReportNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    loadProductManagementData({
      productsUrl: SummaryApi.get_product.url,
      ordersUrl: SummaryApi.get_all_orders.url,
      clientKey,
      token: localStorage.getItem("authToken"),
      signal: controller.signal,
    }).then((data) => {
      if (!controller.signal.aborted) {
        const updatedAt = new Date();
        setSnapshot({ ...data, updatedAt });
        setReportNow(updatedAt);
      }
    }).catch((err) => {
      if (!controller.signal.aborted) setError(err.message || "Could not load inventory and orders. Please try again.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [clientKey, refresh]);

  const analytics = useMemo(() => snapshot ? createPeriodAnalytics(snapshot.products, snapshot.orders, { now: reportNow, timeZone, period }) : null, [snapshot, reportNow, timeZone, period]);
  const report = analytics?.selectedReport;
  const categories = useMemo(() => [...new Set(report?.products.map((product) => product.category).filter(Boolean))].sort(), [report]);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (report?.products || []).filter((product) =>
      (!search || [product.id, product.code, product.name].some((value) => String(value || "").toLowerCase().includes(search))) &&
      (category === "all" || product.category === category) &&
      (stock === "all" || product.stockStatus === stock),
    ).sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (a[sort] == null) return b[sort] == null ? a.name.localeCompare(b.name) : 1;
      if (b[sort] == null) return -1;
      return b[sort] - a[sort] || a.name.localeCompare(b.name);
    });
  }, [report, query, category, stock, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleProducts = filtered.slice(start, start + PAGE_SIZE);
  const overview = report?.overview;
  const periodName = analytics?.selectedPeriod.label || "All time";
  const breakdownRows = analytics ? analytics[breakdown] : [];
  const breakdownPages = Math.max(1, Math.ceil(breakdownRows.length / PAGE_SIZE));
  const currentBreakdownPage = Math.min(breakdownPage, breakdownPages);
  const breakdownStart = (currentBreakdownPage - 1) * PAGE_SIZE;
  const visibleBreakdown = breakdownRows.slice(breakdownStart, breakdownStart + PAGE_SIZE);
  const selectPeriod = (key) => { setPeriod(key); setPage(1); setBreakdownPage(1); };
  const formatDate = (value) => new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
  const hasFilters = query || category !== "all" || stock !== "all";
  const changeFilter = (setter) => (event) => { setter(event.target.value); setPage(1); };
  const clearFilters = () => { setQuery(""); setCategory("all"); setStock("all"); setPage(1); };
  const toggleProduct = (id) => setExpanded((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return <section className="pm-page" aria-labelledby="pm-title" aria-busy={loading}>
    <header className="pm-header">
      <div><span className="pm-eyebrow"><FiBox /> PYZARA · OPERATIONS</span>
        <h1 id="pm-title">Product Management</h1>
        <p>Your inventory, delivered sales, and product profitability in one place.</p>
      </div>
      <div className="pm-header-actions">
        <span className="pm-delivered-label"><FiCheckCircle /> Delivered orders only</span>
        <button type="button" className="pm-button pm-button-primary" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>
          <FiRefreshCw className={loading ? "pm-spin" : ""} />{loading ? "Refreshing…" : "Refresh data"}
        </button>
      </div>
    </header>

    {error && <div className="pm-alert pm-error" role="alert"><FiAlertCircle /><div><strong>Unable to refresh product management</strong><p>{error}</p>
      {snapshot && <p>Showing the last successful snapshot. These figures may be out of date.</p>}
      {!clientKey && <p>The product API client key is not configured for this environment.</p>}
    </div><button type="button" className="pm-button" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>Try again</button></div>}

    {loading && !report ? <div className="pm-loading" role="status"><FiRefreshCw className="pm-spin" /><strong>Preparing your inventory report</strong><span>Loading products and orders together…</span></div> : report && <>
      <div className="pm-period-panel">
        <div className="pm-period-heading"><div><h2><FiCalendar /> Sales by period</h2><p>Delivered orders grouped by their order date. Select a period to update the report below.</p></div>
          <div className="pm-period-controls">
            <label>Report period<select aria-label="Report period" value={period} onChange={(event) => selectPeriod(event.target.value)}>{analytics.periods.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label>
            <label>Reporting timezone<select aria-label="Reporting timezone" value={timeZone} onChange={(event) => { setTimeZone(event.target.value); setPage(1); setBreakdownPage(1); }}><option value="Asia/Tokyo">Japan · Asia/Tokyo</option><option value="Asia/Dhaka">Bangladesh · Asia/Dhaka</option><option value="UTC">UTC</option></select></label>
          </div>
        </div>
        <div className="pm-period-cards" role="group" aria-label="Sales period summaries">
          {analytics.periods.filter((option) => option.key !== "all").map((option) => <button key={option.key} type="button" className={`pm-period-card ${period === option.key ? "pm-period-selected" : ""}`} aria-pressed={period === option.key} onClick={() => selectPeriod(option.key)}>
            <span>{option.label}</span><strong>{money(option.overview.netSales)}</strong><small>Net sales · {count(option.overview.soldUnits)} units · {count(option.overview.deliveredOrders)} orders</small>
          </button>)}
        </div>
        <div className="pm-period-note"><span>{analytics.selectedPeriod.start ? `${formatDate(analytics.selectedPeriod.start)} – ${formatDate(new Date(analytics.selectedPeriod.end).getTime() - 1)}` : "All available order dates"} · {timeZone}</span><span>Last 3 days includes today · Week: Monday–Sunday · Stock is current</span></div>
      </div>

      <div className="pm-section-label"><h2>Business overview</h2><span>All products · Sales: {periodName}{snapshot && <> · Updated {snapshot.updatedAt.toLocaleTimeString([], { timeZone, hour: "2-digit", minute: "2-digit" })}</>}</span></div>
      <div className="pm-primary-metrics">
        <Metric label="Net product sales" value={money(overview.netSales)} icon={FiDollarSign} note="After allocated discounts · excludes delivery" tone="pm-metric-featured" />
        <Metric label="Estimated gross profit" value={money(overview.grossProfit)} icon={FiTrendingUp} note="Based on current buying costs" />
        <Metric label="Current stock" value={count(overview.totalStock)} icon={FiPackage} note="Available units from the product API" />
        <Metric label="Inventory stock value" value={money(overview.stockValue)} icon={FiBox} note="Current stock × current buying cost" />
      </div>
      <div className="pm-secondary-metrics">
        <Metric label="Products" value={count(overview.totalProducts)} />
        <Metric label="Variations" value={count(overview.totalVariations)} />
        <Metric label="Delivered orders" value={count(overview.deliveredOrders)} />
        <Metric label="Sold units" value={count(overview.soldUnits)} />
        <Metric label="Gross sales" value={money(overview.grossSales)} />
        <Metric label="Profit margin" value={percent(overview.profitMargin)} />
        <Metric label="Low stock products" value={count(overview.lowStockProducts)} tone="pm-metric-warning" />
        <Metric label="Out of stock" value={count(overview.outOfStockProducts)} tone="pm-metric-danger" />
      </div>

      {report.warnings?.length > 0 && <details className="pm-data-notice"><summary><FiAlertCircle /> Data quality notes <span>{report.warnings.length}</span></summary>
        <ul>{report.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
      </details>}

      <section className="pm-breakdown-card" aria-labelledby="pm-breakdown-title">
        <div className="pm-inventory-heading"><div><h2 id="pm-breakdown-title">Daily & monthly sales</h2><p>{periodName} · {timeZone} · Only dates with Delivered orders are listed.</p></div>
          <div className="pm-breakdown-tabs" role="group" aria-label="Sales breakdown"><button type="button" aria-pressed={breakdown === "daily"} onClick={() => { setBreakdown("daily"); setBreakdownPage(1); }}>Daily</button><button type="button" aria-pressed={breakdown === "monthly"} onClick={() => { setBreakdown("monthly"); setBreakdownPage(1); }}>Monthly</button></div>
        </div>
        {visibleBreakdown.length ? <>
          <div className="pm-table-scroll" role="region" aria-label="Sales by date" tabIndex={0}>
            <table className="pm-sales-table"><caption className="pm-sr-only">{breakdown === "daily" ? "Daily" : "Monthly"} delivered-order sales for {periodName}</caption><thead><tr><th scope="col">{breakdown === "daily" ? "Date" : "Month"}</th><th scope="col">Delivered orders</th><th scope="col">Sold units</th><th scope="col">Gross sales</th><th scope="col">Discounts</th><th scope="col">Net sales</th><th scope="col">Est. gross profit</th></tr></thead>
              <tbody>{visibleBreakdown.map((row) => <tr key={row.key}><th scope="row">{row.label}</th><td>{count(row.deliveredOrders)}</td><td>{count(row.soldUnits)}</td><td>{money(row.grossSales)}</td><td>{money(row.discount)}</td><td className="pm-cell-strong">{money(row.netSales)}</td><td className={profitClass(row.grossProfit)}>{money(row.grossProfit)}</td></tr>)}</tbody>
            </table>
          </div>
          {breakdownPages > 1 && <div className="pm-pagination"><span>Showing {breakdownStart + 1}–{Math.min(breakdownStart + PAGE_SIZE, breakdownRows.length)} of {breakdownRows.length} {breakdown === "daily" ? "days" : "months"}</span><div><button type="button" className="pm-button" aria-label="Previous sales dates" disabled={currentBreakdownPage === 1} onClick={() => setBreakdownPage(currentBreakdownPage - 1)}><FiChevronLeft /></button><span>Page {currentBreakdownPage} of {breakdownPages}</span><button type="button" className="pm-button" aria-label="Next sales dates" disabled={currentBreakdownPage === breakdownPages} onClick={() => setBreakdownPage(currentBreakdownPage + 1)}><FiChevronRight /></button></div></div>}
        </> : <div className="pm-breakdown-empty">No dated Delivered orders in this period.</div>}
      </section>

      <div className="pm-inventory-card">
        <div className="pm-inventory-heading"><div><h2>Inventory & sales</h2><p>Expand a product to inspect color and size performance. Sales: {periodName}.</p></div><span className="pm-result-count">{filtered.length} of {report.products.length} products</span></div>
        <div className="pm-filters">
          <label className="pm-search"><span className="pm-sr-only">Search products</span><FiSearch /><input type="search" placeholder="Search name, product code or ID…" value={query} onChange={changeFilter(setQuery)} /></label>
          <label><span>Category</span><select aria-label="Category" value={category} onChange={changeFilter(setCategory)}><option value="all">All categories</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Stock status</span><select aria-label="Stock status" value={stock} onChange={changeFilter(setStock)}><option value="all">All stock statuses</option>{["In Stock", "Low Stock", "Out of Stock", "Unknown"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Sort by</span><select aria-label="Sort by" value={sort} onChange={changeFilter(setSort)}><option value="netSales">Net sales: high to low</option><option value="grossSales">Gross sales: high to low</option><option value="sold">Sold units: high to low</option><option value="grossProfit">Gross profit: high to low</option><option value="name">Product name: A–Z</option></select></label>
          {hasFilters && <button type="button" className="pm-clear" onClick={clearFilters}>Clear filters</button>}
        </div>
        {visibleProducts.length ? <>
          <div className="pm-table-hint"><FiArrowDown /> Select a product for its variations <span>Scroll horizontally for all financial columns →</span></div>
          <div className="pm-table-scroll" tabIndex={0} role="region" aria-label="Product inventory and sales table">
            <table className="pm-main-table">
              <caption className="pm-sr-only">Current product inventory and sales from parent orders with status Delivered only</caption>
              <thead><tr><th scope="col">No.</th><th scope="col">Product / code</th><th scope="col">Stock status</th><th scope="col">Main quantity¹</th><th scope="col">Main stock</th><th scope="col">Total sold</th><th scope="col">Buying price</th><th scope="col">Selling price</th><th scope="col">Unit profit</th><th scope="col">Gross sales</th><th scope="col">Discounts</th><th scope="col">Net sales</th><th scope="col">Est. gross profit</th><th scope="col">Margin</th><th scope="col">Stock value</th></tr></thead>
              <tbody>{visibleProducts.map((product, index) => <Fragment key={product.id}>
                <tr className={expanded.has(product.id) ? "pm-product-expanded" : ""}>
                  <td className="pm-row-number">{start + index + 1}</td>
                  <th scope="row"><button type="button" className="pm-product-toggle" aria-expanded={expanded.has(product.id)} aria-controls={`pm-variants-${start + index}`} onClick={() => toggleProduct(product.id)}>
                    <FiChevronDown className={expanded.has(product.id) ? "pm-chevron-open" : ""} /><ProductImage src={product.image} name={product.name} />
                    <span className="pm-product-text"><strong>{product.name}</strong><span>{product.code || "No product code"}</span><small>{product.deleted ? "Deleted product · historical sales" : `${product.variants.filter((variant) => !variant.unmatched).length} variation(s) · ${product.category || "Uncategorized"}`}</small><small className="pm-product-id">ID: {product.id}</small></span>
                  </button>{product.unmatchedSold > 0 && <span className="pm-unmatched-note">{count(product.unmatchedSold)} unmatched sold units</span>}</th>
                  <td><StockBadge status={product.stockStatus} /></td>
                  <td title="Original inventory quantity is unavailable without purchase/restocking history">{count(product.quantity)}</td>
                  <td className="pm-cell-strong">{count(product.stock)}</td><td>{count(product.sold)}</td>
                  <td>{productPrice(product, "buyingPrice")}</td><td>{productPrice(product, "sellingPrice")}</td><td>{productPrice(product, "unitProfit")}</td>
                  <td>{money(product.grossSales)}</td><td>{money(product.discount)}</td><td className="pm-cell-strong">{money(product.netSales)}</td>
                  <td className={profitClass(product.grossProfit)}>{money(product.grossProfit)}</td><td>{percent(product.profitMargin)}</td><td>{money(product.stockValue)}</td>
                </tr>
                {expanded.has(product.id) && <tr id={`pm-variants-${start + index}`}><td colSpan={15} className="pm-detail-cell"><VariationDetails product={product} /></td></tr>}
              </Fragment>)}</tbody>
            </table>
          </div>
          <div className="pm-pagination"><span>Showing {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}</span><div><button type="button" className="pm-button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><FiChevronLeft /></button><span>Page {currentPage} of {pageCount}</span><button type="button" className="pm-button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><FiChevronRight /></button></div></div>
        </> : <div className="pm-empty"><FiPackage /><h3>{hasFilters ? "No matching products" : "No inventory to report yet"}</h3><p>{hasFilters ? "Try another search or clear your filters." : "Products and delivered order items will appear here when available."}</p>{hasFilters && <button type="button" className="pm-button" onClick={clearFilters}>Clear filters</button>}</div>}
      </div>
      <details className="pm-methodology"><summary>How these figures are calculated</summary>
        <ul>
          <li>Only the parent order’s exact “Delivered” status counts as a sale. Item status and product sold counters are ignored. Refresh retrieves current order statuses.</li>
          <li>Gross sales use the stored order-item line total, never the current selling price. Delivery charges are excluded.</li>
          <li>Period reports use the order’s createdAt date in the selected timezone, with weeks running Monday–Sunday. They show currently Delivered orders placed in that period, rather than claiming when delivery occurred. Orders without valid dates remain in All time but are excluded from dated breakdowns.</li>
          <li>Discounts use the order totals discount first, otherwise a positive order discount, then the coupon discount. These representations are never added together. The chosen amount is allocated in proportion to gross item sales.</li>
          <li>Redeemed points have no documented Taka conversion in the existing APIs, so affected net sales and profit are unavailable.</li>
          <li>Gross profit is an estimate using current variation buying costs, falling back to the main product cost. Missing costs or uncertain discounts show “—”, rather than an invented profit.</li>
          <li>Stock comes from the product API. Low stock means 1–5 units. ¹ Original quantity is unavailable without inventory purchase and restocking history; current stock plus sales is not a reliable substitute.</li>
          <li>Unmatched variation sales and deleted-product sales remain in product totals. Overview figures cover all loaded products and are unaffected by table filters.</li>
        </ul>
      </details>
    </>}
  </section>
}