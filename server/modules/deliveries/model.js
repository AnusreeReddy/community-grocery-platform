import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },

    deliveryDay: {
      type: String,
      required: true,
    },

    deliveryDate: {
      type: Date,
      required: true,
    },

    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    truckNumber: {
      type: String,
      default: "",
    },

    driverName: {
      type: String,
      default: "",
    },

    driverPhone: {
      type: String,
      default: "",
    },

    totalOrders: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    thresholdReached: {
      type: Boolean,
      default: false,
    },

    // A stable key makes creation of an active proposal idempotent even when
    // multiple orders reach a threshold at the same time.
    proposalKey: { type: String, unique: true, sparse: true },

    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    adminApproval: {
      actionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      actionAt: Date,
      note: { type: String, trim: true, default: "" },
    },

    shopkeeperApproval: {
      status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
      actionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      actionAt: Date,
      note: { type: String, trim: true, default: "" },
    },

    deliveryStatus: {
      type: String,
      enum: [
        "Scheduled",
        "Packed",
        "Dispatched",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Scheduled",
    },
  },
  {
    timestamps: true,
  }
);

deliverySchema.index({ community: 1, deliveryDate: 1, deliveryDay: 1 });

const Delivery = mongoose.model("Delivery", deliverySchema);

export default Delivery;
