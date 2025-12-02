/**
 * Detects if text contains code patterns
 * @param {string} text - Text to analyze
 * @returns {boolean} - True if code patterns are detected
 */
export function detectCode(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const codePatterns = {
    // Backticks (markdown code blocks)
    backticks: /```[\s\S]*?```/,
    inlineBackticks: /`[^`]+`/,
    
    // Code block indicators
    codeBlock: /```[\w]*\n[\s\S]*?```/,
    
    // Common code symbols
    symbols: /[{}()[\]<>;=]/,
    
    // Arrow functions
    arrowFunction: /=>/,
    
    // Common keywords (JavaScript, Python, Java, etc.)
    keywords: /\b(const|let|var|function|class|import|export|if|else|for|while|return|async|await|try|catch|def|print|console\.log|public|private|static|void|int|string|boolean)\b/i,
    
    // Variable declarations
    variableDeclarations: /\b(const|let|var)\s+\w+\s*=/,
    
    // Function declarations
    functionDeclarations: /\b(function|def|=>)\s*\w*\s*\(/,
    
    // Class declarations
    classDeclarations: /\bclass\s+\w+/,
    
    // Import statements
    imports: /\b(import|from|require)\s+/,
    
    // Method calls with dots
    methodCalls: /\w+\.\w+\s*\(/,
    
    // Array/object literals
    arrayObject: /\[.*\]|\{.*\}/,
  };

  // Check for backticks first (strongest indicator)
  if (codePatterns.backticks.test(text) || codePatterns.inlineBackticks.test(text)) {
    return true;
  }

  // Count code indicators
  let codeScore = 0;
  
  // Check for keywords
  if (codePatterns.keywords.test(text)) {
    codeScore += 3;
  }
  
  // Check for symbols (need multiple to be significant)
  const symbolMatches = (text.match(codePatterns.symbols) || []).length;
  if (symbolMatches >= 3) {
    codeScore += 2;
  }
  
  // Check for arrow functions
  if (codePatterns.arrowFunction.test(text)) {
    codeScore += 2;
  }
  
  // Check for variable/function/class declarations
  if (codePatterns.variableDeclarations.test(text)) {
    codeScore += 2;
  }
  if (codePatterns.functionDeclarations.test(text)) {
    codeScore += 2;
  }
  if (codePatterns.classDeclarations.test(text)) {
    codeScore += 2;
  }
  if (codePatterns.imports.test(text)) {
    codeScore += 2;
  }
  
  // Check for method calls
  if (codePatterns.methodCalls.test(text)) {
    codeScore += 1;
  }
  
  // Check for array/object literals
  if (codePatterns.arrayObject.test(text)) {
    codeScore += 1;
  }

  // If score is 3 or higher, likely contains code
  return codeScore >= 3;
}

/**
 * Detects code in both question and answer
 * @param {string} question - Question text
 * @param {string} answer - Answer text
 * @returns {boolean} - True if either contains code
 */
export function detectCodeInQuestion(question, answer) {
  return detectCode(question) || detectCode(answer);
}

