import express from "express";
import cors from "cors";
let swaggerUi;
let YAML;
try {
  // Dynamically import Swagger components if available
  // This avoids failing startup when devs skip installing optional packages.
  // eslint-disable-next-line no-undef
  swaggerUi = (await import("swagger-ui-express")).default;
  YAML = (await import("yamljs")).default;
} catch (e) {
  // Swagger not available; continue without API docs
  swaggerUi = null;
  YAML = null;
}
import authRoutes from "./modules/auth/routes.js";
import userRoutes from "./modules/users/routes.js";
import communityRoutes from "./modules/communities/routes.js";
import productRoutes from "./modules/products/routes.js";
import cartRoutes from "./modules/cart/routes.js";
import orderRoutes from "./modules/orders/routes.js";
import deliveryRoutes from "./modules/deliveries/routes.js";
import thresholdRoutes from "./modules/threshold/routes.js";
import notificationRoutes from "./modules/notifications/routes.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/communities", communityRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/deliveries", deliveryRoutes);
app.use("/api/v1/threshold", thresholdRoutes);
app.use("/api/v1/notifications", notificationRoutes);
if (swaggerUi && YAML) {
  const swaggerDocument = YAML.load("./swagger.yaml");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Smart Community Grocery Pooling API is running",
  });
});

app.use(errorHandler);

export default app;
