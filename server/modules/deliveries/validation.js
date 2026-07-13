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

const validateDeliveryStatus = (data) => {
  if (!data?.status) return "Delivery status is required.";
  return null;
};

const validateDeliveryApproval = (data) => {
  if (!data || !["Approved", "Rejected"].includes(data.approvalStatus)) {
    return "approvalStatus must be Approved or Rejected.";
  }
  return null;
};

const validateInventoryConfirmation = (data) => {
  if (!data || !["Accepted", "Rejected"].includes(data.action)) {
    return "action must be Accepted or Rejected.";
  }
  return null;
};

export { validateDelivery, validateDeliveryStatus, validateDeliveryApproval, validateInventoryConfirmation };
