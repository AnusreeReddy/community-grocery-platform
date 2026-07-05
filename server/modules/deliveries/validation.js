const validateDelivery = (data) => {
  if (!data) {
    return "Delivery payload is required.";
  }

  const {
    community,
    deliveryDay,
    deliveryDate,
  } = data;

  if (!community || !deliveryDay || !deliveryDate) {
    return "Community, delivery day and delivery date are required.";
  }

  return null;
};

export { validateDelivery };