const toBoolean = (value) => value === true || value === "true";

const normalizeProductVariants = (product) => {
  if (!product || product.isPublished === false) return [];

  const { variants, ...productDetails } = product;
  const safeVariants = Array.isArray(variants) ? variants : [];
  const sharedDetails = {
    ...productDetails,
    trandingProduct: toBoolean(
      product.trandingProduct ?? product.trendingProduct,
    ),
     // Keep the schema spelling as the canonical field, while accepting the
    // commonly used corrected spelling from older/newer API projections.
    trandingPriority:
      product.trandingPriority,
    handCraft: toBoolean(product.handCraft),
    salesOn: toBoolean(product.salesOn),
  };

  if (safeVariants.length === 0) {
    return [
      {
        ...sharedDetails,
        img: product.img || null,
        variantId: null,
        variantStock: Number(product.totalStock || 0),
        cardKey: `${product._id}:default`,
      },
    ];
  }

  return safeVariants.map((variant, index) => ({
    ...sharedDetails,
    img: variant?.firstImage || product.img || null,
    variantId: variant?._id || null,
    variantStock: Number(variant?.stock || 0),
    cardKey: `${product._id}:${variant?._id || index}`,
  }));
};

// Add one variant from each product per round. This prevents every color of a
// single product from appearing side by side while keeping every variant.
export const normalizeProductCards = (products = []) => {
  const productVariantGroups = products
    .map(normalizeProductVariants)
    .filter((variants) => variants.length > 0);
  const cards = [];
  const largestVariantCount = Math.max(
    0,
    ...productVariantGroups.map((variants) => variants.length),
  );

  for (
    let variantIndex = 0;
    variantIndex < largestVariantCount;
    variantIndex += 1
  ) {
    productVariantGroups.forEach((variants) => {
      if (variants[variantIndex]) cards.push(variants[variantIndex]);
    });
  }

  return cards;
};

// Slides show one representative card per product. The full lists keep every
// variant, so opening "View All" preserves the previous browsing experience.
export const getFirstVariantCards = (products = []) => {
  const seenProductIds = new Set();

  return products.filter((product) => {
    const productId = product?._id;
    if (!productId || seenProductIds.has(productId)) return false;

    seenProductIds.add(productId);
    return true;
  });
};


// The trending endpoint already contains only trending products, so this helper
// is intentionally concerned only with ordering. Explicit positive priorities
// come first; products without one retain their original API order afterward.
export const orderTrendingProducts = (products = []) =>
  products
    .map((product, index) => {
      const rawPriority =
        product?.trandingPriority ;
      const numericPriority = Number(rawPriority);
      const priority =
        rawPriority != null &&
        rawPriority !== "" &&
        Number.isInteger(numericPriority) &&
        numericPriority >= 1
          ? numericPriority
          : null;

      return { product, index, priority };
    })
    .sort((a, b) => {
      if (a.priority != null && b.priority != null) {
        return a.priority - b.priority || a.index - b.index;
      }
      if (a.priority != null) return -1;
      if (b.priority != null) return 1;
      return a.index - b.index;
    })
    .map(({ product }) => product);

export const chunkProducts = (products = [], size = 4) => {
  const safeSize = Number.isInteger(size) && size > 0 ? size : 4;
  const chunks = [];

  for (let index = 0; index < products.length; index += safeSize) {
    chunks.push(products.slice(index, index + safeSize));
  }

  console.log("chunk ", chunks);
  

  return chunks;
};