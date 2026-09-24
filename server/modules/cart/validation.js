const validateCart = (data) => {
  const { productId, quantity } = data;

  if (!productId) {
    return "Product is required.";
  }

  if (!quantity || quantity <= 0) {
    return "Quantity must be greater than zero.";
  }

  return null;
};

export { validateCart };