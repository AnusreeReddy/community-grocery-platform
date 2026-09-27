import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from "./service.js";
import { validateAddToCart, validateCartQuantity } from "./validation.js";
import { asyncRoute } from "../../utils/http.js";
import { badRequest } from "../../utils/errors.js";

// Cart endpoints only manage the pooled cart. Placing the order (delivery day,
// payment method, cutoff, batch capacity, threshold) stays with /orders.
const getMine = asyncRoute(async (req, res) => {
  const cart = await getCart(req.user.id);

  res.status(200).json({ success: true, cart });
});

const addItem = asyncRoute(async (req, res) => {
  const error = validateAddToCart(req.body);
  if (error) throw badRequest(error);

  const cart = await addToCart(
    req.user.id,
    req.body.productId,
    Number(req.body.quantity ?? 1)
  );

  res.status(201).json({ success: true, message: "Item added to your pool cart.", cart });
});

const updateItem = asyncRoute(async (req, res) => {
  const error = validateCartQuantity(req.body);
  if (error) throw badRequest(error);

  const cart = await updateCartItem(
    req.user.id,
    req.params.productId,
    Number(req.body.quantity)
  );

  res.status(200).json({ success: true, message: "Cart item updated.", cart });
});

const removeItem = asyncRoute(async (req, res) => {
  const cart = await removeFromCart(req.user.id, req.params.productId);

  res.status(200).json({ success: true, message: "Item removed from your pool cart.", cart });
});

const clear = asyncRoute(async (req, res) => {
  const cart = await clearCart(req.user.id);

  res.status(200).json({ success: true, message: "Pool cart cleared.", cart });
});

export { getMine, addItem, updateItem, removeItem, clear };
