// controllers/userController.js
import User from "../models/User.js";

export const updatePreferences = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      referralSource,
      learningCategory,
      techStack,
      currentFocus,
      skillLevel,
      studyTime,
    } = req.body;

    // Find user and update preferences
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update preferences
    user.preferences = {
      referralSource: referralSource || user.preferences.referralSource,
      learningCategory: learningCategory || user.preferences.learningCategory,
      techStack: techStack || user.preferences.techStack,
      currentFocus: currentFocus || user.preferences.currentFocus,
      skillLevel: skillLevel || user.preferences.skillLevel,
      studyTime: studyTime || user.preferences.studyTime,
      completedOnboarding: true,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      data: {
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update preferences",
      error: error.message,
    });
  }
};


export const getPreferences = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select("preferences");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch preferences",
      error: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { username, email } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if username or email is already taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
      user.email = email;
      user.isVerified = false; // Require re-verification if email changes
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: user.getProfile(),
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};