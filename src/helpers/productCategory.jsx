const productCategory = [
  { id: 1, label: "Men", value: "Men" },
  { id: 2, label: "Women", value: "Women" },
  { id: 3, label: "Japanese Beauty", value: "Japanese Beauty" },
  { id: 4, label: "Home & Kitchen", value: "Home & Kitchen" },
  { id: 5, label: "Mobile Acces", value: "Mobile Acces" },
  { id: 6, label: "Men's Acces", value: "Men's Acces" },
  { id: 7, label: "Jewelry & Watches", value: "Jewelry & Watches" },
  { id: 8, label: "Bags", value: "Bags" },
  { id: 9, label: "Kids & Baby", value: "Kids & Baby" },
  { id: 10, label: "Toys & Games", value: "Toys & Games" },
];

const categoryOrder = new Map(
  productCategory.map(({ value }, index) => [value.trim().toLowerCase(), index]),
);

export const sortCategoriesByConfiguredOrder = (categories = []) => {
  if (!Array.isArray(categories)) return [];

  return categories
    .map((category, originalIndex) => ({ category, originalIndex }))
    .sort((a, b) => {
      const aName = a.category?.category?.trim().toLowerCase();
      const bName = b.category?.category?.trim().toLowerCase();
      const aOrder = categoryOrder.get(aName);
      const bOrder = categoryOrder.get(bName);

      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return a.originalIndex - b.originalIndex;
    })
    .map(({ category }) => category);
};

export default productCategory;