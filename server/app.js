import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/routes.js";
import communityRoutes from "./modules/communities/routes.js";

const app=express()
app.use(cors())
app.use(express.json())
app.use("/api/v1/communities", communityRoutes);

app.get("/",(req,res)=>{
    res.status(200).json({
        message:"Smart Community Grocery Pooling API is running "
    });
});

app.use("/api/v1/auth", authRoutes);
export default app;