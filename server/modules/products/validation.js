const validateProduct = (data) => {
  if (!data) {
    return "Product payload is required.";
  }

  const {
    name,
    category,
    price,
  } = data;

  if (!name || !category || !price) {
    return "Name, category and price are required.";
  }

  if (price <= 0) {
    return "Price must be greater than zero.";
  }

  return null;
};

export { validateProduct };