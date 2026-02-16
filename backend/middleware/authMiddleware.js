// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import rateLimit from 'express-rate-limit'

export const protect = async (req, res, next) => {
  try {
    let token;

    // First, try to get token from httpOnly cookie
    if (req.cookies && req.cookies.evermind_token) {
      token = req.cookies.evermind_token;
    }
    // Fallback to Authorization header for backward compatibility
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    if (token.length > 500) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token revoked. Please login again.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const user = await User.findById(decoded.userId).select("_id isActive");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account disabled" });
    }

    req.userId = user._id;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};


export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many attempts. Please try again later.'
});

export const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.userId || req.ip, // Use userId if auth, else IP
  message: 'Too many attempts. Please try again later.'
});

// NEW per-user limiters

// Standard CRUD operations (get/list)
export const commonLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
  keyGenerator: (req) => req.userId || req.ip,
  message: 'Too many requests. Please slow down.'
});

// Write operations (create/update/delete)
export const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.userId || req.ip,
  message: 'Too many updates. Please wait a moment.'
});

// AI/Heavy operations
export const heavyOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => req.userId || req.ip,
  message: 'Rate limit exceeded for heavy operations.'
});


export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many requests from this IP.'
});



export const dangerousOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.userId || req.ip,
  message: 'Too many bulk operations. Please wait.'
});


export const questionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.userId || req.ip,
  message: 'Too many question operations. Please try again later.'
});