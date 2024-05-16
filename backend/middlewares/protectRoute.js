import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

async function protectRoute(req, res, next) {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    req.user = user;

    next();
  } catch (error) {
    console.log(`Error from protectRoute, ${error}`);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export default protectRoute;
