const validateNotification = (data) => {
  if (!data.type || !data.message) {
    return "Notification type and message are required.";
  }
  return null;
};

export { validateNotification };
