const validateCommunity = (data) => {
  const {
    name,
    address,
    city,
    state,
    pincode,
    deliveryDay,
  } = data;

  if (
    !name ||
    !address ||
    !city ||
    !state ||
    !pincode ||
    !deliveryDay
  ) {
    return "All required fields must be filled.";
  }

  return null;
};

export { validateCommunity };