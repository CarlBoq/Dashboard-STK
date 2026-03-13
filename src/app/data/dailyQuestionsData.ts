export type DailyQuestionStatus = "active" | "inactive";

export interface DailyQuestionItem {
  id: string;
  question: string;
  category: string;
  status: DailyQuestionStatus;
  answerType: "multiple-choice" | "true-false" | "short-answer" | "long-answer";
  choices?: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  hasCorrectAnswer: boolean;
  correctAnswer?: string | null;
}

export interface DailyQuestionCategory {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface DailyQuestionRules {
  questionsPerDay: number;
  categoryRestriction: string;
  categoryFilterMode: "all-active" | "selected";
  activeCategories: string[];
  poolMode: "random" | "manual" | "mixed";
  manualQuestionIds: string[];
  randomizationEnabled: boolean;
  requireCompletionBeforeTimeout: boolean;
  allowQuestionRepeat: boolean;
  isActive: boolean;
}

export interface DailyQuestionResponse {
  id: string;
  employeeName: string;
  employeeId: string;
  questionId: string;
  question: string;
  category: string;
  selectedAnswer: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  date: string;
  time: string;
  completionStatus: "Completed" | "Incomplete";
}

export interface QuestionMakerLeaderboardEntry {
  id: string;
  makerName: string;
  questionsPublished: number;
  averageCorrectRate: number;
  completionRate: number;
  totalAttempts: number;
  leaderboardScore: number;
  badge: "Quiz Wizard" | "Questionably Good" | "Chaos Coordinator" | "Answer Whisperer";
}

export const dailyQuestionCategoriesSeed: DailyQuestionCategory[] = [];

export const dailyQuestionBankSeed: DailyQuestionItem[] = [];

export const dailyQuestionRulesSeed: DailyQuestionRules = {
  questionsPerDay: 2,
  categoryRestriction: "all",
  categoryFilterMode: "all-active",
  activeCategories: [],
  poolMode: "random",
  manualQuestionIds: [],
  randomizationEnabled: true,
  requireCompletionBeforeTimeout: true,
  allowQuestionRepeat: false,
  isActive: true,
};

export const dailyQuestionResponsesSeed: DailyQuestionResponse[] = [
  {
    id: "resp-001",
    employeeName: "Sarah Johnson",
    employeeId: "EMP-1001",
    questionId: "dq-custom-001",
    question: "What should you do before operating cleaning equipment?",
    category: "Operational Safety",
    selectedAnswer: "Inspect device and wear PPE",
    isCorrect: true,
    date: "2026-03-10",
    time: "05:11 PM",
    completionStatus: "Completed",
  },
  {
    id: "resp-002",
    employeeName: "Michael Chen",
    employeeId: "EMP-1002",
    questionId: "dq-custom-002",
    question: "Report workplace hazards to your supervisor immediately.",
    category: "Workplace Safety",
    selectedAnswer: "B",
    isCorrect: true,
    date: "2026-03-10",
    time: "05:14 PM",
    completionStatus: "Completed",
  },
  {
    id: "resp-003",
    employeeName: "Emily Rodriguez",
    employeeId: "EMP-1003",
    questionId: "dq-custom-003",
    question: "How long should handwashing last before food prep?",
    category: "Food Safety",
    selectedAnswer: "A",
    isCorrect: true,
    date: "2026-03-10",
    time: "05:17 PM",
    completionStatus: "Completed",
  },
  {
    id: "resp-004",
    employeeName: "David Park",
    employeeId: "EMP-1004",
    questionId: "dq-custom-004",
    question: "Explain the first step in emergency evacuation.",
    category: "Compliance",
    selectedAnswer: "Use nearest marked exit",
    isCorrect: false,
    date: "2026-03-10",
    time: "05:20 PM",
    completionStatus: "Completed",
  },
  {
    id: "resp-005",
    employeeName: "Jessica Williams",
    employeeId: "EMP-1005",
    questionId: "dq-custom-005",
    question: "Which action aligns with attendance policy?",
    category: "Company Policies",
    selectedAnswer: "C",
    isCorrect: false,
    date: "2026-03-10",
    time: "05:22 PM",
    completionStatus: "Completed",
  },
  {
    id: "resp-006",
    employeeName: "Robert Martinez",
    employeeId: "EMP-1006",
    questionId: "dq-custom-003",
    question: "How long should handwashing last before food prep?",
    category: "Food Safety",
    selectedAnswer: "A",
    isCorrect: true,
    date: "2026-03-11",
    time: "05:09 PM",
    completionStatus: "Completed",
  },
  {
    id: "resp-007",
    employeeName: "Amanda Thompson",
    employeeId: "EMP-1007",
    questionId: "dq-custom-001",
    question: "What should you do before operating cleaning equipment?",
    category: "Operational Safety",
    selectedAnswer: "Skip checks",
    isCorrect: false,
    date: "2026-03-11",
    time: "05:13 PM",
    completionStatus: "Completed",
  },
  {
    id: "resp-008",
    employeeName: "Kevin Ramos",
    employeeId: "EMP-1008",
    questionId: "dq-custom-002",
    question: "Report workplace hazards to your supervisor immediately.",
    category: "Workplace Safety",
    selectedAnswer: "A",
    isCorrect: true,
    date: "2026-03-11",
    time: "05:16 PM",
    completionStatus: "Completed",
  },
  {
    id: "resp-009",
    employeeName: "Olivia Reyes",
    employeeId: "EMP-1010",
    questionId: "dq-custom-006",
    question: "Describe how to secure confidential documents after shift.",
    category: "Company Policies",
    selectedAnswer: "Store in locked cabinet",
    isCorrect: true,
    date: "2026-03-12",
    time: "05:08 PM",
    completionStatus: "Completed",
  },
  {
    id: "resp-010",
    employeeName: "Daniel Cruz",
    employeeId: "EMP-1011",
    questionId: "dq-custom-004",
    question: "Explain the first step in emergency evacuation.",
    category: "Compliance",
    selectedAnswer: "Wait for manager",
    isCorrect: false,
    date: "2026-03-12",
    time: "05:12 PM",
    completionStatus: "Completed",
  },
  {
    id: "resp-011",
    employeeName: "Angela Lim",
    employeeId: "EMP-1012",
    questionId: "dq-custom-005",
    question: "Which action aligns with attendance policy?",
    category: "Company Policies",
    selectedAnswer: "A",
    isCorrect: true,
    date: "2026-03-12",
    time: "05:16 PM",
    completionStatus: "Completed",
  },
  {
    id: "resp-012",
    employeeName: "Mark Santos",
    employeeId: "EMP-1013",
    questionId: "dq-custom-006",
    question: "Describe how to secure confidential documents after shift.",
    category: "Company Policies",
    selectedAnswer: "",
    isCorrect: false,
    date: "2026-03-12",
    time: "05:20 PM",
    completionStatus: "Incomplete",
  },
];

export const questionMakerLeaderboardSeed: QuestionMakerLeaderboardEntry[] = [
  {
    id: "qm-001",
    makerName: "Sarah Johnson",
    questionsPublished: 24,
    averageCorrectRate: 88,
    completionRate: 96,
    totalAttempts: 420,
    leaderboardScore: 274,
    badge: "Quiz Wizard",
  },
  {
    id: "qm-002",
    makerName: "Michael Chen",
    questionsPublished: 20,
    averageCorrectRate: 84,
    completionRate: 93,
    totalAttempts: 390,
    leaderboardScore: 256,
    badge: "Answer Whisperer",
  },
  {
    id: "qm-003",
    makerName: "Emily Rodriguez",
    questionsPublished: 18,
    averageCorrectRate: 86,
    completionRate: 91,
    totalAttempts: 340,
    leaderboardScore: 247,
    badge: "Questionably Good",
  },
  {
    id: "qm-004",
    makerName: "David Park",
    questionsPublished: 22,
    averageCorrectRate: 72,
    completionRate: 85,
    totalAttempts: 410,
    leaderboardScore: 242,
    badge: "Chaos Coordinator",
  },
  {
    id: "qm-005",
    makerName: "Jessica Williams",
    questionsPublished: 16,
    averageCorrectRate: 81,
    completionRate: 89,
    totalAttempts: 300,
    leaderboardScore: 232,
    badge: "Answer Whisperer",
  },
  {
    id: "qm-006",
    makerName: "Robert Martinez",
    questionsPublished: 14,
    averageCorrectRate: 79,
    completionRate: 87,
    totalAttempts: 260,
    leaderboardScore: 220,
    badge: "Questionably Good",
  },
];
