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
