/**
 * Inventory comes from the current product snapshot. Sales come exclusively from
 * unique orders whose CURRENT parent status is exactly "Delivered". `price` on
 * an order item is a line total, never a unit price. No inventory history or
 * historical buying costs are inferred from these two snapshots.
 */
export const LOW_STOCK_THRESHOLD = 5;

const list = (value) => Array.isArray(value) ? value : [];
const text = (value) => value == null ? "" : String(value).trim();
const normalized = (value) => text(value).toLocaleLowerCase("en-US").replace(/\s+/g, " ");
const idOf = (value) => text(value && typeof value === "object" ? value._id ?? value.$oid : value);
const number = (value) => {
  if (value == null || !["string", "number"].includes(typeof value) || text(value) === "") return null;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
};
const firstNumber = (...values) => values.map(number).find((value) => value !== null) ?? null;
const sum = (values) => values.some((value) => value === null) ? null : values.reduce((total, value) => total + value, 0);
const difference = (a, b) => a === null || b === null ? null : a - b;
const multiply = (a, b) => a === 0 || b === 0 ? 0 : a === null || b === null ? null : a * b;
const statusOf = (stock) => stock === null ? "Unknown" : stock === 0 ? "Out of Stock" : stock <= LOW_STOCK_THRESHOLD ? "Low Stock" : "In Stock";
const firstImage = (product) => text(list(product?.images)[0] ?? list(product?.productImg)[0] ?? product?.img ?? product?.image);

function metrics() {
  return { sold: 0, grossSales: 0, discount: 0, netSales: 0, costOfGoodsSold: 0, grossProfit: 0, profitMargin: null, unknownCostUnits: 0 };
}

function variation(product, variant, size, index, stock) {
  const buyingPrice = firstNumber(variant.SpcBuyingPrice, product.buyingPrice);
  const sellingPrice = firstNumber(variant.SpcSelling, product.selling, variant.SpcPrice, product.price);
  return {
    ...metrics(), id: `${idOf(product._id)}:${index}`, color: text(variant.color), size: text(size?.size ?? variant.size),
    name: text(variant.SpcProductName || product.productName), image: firstImage(variant) || firstImage(product),
    quantity: null, stock, buyingPrice, sellingPrice, unitProfit: difference(sellingPrice, buyingPrice),
    stockValue: multiply(stock, buyingPrice), stockStatus: statusOf(stock), unmatched: false,
  };
}

function createProduct(product) {
  const variants = list(product.variants).filter((variant) => variant && typeof variant === "object");
  const rows = [];
  variants.forEach((variant, variantIndex) => {
    const sizes = list(variant.sizes).filter((size) => size && typeof size === "object");
    if (sizes.length) {
      sizes.forEach((size, sizeIndex) => rows.push(variation(product, variant, size, `${variantIndex}:${sizeIndex}`, number(size?.stock))));
    } else {
      rows.push(variation(product, variant, null, variantIndex, number(variant.stock)));
    }
  });
  if (!variants.length) rows.push(variation(product, {}, null, "base", firstNumber(product.totalStock, product.stock)));
  const variantStock = sum(rows.map((row) => row.stock));
  const stock = variantStock ?? number(product.totalStock);
  const issues = [];
  if (variantStock !== null && number(product.totalStock) !== null && variantStock !== number(product.totalStock)) issues.push("Product totalStock differs from variation stock; the sum of current variation stock is used.");
  if (rows.some((row) => row.stock === null)) issues.push("Some current variation stock is unavailable.");
  if (rows.some((row) => row.buyingPrice === 0)) issues.push("A purchase cost is explicitly zero; verify it before relying on profit estimates.");
  return {
    ...metrics(), id: idOf(product._id), code: text(product.productCodeNumber), name: text(product.productName) || "Unnamed product",
    image: firstImage(product) || rows[0]?.image || "", category: text(product.category) || "Uncategorized", deleted: false,
    variants: rows, stock, quantity: null, buyingPrice: number(product.buyingPrice),
    sellingPrice: firstNumber(product.selling, product.price), unitProfit: difference(firstNumber(product.selling, product.price), number(product.buyingPrice)),
    stockValue: sum(rows.map((row) => row.stockValue)), stockStatus: statusOf(stock),
    unmatchedSold: 0, profitEstimated: true, issues,
  };
}

function missingProduct(item, id) {
  return {
    ...metrics(), id, code: text(item.productCodeNumber), name: text(item.productName) || "Unavailable product",
    image: text(item.image), category: "Unavailable products", deleted: true, variants: [], stock: null, quantity: null,
    buyingPrice: null, sellingPrice: null, unitProfit: null, stockValue: null, stockStatus: "Unknown",
    unmatchedSold: 0, profitEstimated: true, issues: ["Product is absent from the current product API; current inventory and cost are unavailable."],
  };
}

function matchVariation(product, item) {
  const color = normalized(item.color);
  const size = normalized(item.size);
  // A blank dimension is only safe if the remaining dimensions identify ONE row.
  // Do not erase punctuation or coerce size numbers: "01" and "1" stay distinct.
  const candidates = product.variants.filter((row) => !row.unmatched &&
    (!color || normalized(row.color) === color) && (!size || normalized(row.size) === size));
  if (candidates.length !== 1) return null;
  const row = candidates[0];
  // Explicit unmatched dimensions on a historical item cannot match a plain product.
  if ((color && !normalized(row.color)) || (size && !normalized(row.size))) return null;
  return row;
}

function unmatchedVariation(product, item) {
  const id = `${product.id}:unmatched:${JSON.stringify([normalized(item.color), normalized(item.size)])}`;
  let row = product.variants.find((candidate) => candidate.id === id);
  if (!row) {
    // A cost is still applicable if every current variation has the same cost.
    const costs = product.variants.filter((candidate) => !candidate.unmatched).map((candidate) => candidate.buyingPrice);
    const buyingPrice = costs.length && costs.every((cost) => cost !== null && cost === costs[0]) ? costs[0] : null;
    row = { ...metrics(), id, color: text(item.color), size: text(item.size), name: "Unmatched delivered items", image: text(item.image) || product.image,
      stock: null, quantity: null, buyingPrice, sellingPrice: null, unitProfit: null, stockValue: null, stockStatus: "Unknown", unmatched: true };
    product.variants.push(row);
  }
  return row;
}

function finalize(row) {
  row.grossProfit = difference(row.netSales, row.costOfGoodsSold);
  row.profitMargin = row.netSales === null || row.grossProfit === null || row.netSales <= 0 ? null : row.grossProfit / row.netSales * 100;
  return row;
}

/**
 * Discounts are monetary, proportionally allocated across ALL lines in an order.
 * totals.discount > positive discount > appliedCoupon.discount, never the sum of
 * aliases. A default order.discount=0 must not suppress a stored coupon amount.
 * Raw usedPoint is a count with no documented monetary conversion in this repo;
 * net revenue is deliberately unknown when it is positive. Delivery/payable is
 * never treated as product sales. No positive unknown value is coerced to zero.
 */
function orderDiscount(order, grossSales, warn) {
  const declaredDiscounts = [order.totals?.discount, order.discount, order.appliedCoupon?.discount].filter((value) => value != null);
  const pointCount = order.usedPoint == null ? 0 : number(order.usedPoint);
  if (declaredDiscounts.some((value) => number(value) === null) || pointCount === null || !Number.isInteger(pointCount)) {
    warn("Invalid discount or redeemed-point values make affected net sales and profit unavailable.");
    return null;
  }
  const totalDiscount = number(order.totals?.discount);
  const directDiscount = number(order.discount);
  const couponDiscount = number(order.appliedCoupon?.discount);
  const discount = totalDiscount ?? (directDiscount > 0 ? directDiscount : couponDiscount ?? directDiscount ?? 0);
  const positiveDiscounts = declaredDiscounts.map(number).filter((value) => value > 0);
  if (new Set(positiveDiscounts).size > 1 || (totalDiscount === 0 && positiveDiscounts.length)) {
    warn("Discount representations disagree; the monetary totals discount takes priority, otherwise a positive order discount, then the coupon discount.");
  }
  if (pointCount > 0) {
    warn("Redeemed points have no documented Taka conversion; affected net sales and profit are unavailable.");
    return null;
  }
  if (grossSales === null) return discount === 0 ? 0 : null;
  if (discount > grossSales) {
    warn("An order discount exceeds its gross item sales; affected net sales and profit are unavailable.");
    return null;
  }
  return discount;
}

// Allocate monetary discounts to paisa with a deterministic largest-remainder
// pass, so individually displayed lines sum to the order's discount exactly.
function allocateDiscount(items, discount, grossSales) {
  if (discount === null) return items.map(() => null);
  if (discount === 0) return items.map(() => 0);
  const discountPaisa = Math.round(discount * 100);
  const shares = items.map((item, index) => {
    const exact = discountPaisa * number(item.price) / grossSales;
    return { index, paisa: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = discountPaisa - shares.reduce((total, share) => total + share.paisa, 0);
  const ranked = [...shares].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const share of ranked) {
    if (remaining <= 0) break;
    share.paisa += 1;
    remaining -= 1;
  }
  return shares.map((share) => share.paisa / 100);
}

function deduplicateOrders(orders, warn) {
  const unique = new Map();
  for (const order of orders) {
    if (!order || typeof order !== "object") continue;
    const id = idOf(order._id) || text(order.orderId);
    if (!id) { warn("Orders without a stable ID were excluded to prevent duplicate sales."); continue; }
    const previous = unique.get(id);
    if (!previous) { unique.set(id, order); continue; }
    warn("Duplicate order IDs were counted once, using the latest updatedAt snapshot where available.");
    const priorTime = Date.parse(previous.updatedAt);
    const nextTime = Date.parse(order.updatedAt);
    if (Number.isFinite(nextTime) && (!Number.isFinite(priorTime) || nextTime > priorTime)) unique.set(id, order);
    else if ((!Number.isFinite(priorTime) || !Number.isFinite(nextTime) || priorTime === nextTime) && previous.status !== order.status) {
      // Conflicting undated snapshots cannot establish current delivery; preserve
      // the non-delivered state rather than inventing a sale.
      if (order.status !== "Delivered") unique.set(id, order);
      warn("Conflicting order statuses without a newer timestamp were treated as not Delivered.");
    }
  }
  return [...unique.values()];
}

/**
 * Returns {products, overview, warnings, methodology}. Every product and variation
 * exposes sold, grossSales, discount, netSales, costOfGoodsSold, grossProfit,
 * profitMargin and current stock/value. Unknown financial totals are null rather
 * than partial totals. `quantity` is always null: purchase history is absent.
 */
export function buildProductManagementReport(products = [], orders = []) {
  const warnings = new Set();
  const warn = (message) => warnings.add(message);
  const indexed = new Map();
  for (const product of list(products)) {
    if (!product || !idOf(product._id)) { warn("Products without a MongoDB ID were excluded from inventory."); continue; }
    const id = idOf(product._id);
    if (indexed.has(id)) { warn("Duplicate product IDs were counted once."); continue; }
    indexed.set(id, createProduct(product));
  }
  const delivered = deduplicateOrders(list(orders), warn).filter((order) => order.status === "Delivered");
  for (const order of delivered) {
    const items = list(order.items).filter((item) => item && typeof item === "object");
    if (!items.length) warn("A Delivered order contains no readable items.");
    const orderGross = sum(items.map((item) => number(item.price)));
    const discount = orderDiscount(order, orderGross, warn);
    const allocatedDiscounts = allocateDiscount(items, discount, orderGross);
    items.forEach((item, itemIndex) => {
      const productId = idOf(item.productId);
      // Retain missing-ID revenue separately, never match by a mutable code/name.
      const id = productId || `unknown-product:${idOf(order._id) || text(order.orderId)}:${itemIndex}`;
      if (!productId) warn("Some delivered items have no product ID; their sales are retained under unavailable products.");
      let product = indexed.get(id);
      if (!product) { product = missingProduct(item, id); indexed.set(id, product); }
      let row = matchVariation(product, item);
      if (!row) row = unmatchedVariation(product, item);
      const quantity = number(item.quantity);
      const grossSales = number(item.price);
      if (quantity === null || !Number.isInteger(quantity)) {
        warn("Invalid delivered item quantities are excluded from sold-unit counts; their cost and profit are unavailable.");
      }
      const sold = Number.isInteger(quantity) ? quantity : 0;
      if (grossSales === null) warn("Missing delivered item prices make affected revenue and profit unavailable.");
      const allocatedDiscount = allocatedDiscounts[itemIndex];
      const netSales = difference(grossSales, allocatedDiscount);
      const cost = quantity === null || !Number.isInteger(quantity) ? null : multiply(quantity, row.buyingPrice);
      row.sold += sold;
      row.grossSales = sum([row.grossSales, grossSales]);
      row.discount = sum([row.discount, allocatedDiscount]);
      row.netSales = sum([row.netSales, netSales]);
      row.costOfGoodsSold = sum([row.costOfGoodsSold, cost]);
      if (cost === null) row.unknownCostUnits += sold;
      if (row.unmatched) product.unmatchedSold += sold;
    });
  }
  const result = [...indexed.values()].map((product) => {
    product.variants.forEach(finalize);
    for (const key of ["sold", "grossSales", "discount", "netSales", "costOfGoodsSold", "unknownCostUnits"]) product[key] = sum(product.variants.map((row) => row[key]));
    if (product.unmatchedSold) product.issues.push("Some delivered items could not be mapped confidently to a current variation; sales are preserved in unmatched rows.");
    if (product.costOfGoodsSold === null) product.issues.push("Some sold items have no applicable purchase cost; gross profit is unavailable.");
    return finalize(product);
  });
  const currentProducts = result.filter((product) => !product.deleted);
  const overview = {
    totalProducts: currentProducts.length,
    totalVariations: currentProducts.reduce((total, product) => total + product.variants.filter((row) => !row.unmatched).length, 0),
    totalStock: sum(currentProducts.map((product) => product.stock)),
    deliveredOrders: delivered.length,
    soldUnits: sum(result.map((product) => product.sold)),
    grossSales: sum(result.map((product) => product.grossSales)),
    discount: sum(result.map((product) => product.discount)),
    netSales: sum(result.map((product) => product.netSales)),
    costOfGoodsSold: sum(result.map((product) => product.costOfGoodsSold)),
    stockValue: sum(currentProducts.map((product) => product.stockValue)),
    lowStockProducts: currentProducts.filter((product) => product.stockStatus === "Low Stock").length,
    outOfStockProducts: currentProducts.filter((product) => product.stockStatus === "Out of Stock").length,
    unmatchedSold: sum(result.map((product) => product.unmatchedSold)),
    unknownCostUnits: sum(result.map((product) => product.unknownCostUnits)),
    unknownStockProducts: currentProducts.filter((product) => product.stock === null).length,
    deletedProducts: result.filter((product) => product.deleted).length,
    profitEstimated: true,
  };
  finalize(overview);
  if (overview.unmatchedSold) warn("Unmatched variation sales are included in product and dashboard totals, not assigned to a guessed variation.");
  if (overview.deletedProducts) warn("Historical sales for products missing from the current catalog are retained; their current stock and cost are unavailable.");
  if (overview.unknownCostUnits) warn("Missing applicable buying costs make affected gross profit and its aggregate unavailable.");
  return {
    products: result, overview, warnings: [...warnings],
    methodology: [
      'Only unique orders with parent status exactly "Delivered" contribute to sales; itemStatus and product.sold are ignored.',
      "Gross sales use historical item line totals. Delivery and other order charges are excluded.",
      "Monetary discounts are allocated to paisa in proportion to gross line sales; totals.discount takes priority, otherwise positive order discount, then coupon discount. Aliases are never added together.",
      "Raw redeemed points have no documented monetary conversion; affected net sales and profit are unavailable.",
      "Profit and stock value use current applicable buying costs; profit is an estimate, not historical accounting profit.",
      "Current stock comes from variant sizes (or product totalStock when detail is unavailable). Original/cumulative quantities are unavailable without purchase history.",
      `Low stock means 1–${LOW_STOCK_THRESHOLD} units. Unknown values display as unavailable, never as invented zeroes.`,
    ],
  };
}
