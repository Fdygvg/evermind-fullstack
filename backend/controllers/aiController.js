// backend/controllers/aiController.js
import Groq from 'groq-sdk';
import Question from '../models/Question.js';

// Lazy-init: dotenv hasn't run yet at import time
let _groq = null;
function getGroq() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

const CODE_SAGE_SYSTEM_PROMPT = `You are Code Sage — a tech-obsessed, friendly programming tutor who explains concepts like you're talking to a junior developer. 

Your personality:
- Technical but passionate, you genuinely love code
- You use clear analogies and real-world comparisons
- You break complex ideas into digestible steps
- You occasionally drop coding jokes or references
- You use markdown formatting for readability (headers, bold, code blocks, bullet points)
- Keep explanations concise but thorough — aim for 200-400 words
- Always include a practical example or code snippet when relevant

IMPORTANT: Output ONLY your final response. DO NOT include any internal thoughts, reasoning processes, or <think> tags. Deliver the direct answer formatted in Markdown.`;

/**
 * Helper to remove <think>...</think> tags if the model still generates them.
 */
const stripThinking = (text) => (text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

/**
 * POST /api/ai/explain
 * Explains the current question + answer to the user like they're a junior dev
 */
export const explainQuestion = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: 'Question text is required' });
    }

    const userPrompt = `Here's a study question and its answer. Break it down for me like I'm a junior developer who's seeing this concept for the first time.

**Question:** ${question}

**Answer:** ${answer || '(no answer provided)'}

Explain the core concept, why it matters, and give me a practical example I can relate to.`;

    const chatCompletion = await getGroq().chat.completions.create({
      messages: [
        { role: 'system', content: CODE_SAGE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      model: 'qwen/qwen3-32b',
      temperature: 0.6,
      max_completion_tokens: 2048,
      top_p: 0.95,
      stream: false
    });

    let explanation = chatCompletion.choices[0]?.message?.content || 'No response generated.';
    explanation = stripThinking(explanation);

    res.json({
      success: true,
      data: { explanation }
    });
  } catch (error) {
    console.error('AI Explain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate explanation: ' + (error.message || 'Unknown error')
    });
  }
};

/**
 * POST /api/ai/rewrite
 * Generates 2 rewritten versions of the answer
 */
export const rewriteAnswer = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }

    const userPrompt = `Here's a study flashcard. Rewrite the answer in two different styles. Keep the core information accurate but make each version distinct.

**Question:** ${question}

**Current Answer:** ${answer}

Generate exactly two rewritten versions:

**Version A** — A concise, bullet-point version that's easy to scan quickly during review.

**Version B** — A more detailed explanation with examples and context, formatted with markdown.

Return your response in this exact format (including the markers):
---VERSION_A---
(your version A here)
---VERSION_B---
(your version B here)
---END---`;

    const chatCompletion = await getGroq().chat.completions.create({
      messages: [
        { role: 'system', content: CODE_SAGE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      model: 'qwen/qwen3-32b',
      temperature: 0.7,
      max_completion_tokens: 3072,
      top_p: 0.95,
      stream: false
    });

    let rawResponse = chatCompletion.choices[0]?.message?.content || '';
    rawResponse = stripThinking(rawResponse);

    // Parse the two versions
    let versionA = '';
    let versionB = '';

    const matchA = rawResponse.match(/---VERSION_A---\s*([\s\S]*?)\s*---VERSION_B---/);
    const matchB = rawResponse.match(/---VERSION_B---\s*([\s\S]*?)\s*(?:---END---|$)/);

    if (matchA) versionA = matchA[1].trim();
    if (matchB) versionB = matchB[1].trim();

    // Fallback: if parsing failed, split by some heuristic
    if (!versionA && !versionB) {
      const parts = rawResponse.split(/version\s*b/i);
      if (parts.length >= 2) {
        versionA = parts[0].replace(/version\s*a/i, '').trim();
        versionB = parts[1].trim();
      } else {
        versionA = rawResponse;
        versionB = answer; // fallback to original
      }
    }

    res.json({
      success: true,
      data: {
        versionA,
        versionB,
        original: answer
      }
    });
  } catch (error) {
    console.error('AI Rewrite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate rewrite: ' + (error.message || 'Unknown error')
    });
  }
};

/**
 * PUT /api/ai/save-answer/:questionId
 * Saves a selected rewritten answer to the database
 */
export const saveRewrittenAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { newAnswer } = req.body;

    if (!newAnswer) {
      return res.status(400).json({ success: false, message: 'newAnswer is required' });
    }

    const question = await Question.findOneAndUpdate(
      { _id: questionId, userId: req.userId },
      { answer: newAnswer },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({
      success: true,
      message: 'Answer updated successfully',
      data: { question }
    });
  } catch (error) {
    console.error('Save rewritten answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save answer'
    });
  }
};
