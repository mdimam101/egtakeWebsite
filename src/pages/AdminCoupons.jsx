import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import SummaryApi from "../common";
import "../styles/AdminCoupons.css";

const emptyForm = {
  code: "",
  type: "PERCENT", // "PERCENT" | "FLAT"
  discountPercent: 10,
  discountAmount: 50,
  maxDiscountAmount: 200,
  minOrderAmount: 0,
  usageLimitTotal: 0, // 0 = unlimited
  usageLimitPerUser: 0, // 0 = unlimited
  firstOrderOnly: false,
  startAt: "", // datetime-local
  endAt: "",
  isActive: true,
};

export default function AdminCoupons() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchList = async () => {
    try {
      setLoading(true);
      const url = new URL(
        SummaryApi.admin_coupons_list.url,
        window.location.origin
      );
      if (search.trim()) url.searchParams.set("search", search.trim());

      const res = await fetch(url.toString(), { credentials: "include" });
      const data = await res.json();

      if (data.success) setList(data.data || []);
      else toast.error(data.message || "Failed to load");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const onChange = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // Prepare payload for server (ISO date from datetime-local)
  const buildPayload = () => {
    const payload = { ...form };

    if (payload.type === "PERCENT") {
      payload.discountAmount = undefined;
    } else {
      payload.discountPercent = undefined;
      payload.maxDiscountAmount = undefined;
    }

    // datetime-local -> ISO
    if (payload.startAt)
      payload.startAt = new Date(payload.startAt).toISOString();
    if (payload.endAt) payload.endAt = new Date(payload.endAt).toISOString();

    payload.code = payload.code.trim().toUpperCase();
    return payload;
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = buildPayload();
      const isEdit = !!editingId;

      const url = isEdit
        ? SummaryApi.admin_coupons_update.url(editingId)
        : SummaryApi.admin_coupons_create.url;

      const method = isEdit
        ? SummaryApi.admin_coupons_update.method
        : SummaryApi.admin_coupons_create.method;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(isEdit ? "Coupon updated" : "Coupon created");
        resetForm();
        fetchList();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c._id);
    setForm({
      code: c.code || "",
      type: c.type || "PERCENT",
      discountPercent: c.discountPercent ?? 10,
      discountAmount: c.discountAmount ?? 50,
      maxDiscountAmount: c.maxDiscountAmount ?? 200,
      minOrderAmount: c.minOrderAmount ?? 0,
      usageLimitTotal: c.usageLimitTotal ?? 0,
      usageLimitPerUser: c.usageLimitPerUser ?? 0,
      firstOrderOnly: !!c.firstOrderOnly,
      // ISO -> datetime-local
      startAt: c.startAt ? new Date(c.startAt).toISOString().slice(0, 16) : "",
      endAt: c.endAt ? new Date(c.endAt).toISOString().slice(0, 16) : "",
      isActive: !!c.isActive,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (id) => {
    try {
      const res = await fetch(SummaryApi.admin_coupons_toggle.url(id), {
        method: SummaryApi.admin_coupons_toggle.method,
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Toggled");
        fetchList();
      } else toast.error(data.message || "Failed");
    } catch {
      toast.error("Network error");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;

    try {
      const res = await fetch(SummaryApi.admin_coupons_delete.url(id), {
        method: SummaryApi.admin_coupons_delete.method,
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Deleted");
        fetchList();
      } else toast.error(data.message || "Failed");
    } catch {
      toast.error("Network error");
    }
  };

  const percentMode = form.type === "PERCENT";

  return (
    <div className="coupon-page">
      <h2>Coupons</h2>

      {/* Search + Refresh */}
      <div className="coupon-topbar">
        <input
          className="coupon-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by CODE..."
        />

        <button className="coupon-btn" onClick={fetchList}>
          Search / Refresh
        </button>

        {editingId ? (
          <button className="coupon-btn" onClick={resetForm}>
            New
          </button>
        ) : null}
      </div>

      {/* Create / Edit Form */}
      <form onSubmit={submitForm} className="coupon-card">
        <h3>{editingId ? "Edit Coupon" : "Create Coupon"}</h3>

        <div className="coupon-form-grid">
          <div className="coupon-field">
            <label>Code</label>
            <input
              value={form.code}
              onChange={(e) => onChange("code", e.target.value)}
              placeholder="SAVE10P"
              required
            />
          </div>

          <div className="coupon-field">
            <label>Type</label>
            <select
              value={form.type}
              onChange={(e) => onChange("type", e.target.value)}
            >
              <option value="PERCENT">PERCENT</option>
              <option value="FLAT">FLAT</option>
            </select>
          </div>

          {percentMode ? (
            <>
              <div className="coupon-field">
                <label>Discount Percent</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.discountPercent}
                  onChange={(e) => onChange("discountPercent", e.target.value)}
                  required
                />
              </div>

              <div className="coupon-field">
                <label>Max Discount Amount (cap)</label>
                <input
                  type="number"
                  min="0"
                  value={form.maxDiscountAmount ?? 0}
                  onChange={(e) =>
                    onChange("maxDiscountAmount", e.target.value)
                  }
                />
              </div>
            </>
          ) : (
            <div className="coupon-field">
              <label>Flat Discount Amount</label>
              <input
                type="number"
                min="1"
                value={form.discountAmount}
                onChange={(e) => onChange("discountAmount", e.target.value)}
                required
              />
            </div>
          )}

          <div className="coupon-field">
            <label>Min Order Amount</label>
            <input
              type="number"
              min="0"
              value={form.minOrderAmount}
              onChange={(e) => onChange("minOrderAmount", e.target.value)}
            />
          </div>

          <div className="coupon-field">
            <label>Usage Limit (Total)</label>
            <input
              type="number"
              min="0"
              value={form.usageLimitTotal}
              onChange={(e) => onChange("usageLimitTotal", e.target.value)}
            />
          </div>

          <div className="coupon-field">
            <label>Usage Limit (Per User)</label>
            <input
              type="number"
              min="0"
              value={form.usageLimitPerUser}
              onChange={(e) => onChange("usageLimitPerUser", e.target.value)}
            />
          </div>

          <div className="coupon-check">
            <input
              id="firstOrderOnly"
              type="checkbox"
              checked={form.firstOrderOnly}
              onChange={(e) => onChange("firstOrderOnly", e.target.checked)}
            />
            <label htmlFor="firstOrderOnly">First Order Only</label>
          </div>

          <div className="coupon-field">
            <label>Start At</label>
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => onChange("startAt", e.target.value)}
              required
            />
          </div>

          <div className="coupon-field">
            <label>End At</label>
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => onChange("endAt", e.target.value)}
              required
            />
          </div>

          <div className="coupon-check">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => onChange("isActive", e.target.checked)}
            />
            <label htmlFor="isActive">Active</label>
          </div>
        </div>

        <div className="coupon-actions">
          <button
            className="coupon-btn primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Saving..." : editingId ? "Update" : "Create"}
          </button>

          {editingId && (
            <button className="coupon-btn" type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* List */}
<div className="coupon-list-wrap">
  {/* Desktop table */}
  <div className="coupon-table-wrap">
    <table className="coupon-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Type</th>
          <th>Value</th>
          <th>MinOrder</th>
          <th>Usage: total/user</th>
          <th>FirstOnly</th>
          <th>Start</th>
          <th>End</th>
          <th>Active</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td colSpan="10" className="coupon-empty">
              Loading...
            </td>
          </tr>
        ) : list.length === 0 ? (
          <tr>
            <td colSpan="10" className="coupon-empty">
              No coupons
            </td>
          </tr>
        ) : (
          list.map((c) => {
            const value =
              c.type === "PERCENT"
                ? `${c.discountPercent}% (cap ${c.maxDiscountAmount ?? "—"})`
                : `৳${c.discountAmount}`;

            return (
              <tr key={c._id}>
                <td>
                  <span className="coupon-code">{c.code}</span>
                </td>
                <td>{c.type}</td>
                <td>{value}</td>
                <td>{c.minOrderAmount}</td>
                <td>
                  {c.usageLimitTotal}/{c.usageLimitPerUser}
                </td>
                <td>{c.firstOrderOnly ? "Yes" : "No"}</td>
                <td>{c.startAt ? new Date(c.startAt).toLocaleString() : "—"}</td>
                <td>{c.endAt ? new Date(c.endAt).toLocaleString() : "—"}</td>
                <td>
                  <span
                    className={`coupon-badge ${c.isActive ? "active" : "inactive"}`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="coupon-row-actions">
                    <button className="coupon-btn" onClick={() => startEdit(c)}>
                      Edit
                    </button>
                    <button
                      className="coupon-btn"
                      onClick={() => toggleActive(c._id)}
                    >
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="coupon-btn danger"
                      onClick={() => onDelete(c._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>

  {/* Mobile cards */}
  <div className="coupon-cards">
    {loading ? (
      <div className="coupon-card-row coupon-empty-card">Loading...</div>
    ) : list.length === 0 ? (
      <div className="coupon-card-row coupon-empty-card">No coupons</div>
    ) : (
      list.map((c) => {
        const value =
          c.type === "PERCENT"
            ? `${c.discountPercent}% (cap ${c.maxDiscountAmount ?? "—"})`
            : `৳${c.discountAmount}`;

        return (
          <div key={c._id} className="coupon-card-row">
            <div className="coupon-card-head">
              <span className="coupon-code">{c.code}</span>
              <span className={`coupon-badge ${c.isActive ? "active" : "inactive"}`}>
                {c.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="coupon-card-grid">
              <div className="kv">
                <span className="k">Type</span>
                <span className="v">{c.type}</span>
              </div>
              <div className="kv">
                <span className="k">Value</span>
                <span className="v">{value}</span>
              </div>
              <div className="kv">
                <span className="k">Min Order</span>
                <span className="v">{c.minOrderAmount}</span>
              </div>
              <div className="kv">
                <span className="k">Usage</span>
                <span className="v">
                  {c.usageLimitTotal}/{c.usageLimitPerUser}
                </span>
              </div>
              <div className="kv">
                <span className="k">First Only</span>
                <span className="v">{c.firstOrderOnly ? "Yes" : "No"}</span>
              </div>
              <div className="kv">
                <span className="k">Start</span>
                <span className="v">{c.startAt ? new Date(c.startAt).toLocaleString() : "—"}</span>
              </div>
              <div className="kv">
                <span className="k">End</span>
                <span className="v">{c.endAt ? new Date(c.endAt).toLocaleString() : "—"}</span>
              </div>
            </div>

            <div className="coupon-card-actions">
              <button className="coupon-btn" onClick={() => startEdit(c)}>
                Edit
              </button>
              <button className="coupon-btn" onClick={() => toggleActive(c._id)}>
                {c.isActive ? "Deactivate" : "Activate"}
              </button>
              <button className="coupon-btn danger" onClick={() => onDelete(c._id)}>
                Delete
              </button>
            </div>
          </div>
        );
      })
    )}
  </div>
</div>
    </div>
  );
}
