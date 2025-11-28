// controllers/sectionController.js
import Section from "../models/Section.js";
import Question from "../models/Question.js";

export const getSections = async (req, res) => {
  try {
    const sections = await Section.find({ userId: req.userId });

    res.json({
      success: true,
      data: { sections },
      count: sections.length,
    });
  } catch (error) {
    console.error("Get sections error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sections",
    });
  }
};

export const createSection = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    const section = new Section({
      userId: req.userId,
      name,
      description,
      color,
    });

    await section.save();

    res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: { section },
    });
  } catch (error) {
    console.error("Create section error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating section",
    });
  }
};

export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const section = await Section.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { name, description, color },
      { new: true, runValidators: true }
    );

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    res.json({
      success: true,
      message: "Section updated successfully",
      data: { section },
    });
  } catch (error) {
    console.error("Update section error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating section",
    });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if section exists and belongs to user
    const section = await Section.findOne({ _id: id, userId: req.userId });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Delete the section
    await Section.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.error("Delete section error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting section",
    });
  }
};
