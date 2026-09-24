import Product from "./model.js";
import User from "../users/model.js";
import { badRequest, notFound, forbidden } from "../../utils/errors.js";

// A shopkeeper must be admin-approved before they can list or edit
// inventory. Checked against the live User record (JWT only carries
// {id, role}). superAdmin always passes.
const assertCanManageProducts = async (userId, userRole) => {
  if (userRole === "superAdmin") return;
  const user = await User.findById(userId).select("shopkeeperApprovalStatus role");
  if (!user || user.role !== "shopkeeper") {
    throw forbidden("Only an approved shopkeeper can manage products.");
  }
  if (user.shopkeeperApprovalStatus !== "Approved") {
    throw forbidden("Your shopkeeper account is pending admin approval before you can manage products.");
  }
};

const createProduct = async (productData) => {
  await assertCanManageProducts(productData.shopkeeper, productData.shopkeeperRole);

  const existingProduct = await Product.findOne({
    name: productData.name,
    shopkeeper: productData.shopkeeper,
  });

  if (existingProduct) {
    throw badRequest("Product already exists.");
  }

  const { shopkeeperRole, ...payload } = productData;
  return await Product.create(payload);
};

// Products are shop inventory offered community-wide by default; a product
// can optionally be restricted to specific communities. When a communityId
// is supplied, only products available to that community are returned --
// this is what makes the shopping flow contextual to the customer's chosen
// community rather than a flat global catalog.
const getAllProducts = async (communityId) => {
  const query = { isAvailable: true };
  if (communityId) {
    query.$or = [{ communities: { $size: 0 } }, { communities: communityId }];
  }
  return await Product.find(query).populate("shopkeeper", "fullName email").sort({ createdAt: -1 });
};

const getProductById = async (productId) => {
  const product = await Product.findById(productId).populate("shopkeeper", "fullName email");

  if (!product || !product.isAvailable) {
    throw notFound("Product not found.");
  }

  return product;
};

const updateProduct = async (productId, data, userId, userRole) => {
  const product = await Product.findById(productId);

  if (!product || !product.isAvailable) {
    throw notFound("Product not found.");
  }

  if (userRole !== "superAdmin" && product.shopkeeper.toString() !== userId) {
    throw forbidden("Unauthorized.");
  }

  await assertCanManageProducts(userId, userRole);

  const allowedFields = ["name", "description", "category", "brand", "price", "stock", "image", "isAvailable", "communities"];
  for (const field of allowedFields) {
    if (data[field] !== undefined) product[field] = data[field];
  }
  if (product.price <= 0) throw badRequest("Price must be greater than zero.");
  if (!Number.isInteger(product.stock) || product.stock < 0) throw badRequest("Stock must be a non-negative integer.");

  await product.save();

  return product;
};

const deleteProduct = async (productId, userId, userRole) => {
  const product = await Product.findById(productId);

  if (!product || !product.isAvailable) {
    throw notFound("Product not found.");
  }

  if (userRole !== "superAdmin" && product.shopkeeper.toString() !== userId) {
    throw forbidden("Unauthorized.");
  }

  product.isAvailable = false;

  await product.save();

  return product;
};

const searchProducts = async (keyword, communityId) => {
  const query = {
    isAvailable: true,
    name: { $regex: keyword || "", $options: "i" },
  };
  if (communityId) {
    query.$or = [{ communities: { $size: 0 } }, { communities: communityId }];
  }
  return await Product.find(query).populate("shopkeeper", "fullName email");
};

const filterProducts = async (category, communityId) => {
  const query = { isAvailable: true, category };
  if (communityId) {
    query.$or = [{ communities: { $size: 0 } }, { communities: communityId }];
  }
  return await Product.find(query).populate("shopkeeper", "fullName email");
};

export {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  filterProducts,
};
