/**
 * Enhanced code detection with better false-positive prevention
 */

// Whitelist of common phrases that contain code-like words
const FALSE_POSITIVE_PHRASES = [
  // Common English phrases
  'in this class',
  'the function of',
  'for example',
  'for instance',
  'as a result',
  'in other words',
  'on the other hand',
  'at the same time',
  'in addition to',
  'with respect to',
  'in order to',
  'as well as',
  'such as',
  'due to',
  'based on',
  'according to',
  'in case of',
  'with regard to',
  
  // Programming-adjacent phrases that are often text
  'console application',
  'function properly',
  'class discussion',
  'static electricity',
  'public speaking',
  'private sector',
  'return policy',
  'import taxes',
  'export business',
  'string theory',
  'boolean logic',
  'array of options',
  'object of desire',
  'method to madness',
  
  // Question patterns
  'what is the function',
  'what is the class',
  'what is the return',
  'explain the function',
  'describe the class',
  'discuss the method',
  'analyze the structure'
];

// Languages we support for syntax highlighting
const SUPPORTED_LANGUAGES = [
  'javascript', 'js', 'jsx',
  'typescript', 'ts', 'tsx',
  'python', 'py',
  'java',
  'cpp', 'c++',
  'c', 'c#',
  'html',
  'css',
  'php',
  'ruby', 'rb',
  'go', 'golang',
  'rust', 'rs',
  'sql',
  'json',
  'bash', 'sh',
  'yaml', 'yml',
  'markdown', 'md'
];

export function detectCode(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return false;
  }

  // Clean text for analysis
  const cleanText = text.toLowerCase().trim();
  
  // ===== STAGE 1: STRONG INDICATORS (Automatic code) =====
  
  // 1A. Backtick code blocks (```lang or ```)
  const backtickBlock = /```(\w+)?\s*[\s\S]*?```/;
  if (backtickBlock.test(text)) {
    // Extract language if specified
    const langMatch = text.match(/```(\w+)/);
    if (langMatch && SUPPORTED_LANGUAGES.includes(langMatch[1].toLowerCase())) {
      return { isCode: true, language: langMatch[1].toLowerCase() };
    }
    return { isCode: true, language: 'text' };
  }
  
  // 1B. Inline backticks with multiple occurrences (strong indicator)
  const inlineBackticks = text.match(/`[^`\n]+`/g);
  if (inlineBackticks && inlineBackticks.length >= 2) {
    return { isCode: true, language: 'text' };
  }
  
  // 1C. XML/HTML tags (definitely code)
  const htmlTags = /<\/?[a-z][\s\S]*?>/i;
  if (htmlTags.test(text)) {
    return { isCode: true, language: 'html' };
  }
  
  // 1D. JSON-like structures
  const jsonPattern = /^\s*[\{\[].*[\}\]]\s*$/s;
  if (jsonPattern.test(text.trim())) {
    try {
      JSON.parse(text);
      return { isCode: true, language: 'json' };
    } catch {
      // Not valid JSON but still looks like code
      return { isCode: true, language: 'json' };
    }
  }
  
  // ===== STAGE 2: CHECK FOR FALSE POSITIVES =====
  
  // Check if text contains false-positive phrases
  const isFalsePositive = FALSE_POSITIVE_PHRASES.some(phrase => 
    cleanText.includes(phrase.toLowerCase())
  );
  
  if (isFalsePositive) {
    // Check if it's REALLY code despite the phrase
    const hasCodeMarkers = /[{}()[\]<>;=]/.test(text);
    if (!hasCodeMarkers) {
      return { isCode: false };
    }
  }
  
  // ===== STAGE 3: SCORING SYSTEM (Improved) =====
  
  let codeScore = 0;
  const lines = text.split('\n');
  
  // 3A. Check line-by-line characteristics
  let linesWithCode = 0;
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) return;
    
    // Strong code indicators per line
    const hasSemicolon = /;\s*$/.test(trimmedLine);
    const hasAssignment = /=\s*\S/.test(trimmedLine);
    const hasBraces = /[{}]/.test(trimmedLine);
    const hasFunctionCall = /\w+\([^)]*\)/.test(trimmedLine);
    const hasImportExport = /^\s*(import|export|from|require)\b/.test(trimmedLine);
    
    if (hasSemicolon || hasAssignment || hasBraces || hasFunctionCall || hasImportExport) {
      linesWithCode++;
    }
  });
  
  // Percentage of lines that look like code
  const codeLinePercentage = linesWithCode / lines.length;
  if (codeLinePercentage > 0.3) {
    codeScore += 4;
  }
  
  // 3B. Keyword detection with context
  const keywords = [
    // JavaScript/TypeScript
    /\b(const|let|var)\s+\w+\s*[=;]/g,
    /\bfunction\s+(\w+)?\s*\(/g,
    /\b(class|interface|enum)\s+\w+/g,
    /\b(if|else|for|while|switch|case|break|continue|return)\b(?!\s+(the|a|an|this|that))/g, // Exclude common phrases
    /\b(try|catch|finally|throw)\b/g,
    /\b(new|this|super|extends|implements)\b/g,
    
    // Python
    /\b(def|class)\s+\w+\s*\(/g,
    /\b(if|elif|else|for|while|try|except|finally|with|as|import|from)\b/g,
    
    // Java/C++
    /\b(public|private|protected|static|final|void|int|string|bool|float|double)\s+\w+/g,
  ];
  
  let keywordMatches = 0;
  keywords.forEach(pattern => {
    const matches = text.match(pattern) || [];
    keywordMatches += matches.length;
  });
  
  if (keywordMatches >= 2) {
    codeScore += 3;
  }
  
  // 3C. Symbol density (more reliable than count)
  const symbols = text.match(/[{}()[\]<>;=]/g) || [];
  const words = text.match(/\b\w+\b/g) || [];
  const symbolDensity = symbols.length / (words.length || 1);
  
  if (symbolDensity > 0.1) { // More than 10% symbols
    codeScore += 3;
  } else if (symbolDensity > 0.05) { // More than 5% symbols
    codeScore += 1;
  }
  
  // 3D. Method chaining/access patterns
  const methodPattern = /\b\w+(\.\w+)+\s*(\(|\))/g;
  const methodMatches = (text.match(methodPattern) || []).length;
  if (methodMatches >= 1) {
    codeScore += 2;
  }
  
  // 3E. Comment detection
  const hasComments = /\/\/|\/\*|\*\/|#\s/.test(text);
  if (hasComments) {
    codeScore += 2;
  }
  
  // ===== STAGE 4: DETERMINATION =====
  
  // Threshold based on text length
  const textLength = text.length;
  let threshold = 5; // Default threshold
  
  if (textLength < 100) threshold = 4;  // Short text needs stronger signals
  if (textLength > 500) threshold = 6;  // Long text might have incidental matches
  
  const isCode = codeScore >= threshold;
  
  if (!isCode) {
    return { isCode: false };
  }
  
  // ===== STAGE 5: LANGUAGE DETECTION =====
  
  // Detect language for highlighting
  const languageHints = {
    javascript: /=>|\bconsole\.|\b(document|window)\.|\.js\b/i,
    typescript: /:\s*\w+\s*[=;]|interface\s+\w+|type\s+\w+/i,
    python: /def\s+\w+\s*\(|:\s*$|import\s+\w+$/im,
    java: /public\s+class|System\.out\.|@Override/i,
    html: /<\/?[a-z][^>]*>|&[a-z]+;/i,
    css: /{[^}]*}|:\s*[^;]+;|@media|#[\w-]+|\.\w+/i,
    sql: /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN)\b/i,
  };
  
  let detectedLanguage = 'text';
  let maxScore = 0;
  
  Object.entries(languageHints).forEach(([lang, pattern]) => {
    const matches = (text.match(pattern) || []).length;
    if (matches > maxScore) {
      maxScore = matches;
      detectedLanguage = lang;
    }
  });
  
  // Fallback to JavaScript if we detected code but couldn't identify language
  if (detectedLanguage === 'text' && codeScore >= threshold) {
    detectedLanguage = 'javascript';
  }
  
  return { 
    isCode: true, 
    language: detectedLanguage,
    confidence: Math.min(codeScore / 10, 1) // 0-1 confidence score
  };
}

/**
 * Smart code detection for questions
 * Returns language if code detected, false otherwise
 */
export function detectCodeInQuestion(question, answer) {
  const questionDetection = detectCode(question);
  const answerDetection = detectCode(answer);
  
  if (questionDetection.isCode) {
    return questionDetection;
  }
  
  if (answerDetection.isCode) {
    return answerDetection;
  }
  
  return { isCode: false };
}

/**
 * Extract code blocks from text for highlighting
 */
export function extractCodeBlocks(text) {
  if (!text) return [];
  
  const blocks = [];
  const codeBlockRegex = /```(\w+)?\s*\n?([\s\S]*?)```/g;
  
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1]?.toLowerCase() || 'text',
      code: match[2].trim(),
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  return blocks;
}