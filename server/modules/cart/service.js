import mongoose from "mongoose";
import Cart from "./model.js";
import Product from "../products/model.js";
import { badRequest, notFound } from "../../utils/errors.js";

// A cart only records what the customer wants to pool. Delivery day/date,
// payment method and the cutoff/batch/threshold checks stay in the order flow
// (POST /orders), so cart operations never need them.
const emptyCart = (userId) => ({ user: userId, items: [], totalAmount: 0 });

const recalculateTotal = (cart) => {
  cart.totalAmount = cart.items.reduce(
    (total, item) => total + item.quantity * (item.price || 0),
    0
  );
};

const getAvailableProduct = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw badRequest("productId is not valid.");
  }

  const product = await Product.findById(productId);

  if (!product || !product.isAvailable) {
    throw notFound("Product not found.");
  }

  return product;
};

const getCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  return cart || emptyCart(userId);
};

const addToCart = async (userId, productId, quantity = 1) => {
  const product = await getAvailableProduct(productId);

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({ user: userId, items: [], totalAmount: 0 });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === product._id.toString()
  );
  const nextQuantity = existingItem ? existingItem.quantity + quantity : quantity;

  if (nextQuantity > product.stock) {
    throw badRequest(`Insufficient stock for ${product.name}.`);
  }

  if (existingItem) {
    existingItem.quantity = nextQuantity;
    existingItem.price = product.price;
  } else {
    cart.items.push({ product: product._id, quantity, price: product.price });
  }

  recalculateTotal(cart);
  await cart.save();

  return await cart.populate("items.product");
};

const updateCartItem = async (userId, productId, quantity) => {
  const product = await getAvailableProduct(productId);
  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    throw notFound("Cart is empty.");
  }

  const item = cart.items.find(
    (entry) => entry.product.toString() === product._id.toString()
  );

  if (!item) {
    throw notFound("Product is not in your cart.");
  }

  if (quantity > product.stock) {
    throw badRequest(`Insufficient stock for ${product.name}.`);
  }

  item.quantity = quantity;
  item.price = product.price;

  recalculateTotal(cart);
  await cart.save();

  return await cart.populate("items.product");
};

const removeFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    throw notFound("Cart is empty.");
  }

  const remainingItems = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  if (remainingItems.length === cart.items.length) {
    throw notFound("Product is not in your cart.");
  }

  cart.items = remainingItems;

  recalculateTotal(cart);
  await cart.save();

  return await cart.populate("items.product");
};

const clearCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    return emptyCart(userId);
  }

  cart.items = [];
  cart.totalAmount = 0;
  await cart.save();

  return cart;
};

export { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
