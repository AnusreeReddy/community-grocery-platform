import { validateRegister } from "./validation.js";
import { registerUser } from "./service.js";
import { loginUser } from "./service.js";
import User from "../users/model.js";

const register = async (req, res) => {

    try {

        const error = validateRegister(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error,
            });
        }

        const user = await registerUser(req.body);

const { password, ...userData } = user.toObject();

res.status(201).json({
    success: true,
    message: "User registered successfully.",
    user: userData,
});

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};
const login = async (req, res) => {

    try {

        const { user, token } = await loginUser(req.body);

        const { password, ...userData } = user.toObject();

        res.status(200).json({
            success: true,
            token,
            user: userData,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};

const me = async (req, res) => {

    const user = await User.findById(req.user.id).select("-password");

    res.status(200).json({
        success: true,
        user
    });

};

export { register, login, me };