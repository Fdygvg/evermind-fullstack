// controllers/sectionController.js
import Section from "../models/Section.js";
import Question from "../models/Question.js";

export const getSections = async (req, res) => {
  try {
    // By default return only active sections; pass ?archived=true for archived ones
    const showArchived = req.query.archived === 'true';
    const filter = { userId: req.userId, isActive: !showArchived };

    const sections = await Section.find(filter);
    
    // Get question counts for each section
    const sectionsWithCounts = await Promise.all(
      sections.map(async (section) => {
        const questionCount = await Question.countDocuments({
          userId: req.userId,
          sectionId: section._id
        });
        
        return {
          ...section.toObject(),
          questionCount
        };
      })
    );
    
    res.json({
      success: true,
      data: { sections: sectionsWithCounts },
      count: sectionsWithCounts.length
    });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sections'
    });
  }
};

export const archiveSection = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Section.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    res.json({ success: true, message: 'Section archived', data: { section } });
  } catch (error) {
    console.error('Archive section error:', error);
    res.status(500).json({ success: false, message: 'Error archiving section' });
  }
};

export const restoreSection = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Section.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { isActive: true },
      { new: true }
    );

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    res.json({ success: true, message: 'Section restored', data: { section } });
  } catch (error) {
    console.error('Restore section error:', error);
    res.status(500).json({ success: false, message: 'Error restoring section' });
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

export const getSectionStats = async (req, res) => {
  try {
    const { sectionId } = req.params;
    
    // Verify section belongs to user
    const section = await Section.findOne({
      _id: sectionId,
      userId: req.userId
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Get question count
    const questionCount = await Question.countDocuments({
      userId: req.userId,
      sectionId: sectionId
    });

    // Get performance stats
    const performanceStats = await Question.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
          sectionId: new mongoose.Types.ObjectId(sectionId)
        }
      },
      {
        $group: {
          _id: null,
          totalCorrect: { $sum: '$totalCorrect' },
          totalWrong: { $sum: '$totalWrong' },
          totalAttempts: { $sum: { $add: ['$totalCorrect', '$totalWrong'] } },
          lastReviewed: { $max: '$lastReviewed' }
        }
      }
    ]);

    const stats = performanceStats[0] || {};
    const totalAttempts = stats.totalAttempts || 0;
    const accuracy = totalAttempts > 0 
      ? Math.round((stats.totalCorrect / totalAttempts) * 100)
      : 0;

    // Get recent questions
    const recentQuestions = await Question.find({
      userId: req.userId,
      sectionId: sectionId
    })
    .sort({ lastReviewed: -1 })
    .limit(5)
    .select('question totalCorrect totalWrong lastReviewed');

    res.json({
      success: true,
      data: {
        questionCount,
        accuracy,
        totalCorrect: stats.totalCorrect || 0,
        totalWrong: stats.totalWrong || 0,
        totalAttempts,
        lastActivity: stats.lastReviewed || null,
        recentQuestions
      }
    });

  } catch (error) {
    console.error('Get section stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching section stats'
    });
  }
};

export const resetAllProgress = async (req, res) => {
  try {
    // Reset all questions for this user
    await Question.updateMany(
      { userId: req.userId },
      {
        $set: {
          totalCorrect: 0,
          totalWrong: 0,
          lastReviewed: null,
          nextReviewDate: new Date(),
          priority: 0,
          lastRating: null,
          dueDate: 0,
          timesReviewed: 0,
          wasRolledOver: false,
          priorityBoosts: 0,
          consecutiveMisses: 0,
          lastReviewedAt: null,
          easeFactor: 2.5,
          currentInterval: 0,
          isPending: false,
          pendingSessionId: null
        }
      }
    );

    // Also delete any existing review sessions for this user so they don't resume old states
    const mongoose = (await import('mongoose')).default;
    await mongoose.model('ReviewSession').deleteMany({ userId: req.userId });

    res.json({ success: true, message: 'All progress reset to Day 1' });
  } catch (error) {
    console.error('Reset all progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset progress' });
  }
};