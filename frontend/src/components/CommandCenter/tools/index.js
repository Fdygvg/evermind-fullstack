// C:\Users\USER\Desktop\EVERMIND FULLSTACK\frontend\src\components\CommandCenter\tools\index.js
import TimerTool from './TimerTool';
import ShuffleTool from './ShuffleTool';
import CardStyleTool from './CardStyleTool';
import PositionTool from './PositionTool';
import AITool from './AITool';
import ThemeTool from './ThemeTool';

// Export all tools as named exports
export const timer = TimerTool;
export const shuffle = ShuffleTool;
export const cardStyle = CardStyleTool;
export const position = PositionTool;
export const ai = AITool;
export const theme = ThemeTool;

// Export metadata for tool palette
export const allTools = [
  {
    id: 'timer',
    name: TimerTool.toolName || 'Timer',
    icon: TimerTool.toolIcon || '🕒',
    description: TimerTool.toolDescription || 'Pomodoro timer for focused study sessions',
    component: TimerTool
  },
  {
    id: 'shuffle',
    name: ShuffleTool.toolName || 'Shuffle',
    icon: ShuffleTool.toolIcon || '🔀',
    description: ShuffleTool.toolDescription || 'Shuffle questions in your session',
    component: ShuffleTool
  },
  {
    id: 'cardStyle',
    name: CardStyleTool.toolName || 'Card Style',
    icon: CardStyleTool.toolIcon || '🎴',
    description: CardStyleTool.toolDescription || 'Switch between flashcard and normal card mode',
    component: CardStyleTool
  },
  {
    id: 'theme',
    name: ThemeTool.toolName || 'Theme',
    icon: ThemeTool.toolIcon || '🎨',
    description: ThemeTool.toolDescription || 'Switch between light and dark themes',
    component: ThemeTool
  },
  {
    id: 'position',
    name: PositionTool.toolName || 'Reset Positions',
    icon: PositionTool.toolIcon || '📍',
    description: PositionTool.toolDescription || 'Reset all tool positions to default',
    component: PositionTool
  },
  {
    id: 'ai',
    name: AITool.toolName || 'AI Assistant',
    icon: AITool.toolIcon || '🤖',
    description: AITool.toolDescription || 'Get AI-powered hints and explanations',
    component: AITool
  }
];

// Default export with all tools
export default {
  timer: TimerTool,
  shuffle: ShuffleTool,
  cardStyle: CardStyleTool,
  position: PositionTool,
  ai: AITool,
  theme: ThemeTool
};