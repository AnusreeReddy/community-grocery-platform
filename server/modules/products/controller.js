import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  filterProducts,
} from "./service.js";

import { validateProduct } from "./validation.js";
import { asyncRoute } from "../../utils/http.js";
import { badRequest } from "../../utils/errors.js";

const create = asyncRoute(async (req, res) => {
  const error = validateProduct(req.body);
  if (error) throw badRequest(error);

  const product = await createProduct({
    ...req.body,
    shopkeeper: req.user.id,
    shopkeeperRole: req.user.role,
  });

  res.status(201).json({ success: true, message: "Product created successfully.", product });
});

const getAll = asyncRoute(async (req, res) => {
  const products = await getAllProducts(req.query.community);
  res.status(200).json({ success: true, count: products.length, products });
});

const getById = asyncRoute(async (req, res) => {
  const product = await getProductById(req.params.id);
  res.status(200).json({ success: true, product });
});

const update = asyncRoute(async (req, res) => {
  const product = await updateProduct(req.params.id, req.body, req.user.id, req.user.role);
  res.status(200).json({ success: true, message: "Product updated successfully.", product });
});

const remove = asyncRoute(async (req, res) => {
  const product = await deleteProduct(req.params.id, req.user.id, req.user.role);
  res.status(200).json({ success: true, message: "Product deleted successfully.", product });
});

const search = asyncRoute(async (req, res) => {
  const products = await searchProducts(req.query.keyword, req.query.community);
  res.status(200).json({ success: true, products });
});

const filter = asyncRoute(async (req, res) => {
  const products = await filterProducts(req.params.category, req.query.community);
  res.status(200).json({ success: true, products });
});

export { create, getAll, getById, update, remove, search, filter };
