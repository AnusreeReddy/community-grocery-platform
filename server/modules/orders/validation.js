const validateOrder = (data) => {
  if (!data) {
    return "Order payload is required.";
  }

  const {
    deliveryDay,
  } = data;

  if (!deliveryDay) {
    return "Delivery day is required.";
  }

  return null;
};

export { validateOrder };