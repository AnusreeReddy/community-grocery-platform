const validateUserProfile = (data) => {
  if (data.email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email)) {
    return "A valid email address is required.";
  }

  if (data.fullName && data.fullName.trim().length < 3) {
    return "Full name must be at least 3 characters.";
  }

  return null;
};

const validateRoleUpdate = (role) => {
  const allowedRoles = ["customer", "communityAdmin", "shopkeeper", "superAdmin"];

  if (!allowedRoles.includes(role)) {
    return "Invalid role.";
  }

  return null;
};

export { validateUserProfile, validateRoleUpdate };
