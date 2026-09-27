import bcrypt from "bcryptjs";
import User from "../users/model.js";
import jwt from "jsonwebtoken";

const registerUser = async ({ fullName, email, password }) => {

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new Error("User already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        fullName,
        email,
        password: hashedPassword,
    });

    return user;
};
const loginUser = async ({ email, password }) => {

    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("Invalid email or password.");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Invalid email or password.");
    }

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );

    return { user, token };
};

export { registerUser, loginUser };
