import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["customer", "communityAdmin", "shopkeeper", "superAdmin"],
      default: "customer",
    },

    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      default: null,
    },

    // Only meaningful for role "shopkeeper". Self-registered shopkeepers
    // start Pending and cannot manage products until a superAdmin approves
    // them. Defaults to Approved so accounts created directly (seed data,
    // role promotion by an admin) are not accidentally locked out.
    shopkeeperApprovalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Approved",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;