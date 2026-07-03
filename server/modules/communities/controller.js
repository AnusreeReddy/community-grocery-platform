import { validateCommunity } from "./validation.js";
import { createCommunity } from "./service.js";

const create = async (req, res) => {
    try {

        const error = validateCommunity(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error,
            });
        }

const communityData = {
    ...req.body,
    createdBy: req.user.id,
};

const community = await createCommunity(communityData);git
        res.status(201).json({
            success: true,
            message: "Community created successfully.",
            community,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};

export { create };