import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import SummaryApi from "../common";
import UserProductCart from "../components/UserProductCart";
import { generateOptimizedVariants } from "../helpers/variantUtils";

const SearchPage = () => {
  const { query } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${SummaryApi.searchProduct.url}?q=${query}`);
        const data = await res.json();
        if (data.success) {
          const optimized = generateOptimizedVariants(data.data);
          setProducts(optimized);
        }
      } catch (err) {
        console.error("Search failed", err);
      }
      setLoading(false);
    };

    fetchSearchResults();
  }, [query]);

  return (
    <div>
      <h2>
        Search Results for: <strong>{decodeURIComponent(query)}</strong>
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "6px",
            padding: "4px",
          }}
        >
          {products.map((product, idx) => (
            <UserProductCart productData={product} key={idx} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
