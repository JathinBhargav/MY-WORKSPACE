// src/utils/categoryMatcher.ts

export type CategoryType = 'Work' | 'Personal' | 'Urgent' | 'Focus' | 'Learning' | 'Admin' | 'General' | 'Engineering' | 'Academic' | 'Gaming';

const RULES: { regex: RegExp; category: CategoryType }[] = [
  { regex: /\b(prisma|supabase|fastify|api|bug|fix|repo|git|cloud|build|run|vercel|netlify|env|db|database|server|npm|tsx|vite|web|pipeline|script|python|bash)\b/i, category: 'Engineering' },
  { regex: /\b(math|class|exam|syllabus|notes|ap|ssc|study|assignment|tb|pdf|academic|learn|course|lecture|tutorial|book|read|homework)\b/i, category: 'Academic' },
  { regex: /\b(roblox|pokemon|go|cafe|simulator|ipl|match|game|stream|gaming|play|movie|xbox|ps5|party|social|dinner|lunch|meetup|rtx|graphics|i7)\b/i, category: 'Gaming' },
  { regex: /\b(urgent|asap|critical|immediate|priority|emergency|fire|attn|attention)\b/i, category: 'Urgent' },
  { regex: /\b(focus|concentrate|deep|work|sprint|pomodoro|session|block|uninterrupted)\b/i, category: 'Focus' },
  { regex: /\b(admin|settings|infra|config|bills|invoice|pay|rent|mail|status|report|meeting|synch|review|operations|ops)\b/i, category: 'Admin' },
];

/**
 * Evaluates text keywords against regex sets to instantly return a categorized tag string.
 */
export function suggestCategory(title: string): CategoryType {
  for (const rule of RULES) {
    if (rule.regex.test(title)) {
      return rule.category;
    }
  }
  return 'General';
}
