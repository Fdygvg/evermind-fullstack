// prismConfig.js
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-html';

import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';

Prism.manual = true;

export const highlightCode = (code, language = 'javascript') => {
  if (!Prism.languages[language]) {
    language = 'text';
  }

  return Prism.highlight(
    code,
    Prism.languages[language] || Prism.languages.text,
    language
  );
};