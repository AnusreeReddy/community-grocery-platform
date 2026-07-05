import Notification from "./model.js";

const getNotificationsByUser = async (userId) => {
  return await Notification.find({ user: userId }).sort({ createdAt: -1 });
};

const markNotificationRead = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new Error("Notification not found.");
  }

  if (notification.user.toString() !== userId) {
    throw new Error("Unauthorized.");
  }

  notification.isRead = true;
  await notification.save();

  return notification;
};

const createNotification = async (userId, type, message, data = {}) => {
  return await Notification.create({ user: userId, type, message, data });
};

export { getNotificationsByUser, markNotificationRead, createNotification };
