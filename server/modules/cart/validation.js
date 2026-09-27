import mongoose from "mongoose";

// Cart payloads only carry product/quantity -- delivery day, delivery date and
// payment method are validated by the order module when the batch is placed.
const validateAddToCart = (data) => {
  if (!data) {
    return "Cart payload is required.";
  }

  if (!data.productId) {
    return "productId is required.";
  }

  if (!mongoose.Types.ObjectId.isValid(data.productId)) {
    return "productId is not valid.";
  }

  if (
    data.quantity !== undefined &&
    (!Number.isInteger(Number(data.quantity)) || Number(data.quantity) < 1)
  ) {
    return "quantity must be a positive integer.";
  }

  return null;
};

const validateCartQuantity = (data) => {
  if (!data) {
    return "Cart payload is required.";
  }

  if (!Number.isInteger(Number(data.quantity)) || Number(data.quantity) < 1) {
    return "quantity must be a positive integer.";
  }

  return null;
};

export { validateAddToCart, validateCartQuantity };
