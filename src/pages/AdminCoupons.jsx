import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import SummaryApi from "../common";

const emptyForm = {
  code: "",
  type: "PERCENT",              // "PERCENT" | "FLAT"
  discountPercent: 10,
  discountAmount: 50,
  maxDiscountAmount: 200,
  minOrderAmount: 0,
  usageLimitTotal: 0,           // 0 = unlimited
  usageLimitPerUser: 0,         // 0 = unlimited
  firstOrderOnly: false,
  startAt: "",                  // datetime-local
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
      const url = new URL(SummaryApi.admin_coupons_list.url, window.location.origin);
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

  useEffect(() => { fetchList(); /* load initial */ }, []);
  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const onChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Prepare payload for server (ISO date from datetime-local)
  const buildPayload = () => {
    const payload = { ...form };
    if (payload.type === "PERCENT") {
      payload.discountAmount = undefined;
    } else {
      payload.discountPercent = undefined;
      payload.maxDiscountAmount = undefined;
    }
    // transform datetime-local -> ISO
    if (payload.startAt) payload.startAt = new Date(payload.startAt).toISOString();
    if (payload.endAt)   payload.endAt   = new Date(payload.endAt).toISOString();

    payload.code = payload.code.trim().toUpperCase();
    return payload;
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = buildPayload();
      const isEdit = !!editingId;
      const url = isEdit ? SummaryApi.admin_coupons_update.url(editingId) : SummaryApi.admin_coupons_create.url;
      const method = isEdit ? SummaryApi.admin_coupons_update.method : SummaryApi.admin_coupons_create.method;

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
      // Convert ISO -> datetime-local format
      startAt: c.startAt ? new Date(c.startAt).toISOString().slice(0,16) : "",
      endAt:   c.endAt   ? new Date(c.endAt).toISOString().slice(0,16)   : "",
      isActive: !!c.isActive,
    });
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
    <div style={{ padding: 20 }}>
      <h2>Coupons</h2>

      {/* Search + Refresh */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by CODE..."
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <button onClick={fetchList}>Search / Refresh</button>
        {editingId ? <button onClick={resetForm}>New</button> : null}
      </div>

      {/* Create / Edit Form */}
      <form onSubmit={submitForm} style={{ border: "1px solid #eee", padding: 16, borderRadius: 8, marginBottom: 16, background: "#fafafa" }}>
        <h3>{editingId ? "Edit Coupon" : "Create Coupon"}</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>Code</label>
            <input value={form.code} onChange={e => onChange("code", e.target.value)} placeholder="SAVE10P" required />
          </div>

          <div>
            <label>Type</label>
            <select value={form.type} onChange={e => onChange("type", e.target.value)}>
              <option value="PERCENT">PERCENT</option>
              <option value="FLAT">FLAT</option>
            </select>
          </div>

          {percentMode ? (
            <>
              <div>
                <label>Discount Percent</label>
                <input type="number" min="1" max="100" value={form.discountPercent}
                  onChange={e => onChange("discountPercent", e.target.value)} required />
              </div>
              <div>
                <label>Max Discount Amount (cap)</label>
                <input type="number" min="0" value={form.maxDiscountAmount ?? 0}
                  onChange={e => onChange("maxDiscountAmount", e.target.value)} />
              </div>
            </>
          ) : (
            <div>
              <label>Flat Discount Amount</label>
              <input type="number" min="1" value={form.discountAmount}
                onChange={e => onChange("discountAmount", e.target.value)} required />
            </div>
          )}

          <div>
            <label>Min Order Amount</label>
            <input type="number" min="0" value={form.minOrderAmount}
              onChange={e => onChange("minOrderAmount", e.target.value)} />
          </div>

          <div>
            <label>Usage Limit (Total)</label>
            <input type="number" min="0" value={form.usageLimitTotal}
              onChange={e => onChange("usageLimitTotal", e.target.value)} />
          </div>

          <div>
            <label>Usage Limit (Per User)</label>
            <input type="number" min="0" value={form.usageLimitPerUser}
              onChange={e => onChange("usageLimitPerUser", e.target.value)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input id="firstOrderOnly" type="checkbox"
              checked={form.firstOrderOnly}
              onChange={e => onChange("firstOrderOnly", e.target.checked)} />
            <label htmlFor="firstOrderOnly">First Order Only</label>
          </div>

          <div>
            <label>Start At</label>
            <input type="datetime-local" value={form.startAt}
              onChange={e => onChange("startAt", e.target.value)} required />
          </div>
          <div>
            <label>End At</label>
            <input type="datetime-local" value={form.endAt}
              onChange={e => onChange("endAt", e.target.value)} required />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input id="isActive" type="checkbox"
              checked={form.isActive}
              onChange={e => onChange("isActive", e.target.checked)} />
            <label htmlFor="isActive">Active</label>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : (editingId ? "Update" : "Create")}
          </button>
          {editingId && <button type="button" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </form>

      {/* List */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={th}>Code</th>
              <th style={th}>Type</th>
              <th style={th}>Value</th>
              <th style={th}>MinOrder</th>
              <th style={th}>Usage: total/user</th>
              <th style={th}>FirstOnly</th>
              <th style={th}>Start</th>
              <th style={th}>End</th>
              <th style={th}>Active</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: "center", padding: 16 }}>Loading...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: "center", padding: 16 }}>No coupons</td></tr>
            ) : (
              list.map(c => {
                const value = c.type === "PERCENT"
                  ? `${c.discountPercent}% (cap ${c.maxDiscountAmount ?? "—"})`
                  : `৳${c.discountAmount}`;
                return (
                  <tr key={c._id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}><code>{c.code}</code></td>
                    <td style={td}>{c.type}</td>
                    <td style={td}>{value}</td>
                    <td style={td}>{c.minOrderAmount}</td>
                    <td style={td}>{c.usageLimitTotal}/{c.usageLimitPerUser}</td>
                    <td style={td}>{c.firstOrderOnly ? "Yes" : "No"}</td>
                    <td style={td}>{new Date(c.startAt).toLocaleString()}</td>
                    <td style={td}>{new Date(c.endAt).toLocaleString()}</td>
                    <td style={td}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        background: c.isActive ? "#e8f8ee" : "#ffecec",
                        color: c.isActive ? "#117a3e" : "#b00020",
                        fontWeight: 600,
                      }}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => startEdit(c)}>Edit</button>
                        <button onClick={() => toggleActive(c._id)}>{c.isActive ? "Deactivate" : "Activate"}</button>
                        <button onClick={() => onDelete(c._id)} style={{ color: "#b00020" }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { textAlign: "left", padding: 8, fontWeight: 700, fontSize: 13 };
const td = { textAlign: "left", padding: 8, fontSize: 13 };
