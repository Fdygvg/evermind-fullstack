// src/pages/PreferencesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaArrowRight, FaChevronLeft, FaLaptopCode, FaLanguage, FaGlobeAmericas, FaBook, FaBullseye } from 'react-icons/fa';
import { userService } from '../services/user';
import { presetService } from '../services/preset';

const PreferencesPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [preferences, setPreferences] = useState({
    referralSource: '',
    learningCategory: '',
    techStack: [],
    currentFocus: '',
    skillLevel: '',
    studyTime: ''
  });
  const [isCreatingSections, setIsCreatingSections] = useState(false);

  // Step 1: Referral Source
  const referralSources = [
    'TikTok', 'Instagram', 'Reddit', 'YouTube',
    'ChatGPT', 'Google', 'Friend', 'Other'
  ];

  // Step 2: Learning Categories
  const learningCategories = [
    { id: 'programming', name: 'Programming', icon: <FaLaptopCode size={32} /> },
    { id: 'languages', name: 'Languages', icon: <FaLanguage size={32} /> },
    { id: 'geography', name: 'Geography', icon: <FaGlobeAmericas size={32} /> },
    { id: 'exams', name: 'Exams / School Subjects', icon: <FaBook size={32} /> },
    { id: 'custom', name: 'Custom', icon: <FaBullseye size={32} /> }
  ];

  // Step 3: Tech Stack (only shown if programming selected)
  const techStackOptions = [
    { id: 'javascript', name: 'JavaScript', color: '#F7DF1E' },
    { id: 'typescript', name: 'TypeScript', color: '#3178C6' },
    { id: 'python', name: 'Python', color: '#3776AB' },
    { id: 'react', name: 'React', color: '#61DAFB' },
    { id: 'nodejs', name: 'Node.js', color: '#339933' },
    { id: 'htmlcss', name: 'HTML/CSS', color: '#E34F26' },
    { id: 'c', name: 'C', color: '#A8B9CC' },
    { id: 'sql', name: 'SQL', color: '#4479A1' },
    { id: 'cybersecurity', name: 'Cybersecurity', color: '#FF6B6B' },
    { id: 'other', name: 'Other', color: '#94A3B8' }
  ];

  // Step 4: Skill Levels
  const skillLevels = [
    { id: 'beginner', name: 'Beginner', description: 'Just starting out' },
    { id: 'intermediate', name: 'Intermediate', description: 'Some experience' },
    { id: 'advanced', name: 'Advanced', description: 'Comfortable building projects' }
  ];

  // Step 5: Study Time Options
  const studyTimeOptions = [
    { id: '10min', name: '10 min', description: 'Quick daily review' },
    { id: '30min', name: '30 min', description: 'Solid daily session' },
    { id: '1hr', name: '1 hr', description: 'Dedicated learning time' },
    { id: '2hr', name: '2+ hr', description: 'Intensive study' },
    { id: 'depends', name: 'Depends', description: 'Varies day to day' }
  ];

  // Handle preference updates
  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle tech stack selection (multiple)
  const toggleTechStack = (techId) => {
    setPreferences(prev => {
      const newStack = prev.techStack.includes(techId)
        ? prev.techStack.filter(id => id !== techId)
        : [...prev.techStack, techId];
      return { ...prev, techStack: newStack };
    });
  };

  // Navigation
  const handleNext = () => {
    if (currentStep < 5) {
      let nextStep = currentStep + 1;
      // Skip step 3 if learning category is not programming
      if (nextStep === 3 && preferences.learningCategory !== 'programming') {
        nextStep = 4;
      }
      setCurrentStep(nextStep);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      let prevStep = currentStep - 1;
      // Skip step 3 if learning category is not programming
      if (prevStep === 3 && preferences.learningCategory !== 'programming') {
        prevStep = 2;
      }
      setCurrentStep(prevStep);
    }
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load existing preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await userService.getPreferences();
        if (response.data.success && response.data.data.preferences) {
          const savedPrefs = response.data.data.preferences;
          setPreferences({
            referralSource: savedPrefs.referralSource || '',
            learningCategory: savedPrefs.learningCategory || '',
            techStack: savedPrefs.techStack || [],
            currentFocus: savedPrefs.currentFocus || '',
            skillLevel: savedPrefs.skillLevel || '',
            studyTime: savedPrefs.studyTime || ''
          });
          // If preferences are already completed, skip to dashboard
          if (savedPrefs.completedOnboarding) {
            // User can still access this page to update preferences
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Save preferences
      const response = await userService.updatePreferences(preferences);

      if (response.data.success) {
        console.log('Preferences saved successfully');

        // Auto-import presets based on selections
        setIsCreatingSections(true);
        try {
          const presetResponse = await presetService.autoImportPresets({
            techStack: preferences.techStack,
            learningCategory: preferences.learningCategory
          });
          console.log('Preset sections created:', presetResponse.data.data.count);
        } catch (presetError) {
          console.error('Error creating preset sections:', presetError);
          // Don't block navigation if preset import fails
        }

        setIsCreatingSections(false);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError('Failed to save preferences. Please try again.');
      setLoading(false);
      setIsCreatingSections(false);
    }
  };

  // Step content
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>How did you hear about Evermind?</h2>
            <p className="step-description">Help us improve by telling us where you found us!</p>

            <div className="options-grid">
              {referralSources.map(source => (
                <button
                  key={source}
                  className={`option-btn ${preferences.referralSource === source ? 'selected' : ''}`}
                  onClick={() => updatePreference('referralSource', source)}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>Choose what you're learning</h2>
            <p className="step-description">Select your primary learning category</p>

            <div className="categories-grid">
              {learningCategories.map(category => (
                <div
                  key={category.id}
                  className={`category-card ${preferences.learningCategory === category.id ? 'selected' : ''}`}
                  onClick={() => updatePreference('learningCategory', category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        // Step 3 is only for programming category
        // Navigation logic handles skipping this step for non-programming categories
        if (preferences.learningCategory !== 'programming') {
          return null;
        }

        return (
          <div className="step-content">
            <h2>What are you currently learning?</h2>
            <p className="step-description">Select all that apply (multiple selection)</p>

            <div className="tech-stack-grid">
              {techStackOptions.map(tech => (
                <div
                  key={tech.id}
                  className={`tech-bubble ${preferences.techStack.includes(tech.id) ? 'selected' : ''}`}
                  onClick={() => toggleTechStack(tech.id)}
                  style={{ '--tech-color': tech.color }}
                >
                  <span className="tech-name">{tech.name}</span>
                </div>
              ))}
            </div>

            {preferences.techStack.length > 0 && (
              <div className="selected-preview">
                <p>Selected: {preferences.techStack.length} technologies</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2>What's your skill level?</h2>
            <p className="step-description">Help us personalize your learning experience</p>

            <div className="skill-level-grid">
              {skillLevels.map(level => (
                <div
                  key={level.id}
                  className={`skill-level-card ${preferences.skillLevel === level.id ? 'selected' : ''}`}
                  onClick={() => updatePreference('skillLevel', level.id)}
                >
                  <h3>{level.name}</h3>
                  <p>{level.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h2>How much time can you study daily?</h2>
            <p className="step-description">We'll help you plan accordingly</p>

            <div className="time-options-grid">
              {studyTimeOptions.map(option => (
                <div
                  key={option.id}
                  className={`time-option ${preferences.studyTime === option.id ? 'selected' : ''}`}
                  onClick={() => updatePreference('studyTime', option.id)}
                >
                  <h3>{option.name}</h3>
                  <p>{option.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="preferences-container">
      {/* Header */}
      <header className="preferences-header">
        <h1 className="flex items-center justify-center gap-2">
          <FaBullseye /> Customize Your Evermind Experience
        </h1>
        <p className="subtitle">A few quick questions to personalize your learning journey</p>
      </header>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
        <div className="step-indicator">
          Step {currentStep} of 5
        </div>
      </div>

      {/* Main Content */}
      <div className="preferences-card">
        {renderStep()}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="navigation-buttons">
          {currentStep > 1 && (
            <button className="nav-btn back-btn" onClick={handleBack}>
              <FaChevronLeft size={18} />
              Back
            </button>
          )}

          <button
            className="nav-btn next-btn"
            onClick={handleNext}
            disabled={
              loading ||
              (currentStep === 1 && !preferences.referralSource) ||
              (currentStep === 2 && !preferences.learningCategory) ||
              (currentStep === 4 && !preferences.skillLevel) ||
              (currentStep === 5 && !preferences.studyTime)
            }
          >
            {currentStep === 5 ? (
              <>
                {isCreatingSections ? (
                  <>
                    Setting up your workspace...
                    <FaSave size={18} />
                  </>
                ) : loading ? (
                  <>
                    Saving...
                    <FaSave size={18} />
                  </>
                ) : (
                  <>
                    Complete Setup
                    <FaSave size={18} />
                  </>
                )}
              </>
            ) : (
              <>
                Next
                <FaArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Skip for now (optional) */}
      <button
        className="skip-btn"
        onClick={() => navigate('/dashboard')}
      >
        Skip for now, I'll set this up later
      </button>
    </div>
  );
};

export default PreferencesPage;