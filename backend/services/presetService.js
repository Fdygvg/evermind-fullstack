// backend/services/presetService.js
import presets from '../presets/loader.js';
import Section from '../models/Section.js';
import Question from '../models/Question.js';

class PresetService {
  static getPresetsByCategory(category) {
    return presets[category] || [];
  }
  
  static getPresetById(category, presetId) {
    const categoryPresets = this.getPresetsByCategory(category);
    return categoryPresets.find(p => p.id === presetId);
  }
  
  static getUserPresets(userPreferences) {
    const userPresets = [];
    
    // Map user tech stack to presets
    if (userPreferences.techStack && userPreferences.techStack.length > 0) {
      userPreferences.techStack.forEach(tech => {
        const techPresets = this.getPresetsByCategory('programming')
          .filter(p => p.tags.includes(tech));
        userPresets.push(...techPresets);
      });
    }
    
    // Add category-specific presets
    if (userPreferences.learningCategory) {
      const categoryPresets = this.getPresetsByCategory(userPreferences.learningCategory);
      userPresets.push(...categoryPresets);
    }
    
    return userPresets.slice(0, 5); // Limit to 5 presets
  }
  
  static async createPresetForUser(userId, presetId, category) {
    const preset = this.getPresetById(category, presetId);
    if (!preset) throw new Error('Preset not found');
    
    // Create section for user
    const section = await Section.create({
      userId,
      name: preset.name,
      description: preset.description,
      color: preset.color,
      isPreset: true,
      presetId: preset.id
    });
    
    // Create questions for the section
    const questions = preset.questions.map(q => ({
      userId,
      sectionId: section._id,
      question: q.question,
      answer: q.answer,
      tags: q.tags,
      difficulty: q.difficulty,
      isPreset: true
    }));
    
    await Question.insertMany(questions);
    
    return section;
  }
}

export default PresetService;