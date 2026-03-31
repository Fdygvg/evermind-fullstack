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
 * POST /api/ai/chat
 * Unified chat endpoint — handles free-form messages and shortcut commands
 */
export const chatWithSage = async (req, res) => {
  try {
    const { message, questionContext, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    // Build the system prompt with the current question context
    let systemPrompt = CODE_SAGE_SYSTEM_PROMPT;
    if (questionContext && questionContext.question) {
      systemPrompt += `\n\nThe student is currently reviewing this flashcard:\n**Question:** ${questionContext.question}\n**Answer:** ${questionContext.answer || '(no answer provided)'}`;
    }

    const isRewrite = message === '__REWRITE__';

    // Determine user message based on shortcut commands
    let userMessage = message;
    if (message === '__EXPLAIN__') {
      userMessage = `Break down this question and answer for me like I'm a junior developer seeing this concept for the first time. Explain the core concept, why it matters, and give me a practical example I can relate to.`;
    } else if (isRewrite) {
      userMessage = `I need you to rewrite the answer to this flashcard question in two different styles. Use the question for context and rewrite the answer only.

**Version A (Short)** — A brief, to-the-point answer. 2-4 sentences max. Easy to scan during quick review.

**Version B (Concise)** — A tightly written answer that covers all key points without fluff. Uses bullet points or numbered steps where helpful. No unnecessary words.

Return your response in this EXACT format (including the markers):
---VERSION_A---
(your short version here)
---VERSION_B---
(your concise version here)
---END---`;
    }

    // Build messages array: system + last 5 conversation messages + new user message
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add conversation history (last 5 messages for context)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-5);
      recentHistory.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }

    // Add the current user message
    messages.push({ role: 'user', content: userMessage });

    const chatCompletion = await getGroq().chat.completions.create({
      messages,
      model: 'qwen/qwen3-32b',
      temperature: isRewrite ? 0.7 : 0.6,
      max_completion_tokens: isRewrite ? 3072 : 2048,
      top_p: 0.95,
      stream: false
    });

    let rawReply = chatCompletion.choices[0]?.message?.content || 'No response generated.';
    rawReply = stripThinking(rawReply);

    // If rewrite, parse structured versions
    if (isRewrite) {
      let versionA = '';
      let versionB = '';

      const matchA = rawReply.match(/---VERSION_A---\s*([\s\S]*?)\s*---VERSION_B---/);
      const matchB = rawReply.match(/---VERSION_B---\s*([\s\S]*?)\s*(?:---END---|$)/);

      if (matchA) versionA = matchA[1].trim();
      if (matchB) versionB = matchB[1].trim();

      // Fallback if parsing failed
      if (!versionA && !versionB) {
        const parts = rawReply.split(/version\s*b/i);
        if (parts.length >= 2) {
          versionA = parts[0].replace(/version\s*a/i, '').trim();
          versionB = parts[1].trim();
        } else {
          versionA = rawReply;
          versionB = questionContext?.answer || rawReply;
        }
      }

      return res.json({
        success: true,
        data: {
          type: 'rewrite',
          reply: 'Here are two rewritten versions of the answer:',
          versionA,
          versionB,
          original: questionContext?.answer || ''
        }
      });
    }

    res.json({
      success: true,
      data: { type: 'chat', reply: rawReply }
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get response: ' + (error.message || 'Unknown error')
    });
  }
};

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
