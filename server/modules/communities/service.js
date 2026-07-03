import Community from "./model.js";

const createCommunity = async (communityData) => {

    const existingCommunity = await Community.findOne({
        name: communityData.name,
        pincode: communityData.pincode,
    });

    if (existingCommunity) {
        throw new Error("Community already exists.");
    }

    const community = await Community.create(communityData);

    return community;
};

export { createCommunity };