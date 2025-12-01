// Template processor for HTML export
// Import templates directly using Vite's ?raw suffix
import themeDualMode from '../assets/templates/theme-dual-mode.html?raw';
import themeMinimal from '../assets/templates/theme-minimal.html?raw';
import themeCards from '../assets/templates/theme-cards.html?raw';

// Template map - loaded at build time
const templates = {
  'dual-mode': themeDualMode,
  'minimal': themeMinimal,
  'cards': themeCards,
};

/**
 * Load template by name
 * @param {string} templateName - Name of template
 * @returns {string} Template HTML string
 */
function loadTemplateFile(templateName) {
  const template = templates[templateName];
  if (!template) {
    const validTemplates = Object.keys(templates).join(', ');
    throw new Error(`Template "${templateName}" not found. Available: ${validTemplates}`);
  }
  return template;
}

/**
 * Transform backend question format to template format
 * @param {Array} backendQuestions - Questions from backend API
 * @returns {Array} Transformed questions for template
 */
export function transformQuestions(backendQuestions) {
  return backendQuestions.map((q, index) => ({
    id: index + 1,
    question: q.question || '',
    answer: q.answer || '',
    type: q.category || 'general',
  }));
}

/**
 * Replace placeholders in template with actual data
 * @param {string} template - HTML template string
 * @param {Object} data - Data to inject
 * @returns {string} Processed HTML
 */
export function processTemplate(template, data) {
  let processed = template;

  // Replace title
  processed = processed.replace(/\{\{TITLE\}\}/g, data.title || 'Exam Revision');

  // Replace questions array
  // Look for the pattern: const questions = []; // {{QUESTIONS_ARRAY}}
  const questionsJson = JSON.stringify(data.questions, null, 2);
  // Match with flexible whitespace
  processed = processed.replace(/const questions = \[\];\s*\/\/\s*\{\{QUESTIONS_ARRAY\}\}/g, `const questions = ${questionsJson};`);

  // Replace theme config (light/dark class)
  const themeClass = data.themeMode === 'light' ? ' class="light"' : '';
  processed = processed.replace(/\{\{THEME_CONFIG\}\}/g, themeClass);

  return processed;
}

/**
 * Load template by name
 * @param {string} templateName - Name of template ('dual-mode', 'minimal', 'cards')
 * @returns {string} Template HTML string
 */
export function loadTemplate(templateName) {
  return loadTemplateFile(templateName);
}

/**
 * Generate HTML file from template and data
 * @param {string} templateName - Template to use
 * @param {Array} questions - Questions to include
 * @param {Object} options - Export options (title, themeMode, etc.)
 * @returns {string} Complete HTML string
 */
export function generateHTML(templateName, questions, options = {}) {
  // Load template
  const template = loadTemplate(templateName);

  // Transform questions
  const transformedQuestions = transformQuestions(questions);

  // Prepare data
  const data = {
    title: options.title || 'Exam Revision',
    questions: transformedQuestions,
    themeMode: options.themeMode || 'dark',
  };

  // Process template
  return processTemplate(template, data);
}

