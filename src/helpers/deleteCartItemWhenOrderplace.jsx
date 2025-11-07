import SummaryApi from "../common";

const deleteCartItemWhenOrderplace = async (cartItemIds) => {
  try {
     const t = localStorage.getItem('authToken');
    const res = await fetch(SummaryApi.removeFromCart.url, {
      method: SummaryApi.removeFromCart.method,
      // headers: { 'Content-Type': 'application/json' },
       headers: t ? { Authorization: `Bearer ${t}` } : {},
      credentials: 'include',
      body: JSON.stringify({ cartItemIds })
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

export default deleteCartItemWhenOrderplace;