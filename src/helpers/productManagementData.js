const present = (value) => value !== undefined && value !== null && value !== "";

const numeric = (value) => {
  if (!present(value) || typeof value === "boolean") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

// These endpoints currently return complete arrays. Refuse metadata indicating
// only a page so a future API change cannot silently produce partial reports.
const assertCompleteCollection = (body, length, label) => {
  const metadata = [body, body.pagination, body.meta, body.meta?.pagination]
    .filter((value) => value && typeof value === "object");

  for (const page of metadata) {
    const hasMore = page.hasMore === true || page.hasMore === "true" ||
      page.hasNextPage === true || page.hasNextPage === "true";
    const next = page.nextCursor ?? page.nextPage;
    const explicitEnd = page.hasMore === false || page.hasNextPage === false;
    const partial = hasMore || numeric(page.totalPages) > 1 ||
      numeric(page.page) > 1 || numeric(page.currentPage) > 1 ||
      numeric(page.offset) > 0 ||
      (!explicitEnd && present(next) && next !== false && next !== 0) ||
      [page.total, page.totalItems, page.totalCount, page.totalProducts, page.totalOrders]
        .some((total) => numeric(total) !== null && numeric(total) > length);

    if (partial) {
      throw new Error(`${label} API returned a partial collection. A complete dataset is required for accurate reporting.`);
    }
  }
};

const fetchCollection = async (url, label, options, fetchImpl) => {
  const response = await fetchImpl(url, options);
  let body;
  try {
    body = await response.json();
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error(`${label} API returned an invalid JSON response.`);
  }

  if (!response.ok || body?.success !== true) {
    throw new Error(`${label}: ${body?.message || `request failed (HTTP ${response.status})`}`);
  }
  if (!Array.isArray(body.data) || body.data.some((item) =>
    !item || typeof item !== "object" || Array.isArray(item))) {
    throw new Error(`${label} API returned an invalid collection.`);
  }
  assertCompleteCollection(body, body.data.length, label);
  return body.data;
};

/** Load both existing read-only APIs as one snapshot; never return half a report. */
export async function loadProductManagementData({
  productsUrl,
  ordersUrl,
  clientKey,
  token,
  signal,
  fetchImpl = fetch,
}) {
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const common = { method: "GET", credentials: "include", signal };
  const [products, orders] = await Promise.all([
    fetchCollection(productsUrl, "Products", {
      ...common,
      headers: { ...authHeaders, ...(clientKey ? { "x-client-key": clientKey } : {}) },
    }, fetchImpl),
    fetchCollection(ordersUrl, "Orders", { ...common, headers: authHeaders }, fetchImpl),
  ]);
  return { products, orders };
}
