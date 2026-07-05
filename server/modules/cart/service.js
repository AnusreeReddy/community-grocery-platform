import Cart from "./model.js";
import Product from "../products/model.js";

const getCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], totalAmount: 0 });
  }

  return cart;
};

const addToCart = async (userId, productId, quantity) => {
  const product = await Product.findById(productId);

  if (!product || !product.isAvailable) {
    throw new Error("Product not found.");
  }

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], totalAmount: 0 });
  }

  const existingItem = cart.items.find((item) => item.product.toString() === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity, price: product.price });
  }

  cart.totalAmount = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);

  await cart.save();

  return cart.populate("items.product");
};

const updateCartItem = async (userId, productId, quantity) => {
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart) throw new Error("Cart not found.");

  const item = cart.items.find((i) => i.product.toString() === productId);

  if (!item) throw new Error("Product not found in cart.");

  item.quantity = quantity;

  cart.totalAmount = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);

  await cart.save();

  return cart.populate("items.product");
};

const removeFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) throw new Error("Cart not found.");

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  cart.totalAmount = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);

  await cart.save();

  return cart.populate("items.product");
};

const clearCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) throw new Error("Cart not found.");

  cart.items = [];
  cart.totalAmount = 0;

  await cart.save();

  return cart;
};

export { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
