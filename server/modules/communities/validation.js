const validateCommunity = (data) => {
  if (!data) {
    return "Community payload is required.";
  }

  const { name, address, city, state, pincode, deliverySchedule, thresholdAmount } = data;

  if (!name || !address || !city || !state || !pincode || !deliverySchedule) {
    return "All required fields must be filled.";
  }

  if (!Array.isArray(deliverySchedule)) {
    return "Delivery schedule must be an array.";
  }

  if (deliverySchedule.length < 2 || deliverySchedule.length > 4) {
    return "Community must have 2 to 4 delivery days.";
  }

  const days = deliverySchedule.map((item) => item.day);
  const uniqueDays = new Set(days);

  if (days.length !== uniqueDays.size) {
    return "Duplicate delivery days are not allowed.";
  }

  const validDay = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  for (const item of deliverySchedule) {
    if (!item.day || !validDay.includes(item.day) || !item.cutOffTime) {
      return "Every schedule entry must include a valid day and cutOffTime.";
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(item.cutOffTime)) {
      return "cutOffTime must be in HH:mm format.";
    }
  }

  if (thresholdAmount && thresholdAmount <= 0) {
    return "Threshold amount must be greater than zero.";
  }

  return null;
};

export { validateCommunity };
