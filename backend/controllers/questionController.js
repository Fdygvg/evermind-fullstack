// controllers/questionController.js
import Question from "../models/Question.js";
import Section from "../models/Section.js";

export const getQuestions = async (req, res) => {
  try {
    const { sectionId } = req.query;
    const filter = { userId: req.userId };

    if (sectionId) {
      filter.sectionId = sectionId;
    }

    const questions = await Question.find(filter).populate("sectionId");

    res.json({
      success: true,
      data: { questions },
      count: questions.length,
    });
  } catch (error) {
    console.error("Get questions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching questions",
    });
  }
};
export const createQuestion = async (req, res) => {
  try {
    const { sectionId, question, answer } = req.body;

    // Verify section belongs to user
    const section = await Section.findOne({
      _id: sectionId,
      userId: req.userId,
    });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // USE Question.create() instead of new Question()
    const newQuestion = await Question.create({
      userId: req.userId,
      sectionId,
      question,
      answer,
      isCode: req.body.isCode || false,
      // Schema defaults will automatically apply:
      // priority: 0
      // dueDate: Date.now()
      // lastRating: null
      // etc.
    });

    await newQuestion.populate("sectionId");

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: { question: newQuestion },
    });
  } catch (error) {
    console.error("Create question error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating question",
    });
  }
};
export const bulkImportQuestions = async (req, res) => {
  try {
    const questions = req.body; // now body is an array
    const sectionId = questions[0]?.sectionId; // get sectionId from first question

    const section = await Section.findOne({
      _id: sectionId,
      userId: req.userId,
    });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const questionsToInsert = questions.map((q) => ({
      userId: req.userId,
      sectionId,
      question: q.question,
      answer: q.answer,
      isCode: q.isCode || false,
    }));

    const insertedQuestions = await Question.insertMany(questionsToInsert);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${insertedQuestions.length} questions`,
      data: { questions: insertedQuestions },
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    res.status(500).json({
      success: false,
      message: "Error importing questions",
    });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, sectionId, isCode, isBookmarked } = req.body;

    const updateData = { question, answer, sectionId };
    if (isCode !== undefined) {
      updateData.isCode = isCode;
    }
    if (isBookmarked !== undefined) {
      updateData.isBookmarked = isBookmarked;
    }

    const updatedQuestion = await Question.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate("sectionId");

    if (!updatedQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.json({
      success: true,
      message: "Question updated successfully",
      data: { question: updatedQuestion },
    });
  } catch (error) {
    console.error("Update question error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating question",
    });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting question",
    });
  }
};

export const searchQuestions = async (req, res) => {
  try {
    const { query, sectionId, tag } = req.query;
    const filter = { userId: req.userId };

    if (sectionId) filter.sectionId = sectionId;
    if (tag) filter.tags = tag;
    if (query) {
      filter.$or = [
        { question: { $regex: query, $options: "i" } },
        { answer: { $regex: query, $options: "i" } },
      ];
    }

    const questions = await Question.find(filter).populate("sectionId");

    res.json({
      success: true,
      data: { questions },
      count: questions.length,
    });
  } catch (error) {
    console.error("Search questions error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching questions",
    });
  }
};

export const exportQuestions = async (req, res) => {
  try {
    const { sectionId } = req.query;
    const filter = { userId: req.userId };
    if (sectionId) filter.sectionId = sectionId;

    // FIX: Use proper population and handle missing sections
    const questions = await Question.find(filter)
      .populate({
        path: 'sectionId',
        select: 'name color'
      });

    // FIX: Handle cases where section might be deleted or not found
    const exportData = questions.map(q => ({
      question: q.question,
      answer: q.answer,
      category: q.sectionId ? q.sectionId.name : 'Uncategorized',
      sectionColor: q.sectionId ? q.sectionId.color : '#6B7280',
      tags: q.tags,
      correctCount: q.totalCorrect,
      wrongCount: q.totalWrong,
      lastReviewed: q.lastReviewed,
      createdAt: q.createdAt
    }));

    console.log(`Exporting ${exportData.length} questions for user ${req.userId}`); // Debug log

    res.json({
      success: true,
      data: {
        questions: exportData,
        exportDate: new Date().toISOString(),
        totalQuestions: questions.length,
        totalSections: [...new Set(questions.map(q => q.sectionId?.name).filter(Boolean))].length
      }
    });
  } catch (error) {
    console.error('Export questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting questions'
    });
  }
};

export const toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the question first to get current state (or just flip it atomically if we knew it)
    const question = await Question.findOne({ _id: id, userId: req.userId });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Toggle
    question.isBookmarked = !question.isBookmarked;
    await question.save();

    // Populate to return full object if needed by frontend lists
    await question.populate("sectionId");

    res.json({
      success: true,
      message: question.isBookmarked ? "Question bookmarked" : "Bookmark removed",
      data: { question },
    });
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling bookmark",
    });
  }
};
