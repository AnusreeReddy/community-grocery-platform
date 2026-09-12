import Product from "./model.js";

const createProduct = async (productData) => {
  const existingProduct = await Product.findOne({
    name: productData.name,
    shopkeeper: productData.shopkeeper,
  });

  if (existingProduct) {
    throw new Error("Product already exists.");
  }

  return await Product.create(productData);
};

const getAllProducts = async () => {
  return await Product.find({ isAvailable: true })
    .populate("shopkeeper", "fullName email")
    .sort({ createdAt: -1 });
};

const getProductById = async (productId) => {
  const product = await Product.findById(productId).populate(
    "shopkeeper",
    "fullName email"
  );

  if (!product || !product.isAvailable) {
    throw new Error("Product not found.");
  }

  return product;
};

const updateProduct = async (productId, data, userId, userRole) => {
  const product = await Product.findById(productId);

  if (!product || !product.isAvailable) {
    throw new Error("Product not found.");
  }

  if (userRole !== "superAdmin" && product.shopkeeper.toString() !== userId) {
    throw new Error("Unauthorized.");
  }

  const allowedFields = ["name", "description", "category", "brand", "price", "stock", "image", "isAvailable"];
  for (const field of allowedFields) {
    if (data[field] !== undefined) product[field] = data[field];
  }
  if (product.price <= 0) throw new Error("Price must be greater than zero.");
  if (!Number.isInteger(product.stock) || product.stock < 0) throw new Error("Stock must be a non-negative integer.");

  await product.save();

  return product;
};

const deleteProduct = async (productId, userId, userRole) => {
  const product = await Product.findById(productId);

  if (!product || !product.isAvailable) {
    throw new Error("Product not found.");
  }

  if (userRole !== "superAdmin" && product.shopkeeper.toString() !== userId) {
    throw new Error("Unauthorized.");
  }

  product.isAvailable = false;

  await product.save();

  return product;
};

const searchProducts = async (keyword) => {
  return await Product.find({
    isAvailable: true,
    name: {
      $regex: keyword,
      $options: "i",
    },
  })
    .populate("shopkeeper", "fullName email");
};

const filterProducts = async (category) => {
  return await Product.find({
    isAvailable: true,
    category,
  })
    .populate("shopkeeper", "fullName email");
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
