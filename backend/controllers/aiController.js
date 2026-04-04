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
- For standard chat messages, keep responses STRICTLY concise (max 3 sentences) unless the user explicitly asks for a long explanation.
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
    const isFramework = message === '__FRAMEWORK__';
    const isQuestionRewrite = message === '__REWRITE_QUESTION__';

    // Determine user message based on shortcut commands
    let userMessage = message;
    if (message === '__EXPLAIN__') {
      userMessage = `Break down this question and answer for me like I'm a junior developer seeing this concept for the first time. Explain the core concept, why it matters, and give me a practical example I can relate to.`;
    } else if (isFramework) {
      userMessage = `I need you to rewrite this flashcard using the EVERMIND Mastery Framework.

First, write a new question that tests the same concept but is worded differently from the original. 
Format the new question exactly as checkboxes with bold text, like this example:
- [ ] **What is <term> and how does it work?**
- [ ] **What problem does it solve?**
- [ ] **Provide an example of its syntax.**
- [ ] **Describe two practical applications.**
- [ ] **Give a mental analogy.**
- [ ] **List 5 key concepts.**

Then, write the answer strictly using this exact format:

Return your response in this EXACT format (including the markers):
---QUESTION---
(your rewritten question here — test the same concept, different wording)
---ANSWER---
**What it is:** (1 concise sentence)
**Why it exists:** (What specific problem in programming did it solve?)
**Syntax:** (A small code block showing basic usage)
**Use Cases:** (Provide exactly 2 very practical use cases. Format EACH as an HTML details block exactly like this: <details><summary>👉 Use Case Title</summary>\n\n\`\`\`javascript\ncode example here\n\`\`\`\n</details>)
**Mental Analogy:** (A real-world comparison starting with "It's like...")
**Key Concepts:**
• **Term** - Short description
• **Term** - Short description
• **Term** - Short description
• **Term** - Short description
• **Term** - Short description
(List exactly 5 key concepts as bullet points. Each one must be a bold term followed by a dash and a brief description. Do NOT write full sentences.)
---END---`;
    } else if (isQuestionRewrite) {
      userMessage = `I need you to rewrite ONLY the question for this flashcard. Do NOT touch the answer.

Your task:
1. Read the ANSWER carefully and identify the key concepts it covers.
2. Rewrite the question as a short checklist of sub-questions that test the user's recall WITHOUT revealing the answer.
3. Generate TWO different versions.

CRITICAL RULES:
- NEVER include the answer or any part of the answer inside the question. The question must TEST knowledge, not reveal it.
  BAD: "- [ ] **Three ways to declare variables (var, let, const)**" ← this reveals the answer!
  GOOD: "- [ ] **What are the three ways to declare variables?**" ← this tests recall
- Each sub-question should be SHORT (one line, under 15 words)
- Use simple phrasing like: "Explain...", "What is the syntax for...", "Give an example of..."
- Generate between 2 and 5 sub-questions per version (NOT always the same number — adapt to how many distinct concepts the answer covers)
- Use this exact format: - [ ] **Sub-question here**
- V1 and V2 should cover the same concepts but with different wording

Here is an example of the style I want:

If the answer explains prompt() in JavaScript (showing syntax, return value, and an example with age), the rewritten question should be:
- [ ] **Explain the prompt in JavaScript**
- [ ] **What is the syntax for prompt?**
- [ ] **Give an example using prompt to collect user age**

Return your response in this EXACT format:
---V1---
- [ ] **first sub-question**
- [ ] **second sub-question**
(etc.)
---V2---
- [ ] **first sub-question**
- [ ] **second sub-question**
(etc.)
---END---`;
    } else if (isRewrite) {
      userMessage = `I need you to rewrite this flashcard (both the question AND the answer) in two different styles.

Read the current question and answer. For each version, write a NEW question that tests the same concept but is worded differently, and a NEW answer.

**Version A (Medium)** — A well-rounded answer with enough context to understand the concept. 4-8 sentences. Includes a brief explanation and a practical example if helpful.

**Version B (Concise)** — A tightly written answer that covers all key points without fluff. Uses bullet points or numbered steps where helpful. No unnecessary words.

Return your response in this EXACT format (including the markers):
---VERSION_A_QUESTION---
(your rewritten question for medium version)
---VERSION_A_ANSWER---
(your medium answer here)
---VERSION_B_QUESTION---
(your rewritten question for concise version)
---VERSION_B_ANSWER---
(your concise answer here)
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
      temperature: isRewrite || isFramework || isQuestionRewrite ? 0.7 : 0.6,
      max_completion_tokens: isRewrite || isFramework ? 3072 : (isQuestionRewrite ? 2048 : 2048),
      top_p: 0.95,
      stream: false
    });

    let rawReply = chatCompletion.choices[0]?.message?.content || 'No response generated.';
    rawReply = stripThinking(rawReply);
    
    // Fix markdown parser bug where HTML blocks swallow markdown formatting
    // by ensuring blank lines exist around all details tags.
    rawReply = rawReply.replace(/<details>\s*/gi, "\n\n<details>\n");
    rawReply = rawReply.replace(/<\/summary>\s*/gi, "</summary>\n\n");
    rawReply = rawReply.replace(/\s*<\/details>\s*/gi, "\n\n</details>\n\n");

    // If question rewrite, parse V1 and V2
    if (isQuestionRewrite) {
      let v1Question = '';
      let v2Question = '';

      const matchV1 = rawReply.match(/---V1---\s*([\s\S]*?)\s*---V2---/);
      const matchV2 = rawReply.match(/---V2---\s*([\s\S]*?)\s*(?:---END---|$)/);

      if (matchV1) v1Question = matchV1[1].trim();
      if (matchV2) v2Question = matchV2[1].trim();

      // Fallback if parsing failed
      if (!v1Question && !v2Question) {
        v1Question = rawReply;
        v2Question = rawReply;
      }

      return res.json({
        success: true,
        data: {
          type: 'question_rewrite',
          reply: 'Here are two rewritten versions of your question:',
          v1Question,
          v2Question,
          originalQuestion: questionContext?.question || ''
        }
      });
    }

    // If framework, parse question + answer
    if (isFramework) {
      let newQuestion = '';
      let newAnswer = rawReply;

      const fwQuestionMatch = rawReply.match(/---QUESTION---\s*([\s\S]*?)\s*---ANSWER---/);
      const fwAnswerMatch = rawReply.match(/---ANSWER---\s*([\s\S]*?)\s*(?:---END---|$)/);

      if (fwQuestionMatch) newQuestion = fwQuestionMatch[1].trim();
      if (fwAnswerMatch) newAnswer = fwAnswerMatch[1].trim();

      return res.json({
        success: true,
        data: {
          type: 'framework',
          reply: newAnswer,
          newQuestion,
          original: questionContext?.answer || ''
        }
      });
    }

    // If rewrite, parse structured versions (question + answer for each)
    if (isRewrite) {
      let versionAQuestion = '';
      let versionAAnswer = '';
      let versionBQuestion = '';
      let versionBAnswer = '';

      const matchAQ = rawReply.match(/---VERSION_A_QUESTION---\s*([\s\S]*?)\s*---VERSION_A_ANSWER---/);
      const matchAA = rawReply.match(/---VERSION_A_ANSWER---\s*([\s\S]*?)\s*---VERSION_B_QUESTION---/);
      const matchBQ = rawReply.match(/---VERSION_B_QUESTION---\s*([\s\S]*?)\s*---VERSION_B_ANSWER---/);
      const matchBA = rawReply.match(/---VERSION_B_ANSWER---\s*([\s\S]*?)\s*(?:---END---|$)/);

      if (matchAQ) versionAQuestion = matchAQ[1].trim();
      if (matchAA) versionAAnswer = matchAA[1].trim();
      if (matchBQ) versionBQuestion = matchBQ[1].trim();
      if (matchBA) versionBAnswer = matchBA[1].trim();

      // Fallback if parsing failed
      if (!versionAAnswer && !versionBAnswer) {
        versionAAnswer = rawReply;
        versionBAnswer = questionContext?.answer || rawReply;
      }

      return res.json({
        success: true,
        data: {
          type: 'rewrite',
          reply: 'Here are two rewritten versions:',
          versionAQuestion,
          versionAAnswer,
          versionBQuestion,
          versionBAnswer,
          original: questionContext?.answer || '',
          originalQuestion: questionContext?.question || ''
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
    
    // Fix markdown parser HTML bug
    explanation = explanation.replace(/<details>\s*/gi, "\n\n<details>\n");
    explanation = explanation.replace(/<\/summary>\s*/gi, "</summary>\n\n");
    explanation = explanation.replace(/\s*<\/details>\s*/gi, "\n\n</details>\n\n");

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
    const { newAnswer, newQuestion } = req.body;

    if (!newAnswer && !newQuestion) {
      return res.status(400).json({ success: false, message: 'Either newAnswer or newQuestion is required' });
    }

    const updateFields = {};
    if (newAnswer) updateFields.answer = newAnswer;
    if (newQuestion) updateFields.question = newQuestion;

    const question = await Question.findOneAndUpdate(
      { _id: questionId, userId: req.userId },
      updateFields,
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({
      success: true,
      message: 'Question updated successfully',
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
