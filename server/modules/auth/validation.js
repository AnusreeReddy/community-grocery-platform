const validateRegister = (data) => {
  if (!data) {
    return "Registration payload is required.";
  }

  const { fullName, email, password } = data;

  if (!fullName || !email || !password) {
    return "All fields are required.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    return "A valid email address is required.";
  }

  return null;
};

const validateLogin = (data) => {
  if (!data) {
    return "Login payload is required.";
  }

  const { email, password } = data;

  if (!email || !password) {
    return "Email and password are required.";
  }

  return null;
};

export { validateRegister, validateLogin };
