const validateRegister = ({ fullName, email, password }) => {
    if (!fullName || !email || !password) {
        return "All fields are required.";
    }

    if (password.length < 6) {
        return "Password must be at least 6 characters.";
    }

    return null;
};

export { validateRegister };