import {
  getNotificationsByUser,
  markNotificationRead,
} from "./service.js";

const getNotifications = async (req, res) => {
  try {
    const notifications = await getNotificationsByUser(req.user.id);

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const readNotification = async (req, res) => {
  try {
    const notification = await markNotificationRead(req.params.id, req.user.id);

    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export { getNotifications, readNotification };
