import PresetService from '../services/presetService.js';
import User from '../models/User.js';

export const getRecommendedPresets = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('preferences');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const recommended = PresetService.getUserPresets(user.preferences);
    
    res.json({
      success: true,
      data: {
        presets: recommended,
        count: recommended.length
      }
    });
    
  } catch (error) {
    console.error('Get recommended presets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommended presets'
    });
  }
};

// Import a preset for current user
export const importPreset = async (req, res) => {
  try {
    const { presetId } = req.params;
    const { category = 'programming' } = req.body;
    
    const section = await PresetService.createPresetForUser(
      req.userId,
      presetId,
      category
    );
    
    res.json({
      success: true,
      message: 'Preset imported successfully',
      data: { section }
    });
    
  } catch (error) {
    console.error('Import preset error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error importing preset'
    });
  }
};

// Get all presets in a category (for browsing)
export const getCategoryPresets = async (req, res) => {
  try {
    const { category } = req.params;
    
    const presets = PresetService.getPresetsByCategory(category);
    
    res.json({
      success: true,
      data: {
        category,
        presets,
        count: presets.length
      }
    });
    
  } catch (error) {
    console.error('Get category presets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category presets'
    });
  }
};

// Auto-import presets based on user preferences
export const autoImportPresets = async (req, res) => {
  try {
    const { techStack, learningCategory } = req.body;
    const importedSections = [];
    
    // Import presets for each tech in stack
    if (techStack && techStack.length > 0) {
      for (const tech of techStack) {
        try {
          const section = await PresetService.createPresetForUser(
            req.userId,
            `${tech}_basics`,
            'programming'
          );
          importedSections.push(section);
        } catch (error) {
          console.log(`No preset found for ${tech}`);
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Presets imported successfully',
      data: { sections: importedSections, count: importedSections.length }
    });
  } catch (error) {
    console.error('Auto import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error auto-importing presets'
    });
  }
};