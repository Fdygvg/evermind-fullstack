// backend/presets/loader.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadPresets = () => {
  const presets = {};
  const categories = fs.readdirSync(__dirname);
  
  categories.forEach(category => {
    if (category.endsWith('.js')) return;
    
    const categoryPath = path.join(__dirname, category);
    if (fs.statSync(categoryPath).isDirectory()) {
      presets[category] = [];
      
      const presetFiles = fs.readdirSync(categoryPath);
      presetFiles.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(categoryPath, file);
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          presets[category].push(content);
        }
      });
    }
  });
  
  return presets;
};

export default loadPresets();