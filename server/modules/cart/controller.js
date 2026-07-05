import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "./service.js";

const get = async (req, res) => {
  try {
    const cart = await getCart(req.user.id);

    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const add = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await addToCart(req.user.id, productId, Number(quantity) || 1);

    res.status(200).json({ success: true, message: "Product added to cart.", cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await updateCartItem(req.user.id, req.params.productId, Number(quantity));

    res.status(200).json({ success: true, message: "Cart updated.", cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const cart = await removeFromCart(req.user.id, req.params.productId);

    res.status(200).json({ success: true, message: "Product removed from cart.", cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const clear = async (req, res) => {
  try {
    const cart = await clearCart(req.user.id);

    res.status(200).json({ success: true, message: "Cart cleared.", cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export { get, add, update, remove, clear };
