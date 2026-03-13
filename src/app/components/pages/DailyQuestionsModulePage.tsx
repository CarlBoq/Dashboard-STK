import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  BarChart3,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { TablePaginationControls } from "../TablePaginationControls";
import { useTablePagination } from "../hooks/useTablePagination";
import {
  dailyQuestionBankSeed,
  dailyQuestionCategoriesSeed,
  dailyQuestionResponsesSeed,
  dailyQuestionRulesSeed,
  questionMakerLeaderboardSeed,
  type DailyQuestionCategory,
  type DailyQuestionItem,
  type DailyQuestionRules,
  type QuestionMakerLeaderboardEntry,
} from "../../data/dailyQuestionsData";

type DailyQuestionsSection =
  | "question-bank"
  | "categories"
  | "question-rules"
  | "employee-responses"
  | "reports-analytics";

interface DailyQuestionsModulePageProps {
  section: DailyQuestionsSection;
  onNavigate: (page: string) => void;
}

interface QuestionFormState {
  question: string;
  category: string;
  answerType: "multiple-choice" | "true-false" | "short-answer" | "long-answer";
  hasCorrectAnswer: boolean;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  correctAnswer: string;
  status: "active" | "inactive";
}

interface RulePreviewAnswerState {
  questionId: string;
  answer: string;
  isCorrect: boolean | null;
}

const tabs = [
  { id: "daily-questions-question-bank", label: "Question Bank", section: "question-bank" },
  { id: "daily-questions-categories", label: "Categories", section: "categories" },
  { id: "daily-questions-rules", label: "Question Rules", section: "question-rules" },
  { id: "daily-questions-responses", label: "Employee Responses", section: "employee-responses" },
  { id: "daily-questions-reports", label: "Reports & Analytics", section: "reports-analytics" },
] as const;

const emptyQuestionForm: QuestionFormState = {
  question: "",
  category: "",
  answerType: "multiple-choice",
  hasCorrectAnswer: true,
  choiceA: "",
  choiceB: "",
  choiceC: "",
  choiceD: "",
  correctAnswer: "A",
  status: "active",
};

const leaderboardBadgeClassNames: Record<QuestionMakerLeaderboardEntry["badge"], string> = {
  "Quiz Wizard": "bg-amber-100 text-amber-800 border-amber-200",
  "Questionably Good": "bg-sky-100 text-sky-800 border-sky-200",
  "Chaos Coordinator": "bg-rose-100 text-rose-800 border-rose-200",
  "Answer Whisperer": "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const leaderboardTrendStyles: Record<
  QuestionMakerLeaderboardEntry["scoreTrend"],
  { container: string; icon: typeof ArrowUpRight }
> = {
  up: {
    container: "bg-emerald-50 text-emerald-700",
    icon: ArrowUpRight,
  },
  down: {
    container: "bg-rose-50 text-rose-700",
    icon: ArrowDownRight,
  },
  steady: {
    container: "bg-amber-50 text-amber-700",
    icon: Minus,
  },
};

export function DailyQuestionsModulePage({ section, onNavigate }: DailyQuestionsModulePageProps) {
  const [questions, setQuestions] = useState<DailyQuestionItem[]>(dailyQuestionBankSeed);
  const [categories, setCategories] = useState<DailyQuestionCategory[]>(dailyQuestionCategoriesSeed);
  const [rules, setRules] = useState<DailyQuestionRules>(dailyQuestionRulesSeed);
  const [responses] = useState(dailyQuestionResponsesSeed);

  const [searchQuestion, setSearchQuestion] = useState("");
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(emptyQuestionForm);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [ruleSaveNotice, setRuleSaveNotice] = useState("");
  const [responseSearch, setResponseSearch] = useState("");
  const [responseDate, setResponseDate] = useState("");
  const [responseEmployee, setResponseEmployee] = useState("all");
  const [responseCategory, setResponseCategory] = useState("all");
  const [previewQuestion, setPreviewQuestion] = useState<DailyQuestionItem | null>(null);
  const [previewAnswer, setPreviewAnswer] = useState("");
  const [previewResult, setPreviewResult] = useState<"correct" | "incorrect" | "submitted" | null>(null);
  const [creationNotice, setCreationNotice] = useState<{
    type: "question" | "category";
    title: string;
    message: string;
  } | null>(null);
  const [isRulePreviewOpen, setIsRulePreviewOpen] = useState(false);
  const [rulePreviewQuestions, setRulePreviewQuestions] = useState<DailyQuestionItem[]>([]);
  const [rulePreviewSelections, setRulePreviewSelections] = useState<Record<string, string>>({});
  const [rulePreviewAnswers, setRulePreviewAnswers] = useState<Record<string, RulePreviewAnswerState>>({});
  const [rulePreviewNotice, setRulePreviewNotice] = useState("");
  const [rulePreviewView, setRulePreviewView] = useState<"questions" | "summary">("questions");

  const categoryOptions = useMemo(() => {
    const fromCategories = categories.map((category) => category.name);
    const missingInCategories = questions
      .map((question) => question.category)
      .filter((category) => !fromCategories.includes(category));
    const responseCategories = responses
      .map((response) => response.category)
      .filter((category) => category.trim().length > 0);
    return [...new Set([...fromCategories, ...missingInCategories, ...responseCategories])];
  }, [categories, questions, responses]);

  const questionCategoryOptions = useMemo(() => {
    return categories.map((category) => category.name);
  }, [categories]);

  const questionCountsByCategory = useMemo(() => {
    return questions.reduce<Record<string, number>>((acc, question) => {
      acc[question.category] = (acc[question.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [questions]);

  const activeCategoryNames = useMemo(() => {
    const explicitActive = categories
      .filter((category) => category.isActive !== false)
      .map((category) => category.name);
    const fallback = questionCategoryOptions;

    if (rules.categoryFilterMode === "selected") {
      const selected = rules.activeCategories.filter((name) => explicitActive.includes(name));
      return selected;
    }

    return explicitActive.length > 0 ? explicitActive : fallback;
  }, [categories, rules.activeCategories, rules.categoryFilterMode, questionCategoryOptions]);

  const eligibleQuestions = useMemo(() => {
    return questions.filter(
      (question) =>
        question.status === "active" &&
        (activeCategoryNames.length === 0 || activeCategoryNames.includes(question.category)),
    );
  }, [questions, activeCategoryNames]);

  const filteredQuestions = useMemo(() => {
    const searchLower = searchQuestion.trim().toLowerCase();
    return questions.filter((question) => {
      if (!searchLower) return true;
      return (
        question.question.toLowerCase().includes(searchLower) ||
        question.category.toLowerCase().includes(searchLower)
      );
    });
  }, [questions, searchQuestion]);

  const uniqueEmployees = useMemo(() => {
    return [...new Set(responses.map((response) => response.employeeName))].sort();
  }, [responses]);

  const filteredResponses = useMemo(() => {
    const searchLower = responseSearch.trim().toLowerCase();
    return responses.filter((response) => {
      const matchesSearch =
        !searchLower ||
        response.employeeName.toLowerCase().includes(searchLower) ||
        response.employeeId.toLowerCase().includes(searchLower) ||
        response.question.toLowerCase().includes(searchLower);
      const matchesDate = !responseDate || response.date === responseDate;
      const matchesEmployee =
        responseEmployee === "all" || response.employeeName === responseEmployee;
      const matchesCategory =
        responseCategory === "all" || response.category === responseCategory;

      return matchesSearch && matchesDate && matchesEmployee && matchesCategory;
    });
  }, [responses, responseSearch, responseDate, responseEmployee, responseCategory]);

  const reportSummary = useMemo(() => {
    const totalResponses = responses.length;
    const completedCount = responses.filter(
      (response) => response.completionStatus === "Completed",
    ).length;
    const correctCount = responses.filter((response) => response.isCorrect).length;
    const participantCount = new Set(responses.map((response) => response.employeeId)).size;
    const totalEmployees = 24;

    const completionRate = totalResponses === 0 ? 0 : (completedCount / totalResponses) * 100;
    const correctRate = completedCount === 0 ? 0 : (correctCount / completedCount) * 100;
    const participationRate = (participantCount / totalEmployees) * 100;

    return {
      totalResponses,
      completionRate,
      correctRate,
      participationRate,
      completedCount,
      correctCount,
      incorrectCount: Math.max(completedCount - correctCount, 0),
    };
  }, [responses]);

  const completionTrend = useMemo(() => {
    const byDate = new Map<string, { total: number; completed: number }>();
    responses.forEach((response) => {
      const bucket = byDate.get(response.date) ?? { total: 0, completed: 0 };
      bucket.total += 1;
      if (response.completionStatus === "Completed") {
        bucket.completed += 1;
      }
      byDate.set(response.date, bucket);
    });

    return [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, values]) => ({
        date: new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        completionRate:
          values.total === 0 ? 0 : Number(((values.completed / values.total) * 100).toFixed(1)),
      }));
  }, [responses]);

  const correctVsIncorrect = useMemo(() => {
    return [
      { name: "Correct", value: reportSummary.correctCount, color: "#10b981" },
      { name: "Incorrect", value: reportSummary.incorrectCount, color: "#ef4444" },
    ];
  }, [reportSummary.correctCount, reportSummary.incorrectCount]);

  const topWrongQuestions = useMemo(() => {
    const incorrectGroups = responses
      .filter((response) => !response.isCorrect)
      .reduce<Record<string, { question: string; category: string; wrongCount: number }>>(
        (acc, response) => {
          const existing = acc[response.questionId];
          if (existing) {
            existing.wrongCount += 1;
          } else {
            acc[response.questionId] = {
              question: response.question,
              category: response.category,
              wrongCount: 1,
            };
          }
          return acc;
        },
        {},
      );

    return Object.values(incorrectGroups)
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 5);
  }, [responses]);

  const categoryPerformance = useMemo(() => {
    const byCategory = responses.reduce<Record<string, { total: number; correct: number }>>(
      (acc, response) => {
        const bucket = acc[response.category] ?? { total: 0, correct: 0 };
        bucket.total += 1;
        if (response.isCorrect) {
          bucket.correct += 1;
        }
        acc[response.category] = bucket;
        return acc;
      },
      {},
    );

    return Object.entries(byCategory)
      .map(([category, values]) => ({
        category,
        total: values.total,
        correct: values.correct,
        accuracyRate:
          values.total === 0 ? 0 : Number(((values.correct / values.total) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.accuracyRate - a.accuracyRate);
  }, [responses]);

  const questionMakerLeaderboard = useMemo(() => {
    return [...questionMakerLeaderboardSeed].sort((a, b) => b.leaderboardScore - a.leaderboardScore);
  }, []);

  const questionPagination = useTablePagination(filteredQuestions, 5);
  const responsesPagination = useTablePagination(filteredResponses, 10);

  const openCreateQuestion = () => {
    if (questionCategoryOptions.length === 0) return;
    setEditingQuestionId(null);
    setQuestionForm({
      ...emptyQuestionForm,
      category: questionCategoryOptions[0] ?? "",
    });
    setIsQuestionDialogOpen(true);
  };

  const openEditQuestion = (question: DailyQuestionItem) => {
    const isTrueFalse = question.answerType === "true-false";
    const isAnswerTextType =
      question.answerType === "short-answer" || question.answerType === "long-answer";
    const choiceAValue = question.choices?.a ?? "";
    const choiceBValue = question.choices?.b ?? "";
    const choiceCValue = question.choices?.c ?? "";
    const choiceDValue = question.choices?.d ?? "";
    setEditingQuestionId(question.id);
    setQuestionForm({
      question: question.question,
      category: question.category,
      answerType: question.answerType,
      hasCorrectAnswer: question.hasCorrectAnswer ?? Boolean(question.correctAnswer),
      choiceA: isTrueFalse ? "True" : isAnswerTextType ? "" : choiceAValue,
      choiceB: isTrueFalse ? "False" : isAnswerTextType ? "" : choiceBValue,
      choiceC: isAnswerTextType ? "" : choiceCValue,
      choiceD: isAnswerTextType ? "" : choiceDValue,
      correctAnswer: question.correctAnswer ?? "A",
      status: question.status,
    });
    setIsQuestionDialogOpen(true);
  };

  const saveQuestion = () => {
    const isTrueFalse = questionForm.answerType === "true-false";
    const isAnswerTextType =
      questionForm.answerType === "short-answer" || questionForm.answerType === "long-answer";
    const trimmedQuestion = questionForm.question.trim();
    const trimmedCategory = questionForm.category.trim();
    if (
      !trimmedQuestion ||
      !trimmedCategory ||
      (!isAnswerTextType && !questionForm.choiceA.trim()) ||
      (!isAnswerTextType && !questionForm.choiceB.trim()) ||
      (questionForm.answerType === "multiple-choice" && !questionForm.choiceC.trim()) ||
      (questionForm.answerType === "multiple-choice" && !questionForm.choiceD.trim()) ||
      (questionForm.hasCorrectAnswer && !questionForm.correctAnswer.trim())
    ) {
      return;
    }

    const normalizedChoiceAnswer =
      isTrueFalse && (questionForm.correctAnswer === "C" || questionForm.correctAnswer === "D")
        ? "A"
        : questionForm.correctAnswer;

    const normalizedQuestion = trimmedQuestion.toLowerCase();
    const duplicateQuestionExists = questions.some(
      (question) => question.question.trim().toLowerCase() === normalizedQuestion && question.id !== editingQuestionId,
    );
    if (duplicateQuestionExists) {
      setCreationNotice({
        type: "question",
        title: "Duplicate Question",
        message: "A question with the same name already exists. Use a different question name.",
      });
      return;
    }

    const payload: DailyQuestionItem = {
      id: editingQuestionId ?? `dq-${Date.now()}`,
      question: trimmedQuestion,
      category: trimmedCategory,
      status: questionForm.status,
      answerType: questionForm.answerType,
      hasCorrectAnswer: questionForm.hasCorrectAnswer,
      choices: {
        a: isAnswerTextType ? "" : isTrueFalse ? "True" : questionForm.choiceA.trim(),
        b: isAnswerTextType ? "" : isTrueFalse ? "False" : questionForm.choiceB.trim(),
        c: questionForm.answerType === "multiple-choice" ? questionForm.choiceC.trim() : "",
        d: questionForm.answerType === "multiple-choice" ? questionForm.choiceD.trim() : "",
      },
      correctAnswer: questionForm.hasCorrectAnswer ? normalizedChoiceAnswer : null,
    };

    if (editingQuestionId) {
      setQuestions((prev) =>
        prev.map((question) => (question.id === editingQuestionId ? payload : question)),
      );
    } else {
      setQuestions((prev) => [payload, ...prev]);
      setCreationNotice({
        type: "question",
        title: "Question Created",
        message: "The new question was added to your question bank.",
      });
    }

    setIsQuestionDialogOpen(false);
    setEditingQuestionId(null);
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== questionId));
    setRules((prev) => ({
      ...prev,
      manualQuestionIds: prev.manualQuestionIds.filter((id) => id !== questionId),
    }));
  };

  const openPreviewQuestion = (question: DailyQuestionItem) => {
    setPreviewQuestion(question);
    setPreviewAnswer("");
    setPreviewResult(null);
  };

  const submitPreviewAnswer = () => {
    if (!previewQuestion) return;
    if (!previewQuestion.hasCorrectAnswer) {
      setPreviewResult("submitted");
      return;
    }

    const expected = (previewQuestion.correctAnswer ?? "").trim().toLowerCase();
    const actual = previewAnswer.trim().toLowerCase();
    setPreviewResult(expected.length > 0 && expected === actual ? "correct" : "incorrect");
  };

  const shuffleQuestions = (items: DailyQuestionItem[]) => {
    const pool = [...items];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  };

  const buildRulePreviewSet = () => {
    const targetCount = Math.max(1, rules.questionsPerDay);
    const shouldRandomizePreview = eligibleQuestions.length > targetCount || rules.randomizationEnabled;
    const manualPool = eligibleQuestions.filter((question) =>
      rules.manualQuestionIds.includes(question.id),
    );
    const randomPool = eligibleQuestions.filter(
      (question) => !rules.manualQuestionIds.includes(question.id),
    );

    let chosen: DailyQuestionItem[] = [];
    if (rules.poolMode === "manual") {
      const source = shouldRandomizePreview ? shuffleQuestions(manualPool) : manualPool;
      chosen = source.slice(0, targetCount);
    } else if (rules.poolMode === "mixed") {
      const manualSource = shouldRandomizePreview ? shuffleQuestions(manualPool) : manualPool;
      const manualFirst = manualSource.slice(0, targetCount);
      const remaining = targetCount - manualFirst.length;
      const fillPool = shouldRandomizePreview ? shuffleQuestions(randomPool) : randomPool;
      chosen = [...manualFirst, ...fillPool.slice(0, Math.max(0, remaining))];
    } else {
      const source = shouldRandomizePreview
        ? shuffleQuestions(eligibleQuestions)
        : eligibleQuestions;
      chosen = source.slice(0, targetCount);
    }

    if (chosen.length < targetCount) {
      setRulePreviewNotice(
        `Only ${chosen.length} eligible question(s) found, but rules require ${targetCount}. Add more active questions or adjust rules.`,
      );
      return;
    }

    setRulePreviewNotice("");
    setRulePreviewQuestions(chosen);
    setRulePreviewSelections({});
    setRulePreviewAnswers({});
    setRulePreviewView("questions");
    setIsRulePreviewOpen(true);
  };
  const rulePreviewSummaryRows = useMemo(() => {
    return rulePreviewQuestions.map((question) => {
      const answerState = rulePreviewAnswers[question.id];
      return {
        questionId: question.id,
        question: question.question,
        hasCorrectAnswer: question.hasCorrectAnswer,
        correctAnswer: question.correctAnswer ?? null,
        submittedAnswer: answerState?.answer ?? "",
        isCorrect: answerState?.isCorrect ?? null,
      };
    });
  }, [rulePreviewQuestions, rulePreviewAnswers]);
  const rulePreviewAnsweredCount = rulePreviewSummaryRows.filter((row) => row.submittedAnswer.trim().length > 0).length;
  const rulePreviewGradableCount = rulePreviewSummaryRows.filter((row) => row.hasCorrectAnswer).length;
  const rulePreviewCorrectCount = rulePreviewSummaryRows.filter((row) => row.isCorrect === true).length;
  const rulePreviewScorePercent =
    rulePreviewGradableCount === 0 ? 0 : (rulePreviewCorrectCount / rulePreviewGradableCount) * 100;
  const isRulePreviewComplete = rulePreviewView === "summary";
  const areAllRuleQuestionsAnswered =
    rulePreviewQuestions.length > 0 &&
    rulePreviewQuestions.every((question) => (rulePreviewSelections[question.id] ?? "").trim().length > 0);

  const submitRulePreviewAnswer = () => {
    if (!areAllRuleQuestionsAnswered) return;

    const nextAnswers: Record<string, RulePreviewAnswerState> = {};
    rulePreviewQuestions.forEach((question) => {
      const normalized = (rulePreviewSelections[question.id] ?? "").trim();
      let isCorrect: boolean | null = null;
      if (question.hasCorrectAnswer) {
        const expected = (question.correctAnswer ?? "").trim().toLowerCase();
        isCorrect = expected === normalized.toLowerCase();
      }
      nextAnswers[question.id] = {
        questionId: question.id,
        answer: normalized,
        isCorrect,
      };
    });

    setRulePreviewAnswers(nextAnswers);
    setRulePreviewView("summary");
  };

  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryName("");
    setIsCategoryDialogOpen(true);
  };

  const openEditCategory = (category: DailyQuestionCategory) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setIsCategoryDialogOpen(true);
  };

  const saveCategory = () => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;

    const normalized = trimmed.toLowerCase();
    const nameExists = categories.some(
      (category) => category.name.toLowerCase() === normalized && category.id !== editingCategoryId,
    );
    if (nameExists) {
      setCreationNotice({
        type: "category",
        title: "Duplicate Category",
        message: "A category with the same name already exists. Use a different category name.",
      });
      return;
    }

    if (editingCategoryId) {
      const previousCategoryName =
        categories.find((category) => category.id === editingCategoryId)?.name ?? "";

      setCategories((prev) =>
        prev.map((category) =>
          category.id === editingCategoryId ? { ...category, name: trimmed } : category,
        ),
      );

      if (previousCategoryName && previousCategoryName !== trimmed) {
        setQuestions((prev) =>
          prev.map((question) =>
            question.category === previousCategoryName
              ? { ...question, category: trimmed }
              : question,
          ),
        );
      }
    } else {
      setCategories((prev) => [...prev, { id: `cat-${Date.now()}`, name: trimmed, isActive: true }]);
      setCreationNotice({
        type: "category",
        title: "Category Created",
        message: "The new category is now available for question assignment.",
      });
    }

    setIsCategoryDialogOpen(false);
    setEditingCategoryId(null);
  };

  const deleteCategory = (category: DailyQuestionCategory) => {
    if ((questionCountsByCategory[category.name] ?? 0) > 0) return;
    setCategories((prev) => prev.filter((item) => item.id !== category.id));
    setRules((prev) => ({
      ...prev,
      activeCategories: prev.activeCategories.filter((name) => name !== category.name),
    }));
  };

  const renderQuestionBank = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Button type="button" onClick={openCreateQuestion} disabled={questionCategoryOptions.length === 0}>
            <Plus className="w-4 h-4" />
            Create Question
          </Button>
          <div className="w-full md:max-w-sm relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuestion}
              onChange={(event) => setSearchQuestion(event.target.value)}
              className="pl-9"
              placeholder="Search Question"
            />
          </div>
        </div>
        {questionCategoryOptions.length === 0 && (
          <p className="text-sm text-amber-700">
            Add at least one category before creating questions.
          </p>
        )}

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Question Bank</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionPagination.paginatedItems.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium text-gray-900 max-w-[540px]">
                      {question.question}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{question.category}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          question.status === "active"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                        }
                      >
                        {question.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                          onClick={() => openPreviewQuestion(question)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-[#1F4FD8] hover:text-[#1F4FD8] hover:bg-blue-50"
                          onClick={() => openEditQuestion(question)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePaginationControls
              currentPage={questionPagination.currentPage}
              totalPages={questionPagination.totalPages}
              pageSize={questionPagination.pageSize}
              totalItems={questionPagination.totalItems}
              onPrevious={questionPagination.goToPreviousPage}
              onNext={questionPagination.goToNextPage}
              onPageChange={questionPagination.goToPage}
              onPageSizeChange={questionPagination.setPageSize}
              pageSizeOptions={[5, 10, 15, 25]}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderCategories = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Question Categories</h3>
          <Button type="button" onClick={openCreateCategory}>
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Active Question Count</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const categoryCount = questionCountsByCategory[category.name] ?? 0;
                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium text-gray-900">{category.name}</TableCell>
                      <TableCell>
                        <Switch
                          checked={category.isActive !== false}
                          onCheckedChange={(checked) =>
                            setCategories((prev) =>
                              prev.map((item) =>
                                item.id === category.id ? { ...item, isActive: checked } : item,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{categoryCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-[#1F4FD8] hover:text-[#1F4FD8] hover:bg-blue-50"
                            onClick={() => openEditCategory(category)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={categoryCount > 0}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:text-gray-400 disabled:hover:bg-transparent"
                            onClick={() => deleteCategory(category)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Categories with linked questions cannot be deleted until their questions are moved or
          removed.
        </p>
      </div>
    );
  };

  const renderRules = () => {
    const activeCategoryCandidates = questionCategoryOptions.filter((name) => {
      const fromCategory = categories.find((category) => category.name === name);
      if (!fromCategory) return true;
      return fromCategory.isActive !== false;
    });
    const manualSelectedSet = new Set(rules.manualQuestionIds);
    const eligibleCount = eligibleQuestions.length;
    const isPoolValid = eligibleCount >= rules.questionsPerDay;

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Questions per day</label>
              <Select
                value={String(rules.questionsPerDay)}
                onValueChange={(value) =>
                  setRules((prev) => ({ ...prev, questionsPerDay: Number(value) }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select questions per day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
                </Select>
              </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Question pool mode</label>
              <Select
                value={rules.poolMode}
                onValueChange={(value) =>
                  setRules((prev) => ({
                    ...prev,
                    poolMode: value as DailyQuestionRules["poolMode"],
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random from active categories</SelectItem>
                  <SelectItem value="manual">Manually selected questions</SelectItem>
                  <SelectItem value="mixed">Mixed (manual first, random fill)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="w-full md:max-w-sm">
              <label className="text-sm text-gray-600">Category filter mode</label>
              <Select
                value={rules.categoryFilterMode}
                onValueChange={(value) =>
                  setRules((prev) => ({
                    ...prev,
                    categoryFilterMode: value as DailyQuestionRules["categoryFilterMode"],
                    activeCategories:
                      value === "all-active"
                        ? []
                        : prev.activeCategories.filter((name) =>
                            activeCategoryCandidates.includes(name),
                          ),
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-active">All active categories</SelectItem>
                  <SelectItem value="selected">Selected categories only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm font-medium text-gray-900">Active Categories</p>
            <p className="text-xs text-gray-500 mt-1">
              Only active categories are eligible for daily question selection.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeCategoryCandidates.length === 0 ? (
                <p className="text-xs text-amber-700">
                  No active categories available. Enable categories in the Categories tab.
                </p>
              ) : (
                activeCategoryCandidates.map((category) => {
                  const selected = rules.activeCategories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      disabled={rules.categoryFilterMode === "all-active"}
                      className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                        rules.categoryFilterMode === "all-active"
                          ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                          : selected
                          ? "border-[#1F4FD8] bg-blue-50 text-[#1F4FD8]"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        setRules((prev) => ({
                          ...prev,
                          activeCategories: selected
                            ? prev.activeCategories.filter((item) => item !== category)
                            : [...prev.activeCategories, category],
                        }))
                      }
                    >
                      {category}
                    </button>
                  );
                })
              )}
            </div>
            {rules.categoryFilterMode === "selected" && (
              <p className="text-xs text-gray-500">
                Included categories: {rules.activeCategories.length}
              </p>
            )}
          </div>

          {(rules.poolMode === "manual" || rules.poolMode === "mixed") && (
            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Manual Question Picker</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Select specific questions included by the rule.
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  Selected: {rules.manualQuestionIds.length}
                </Badge>
              </div>
              <div className="max-h-56 overflow-auto rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Include</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleQuestions.map((question) => (
                      <TableRow key={`rule-pick-${question.id}`}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={manualSelectedSet.has(question.id)}
                            onChange={(event) =>
                              setRules((prev) => ({
                                ...prev,
                                manualQuestionIds: event.target.checked
                                  ? [...prev.manualQuestionIds, question.id]
                                  : prev.manualQuestionIds.filter((id) => id !== question.id),
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell className="text-sm text-gray-800">{question.question}</TableCell>
                        <TableCell className="text-sm text-gray-600">{question.category}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-900">Selection Validation</p>
            <p className="text-xs text-gray-500 mt-1">
              Eligible active questions: {eligibleCount}. Required per day: {rules.questionsPerDay}.
            </p>
            {!isPoolValid && (
              <p className="text-xs text-red-700 mt-2">
                Not enough eligible questions for the current rule configuration.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Randomization enabled</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Questions are randomly selected from the active question bank.
                  </p>
                </div>
                <Switch
                  checked={rules.randomizationEnabled}
                  onCheckedChange={(checked) =>
                    setRules((prev) => ({ ...prev, randomizationEnabled: checked }))
                  }
                />
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Require completion before timeout</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Employees must answer the daily questions before completing timeout.
                  </p>
                </div>
                <Switch
                  checked={rules.requireCompletionBeforeTimeout}
                  onCheckedChange={(checked) =>
                    setRules((prev) => ({ ...prev, requireCompletionBeforeTimeout: checked }))
                  }
                />
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Activation status</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Enable this module in the employee timeout flow.
                  </p>
                </div>
                <Switch
                  checked={rules.isActive}
                  onCheckedChange={(checked) =>
                    setRules((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => {
                const now = new Date();
                setRuleSaveNotice(
                  `Settings saved on ${now.toLocaleDateString("en-US")} at ${now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`,
                );
              }}
            >
              <Save className="w-4 h-4" />
              Save settings
            </Button>
            <Button type="button" variant="outline" onClick={buildRulePreviewSet}>
              Preview Today's Questions
            </Button>
            {ruleSaveNotice && <p className="text-sm text-green-700">{ruleSaveNotice}</p>}
          </div>
          {rulePreviewNotice && <p className="text-sm text-amber-700">{rulePreviewNotice}</p>}
        </div>
      </div>
    );
  };

  const renderResponses = () => {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                className="pl-9"
                value={responseSearch}
                onChange={(event) => setResponseSearch(event.target.value)}
                placeholder="Search employee, ID, question"
              />
            </div>
            <Input
              type="date"
              value={responseDate}
              onChange={(event) => setResponseDate(event.target.value)}
            />
            <Select value={responseEmployee} onValueChange={setResponseEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {uniqueEmployees.map((employee) => (
                  <SelectItem key={employee} value={employee}>
                    {employee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={responseCategory} onValueChange={setResponseCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {questionCategoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Selected Answer</TableHead>
                  <TableHead>Correct / Incorrect</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Completion Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responsesPagination.paginatedItems.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell className="font-medium text-gray-900">{response.employeeName}</TableCell>
                    <TableCell className="text-sm text-gray-700">{response.employeeId}</TableCell>
                    <TableCell className="text-sm text-gray-700 max-w-[360px]">{response.question}</TableCell>
                    <TableCell className="text-sm text-gray-700">{response.selectedAnswer}</TableCell>
                    <TableCell>
                      {response.isCorrect ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Correct
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Incorrect
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{response.date}</TableCell>
                    <TableCell className="text-sm text-gray-700">{response.time}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          response.completionStatus === "Completed"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                        }
                      >
                        {response.completionStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePaginationControls
              currentPage={responsesPagination.currentPage}
              totalPages={responsesPagination.totalPages}
              pageSize={responsesPagination.pageSize}
              totalItems={responsesPagination.totalItems}
              onPrevious={responsesPagination.goToPreviousPage}
              onNext={responsesPagination.goToNextPage}
              onPageChange={responsesPagination.goToPage}
              onPageSizeChange={responsesPagination.setPageSize}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderReports = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
            <p className="text-sm text-gray-500">Completion Rate</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {reportSummary.completionRate.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
            <p className="text-sm text-gray-500">Correct Answer Rate</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {reportSummary.correctRate.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
            <p className="text-sm text-gray-500">Participation Rate</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {reportSummary.participationRate.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Responses</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {reportSummary.totalResponses}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={completionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="completionRate"
                  stroke="#1F4FD8"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  name="Completion %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Correct vs Incorrect Answers</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={correctVsIncorrect}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {correctVsIncorrect.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5 xl:col-span-2">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Question Maker Leaderboard</h3>
                <p className="text-sm text-gray-500">
                  Ranked by published volume, answer quality, completion rate, and total attempts.
                </p>
              </div>
              <div className="rounded-lg bg-[#1F4FD8]/10 px-3 py-2 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-[#1F4FD8]">Score Formula</p>
                <p className="text-sm font-medium text-[#163aa3]">
                  Published x 2 + Correct % + Completion % + Attempts / 10
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[72px]">Rank</TableHead>
                    <TableHead>Maker</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Avg. Correct</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Badge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questionMakerLeaderboard.map((entry, index) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-semibold text-gray-900">#{index + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{entry.makerName}</TableCell>
                      <TableCell className="text-gray-700">{entry.questionsPublished}</TableCell>
                      <TableCell className="text-gray-700">{entry.averageCorrectRate}%</TableCell>
                      <TableCell className="text-gray-700">{entry.completionRate}%</TableCell>
                      <TableCell className="text-gray-700">{entry.totalAttempts}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#1F4FD8]">{entry.leaderboardScore}</span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                              leaderboardTrendStyles[entry.scoreTrend].container
                            }`}
                          >
                            {(() => {
                              const TrendIcon = leaderboardTrendStyles[entry.scoreTrend].icon;
                              return <TrendIcon className="h-3.5 w-3.5" />;
                            })()}
                            {entry.scoreTrendLabel}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={leaderboardBadgeClassNames[entry.badge]}
                        >
                          {entry.badge}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Wrong Questions</h3>
            {topWrongQuestions.length === 0 ? (
              <p className="text-sm text-gray-500">No wrong answers found in the current sample.</p>
            ) : (
              <div className="space-y-3">
                {topWrongQuestions.map((item) => (
                  <div key={item.question} className="rounded-lg border border-gray-200 p-3">
                    <p className="font-medium text-gray-900">{item.question}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.category} - Wrong {item.wrongCount} time(s)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            <div className="space-y-3">
              {categoryPerformance.map((row) => (
                <div key={row.category} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{row.category}</p>
                    <p className="text-sm text-gray-600">{row.accuracyRate}%</p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-[#1F4FD8]"
                      style={{ width: `${Math.max(0, Math.min(100, row.accuracyRate))}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {row.correct} correct out of {row.total} response(s)
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const activeSection = tabs.find((tab) => tab.section === section)?.section ?? "question-bank";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-gray-900">Daily Questions Management</h2>
        <p className="mt-3 text-gray-600 max-w-5xl">
          Manage and create questions used in the Randomized Daily Question Module. These
          questions appear during employee timeout to reinforce safety, compliance, and company
          policies.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant={activeSection === tab.section ? "default" : "outline"}
                className={`justify-start ${
                  activeSection === tab.section
                    ? "bg-[#1F4FD8] hover:bg-[#1F4FD8]/90"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => onNavigate(tab.id)}
              >
                {tab.section === "reports-analytics" && <BarChart3 className="w-4 h-4" />}
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="p-4 md:p-6">
          {activeSection === "question-bank" && renderQuestionBank()}
          {activeSection === "categories" && renderCategories()}
          {activeSection === "question-rules" && renderRules()}
          {activeSection === "employee-responses" && renderResponses()}
          {activeSection === "reports-analytics" && renderReports()}
        </div>
      </div>

      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="w-[96vw] max-w-[780px] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <DialogTitle>{editingQuestionId ? "Edit Question" : "Create Question"}</DialogTitle>
            <DialogDescription>
              Configure question text, category, answer choices, and the correct answer.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Question text</label>
              <Input
                className="mt-1"
                value={questionForm.question}
                onChange={(event) =>
                  setQuestionForm((prev) => ({ ...prev, question: event.target.value }))
                }
                placeholder="Enter daily question text"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Category</label>
              <Select
                value={questionForm.category}
                onValueChange={(value) =>
                  setQuestionForm((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionCategoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Answer type</label>
              <Select
                value={questionForm.answerType}
                onValueChange={(value) =>
                  setQuestionForm((prev) => {
                    const nextType = value as QuestionFormState["answerType"];
                    if (nextType === "true-false") {
                      return {
                        ...prev,
                        answerType: nextType,
                        choiceA: "True",
                        choiceB: "False",
                        choiceC: "",
                        choiceD: "",
                        correctAnswer:
                          prev.correctAnswer === "C" || prev.correctAnswer === "D"
                            ? "A"
                            : prev.correctAnswer,
                      };
                    }
                    if (nextType === "short-answer" || nextType === "long-answer") {
                      return {
                        ...prev,
                        answerType: nextType,
                        choiceA: "",
                        choiceB: "",
                        choiceC: "",
                        choiceD: "",
                        correctAnswer:
                          prev.correctAnswer.length > 1
                            ? prev.correctAnswer
                            : "",
                      };
                    }
                    return {
                      ...prev,
                      answerType: nextType,
                      hasCorrectAnswer: prev.hasCorrectAnswer,
                      choiceC: prev.choiceC || "",
                      choiceD: prev.choiceD || "",
                      correctAnswer:
                        prev.correctAnswer.length > 1
                          ? "A"
                          : prev.correctAnswer || "A",
                    };
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                  <SelectItem value="true-false">True / False</SelectItem>
                  <SelectItem value="short-answer">Short Answer</SelectItem>
                  <SelectItem value="long-answer">Long Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(questionForm.answerType === "multiple-choice" ||
              questionForm.answerType === "true-false") && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Choice A</label>
                  <Input
                    className="mt-1"
                    value={questionForm.choiceA}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({ ...prev, choiceA: event.target.value }))
                    }
                    readOnly={questionForm.answerType === "true-false"}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Choice B</label>
                  <Input
                    className="mt-1"
                    value={questionForm.choiceB}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({ ...prev, choiceB: event.target.value }))
                    }
                    readOnly={questionForm.answerType === "true-false"}
                  />
                </div>
              </>
            )}
            {questionForm.answerType === "multiple-choice" && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Choice C</label>
                  <Input
                    className="mt-1"
                    value={questionForm.choiceC}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({ ...prev, choiceC: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Choice D</label>
                  <Input
                    className="mt-1"
                    value={questionForm.choiceD}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({ ...prev, choiceD: event.target.value }))
                    }
                  />
                </div>
              </>
            )}
            <div className="flex items-end">
              <div className="flex items-center justify-between w-full rounded-lg border border-gray-200 px-3 py-2">
                <div>
                  <p className="text-sm text-gray-800">Has correct answer</p>
                  <p className="text-xs text-gray-500">
                    {questionForm.hasCorrectAnswer ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <Switch
                  checked={questionForm.hasCorrectAnswer}
                  onCheckedChange={(checked) =>
                    setQuestionForm((prev) => ({ ...prev, hasCorrectAnswer: checked }))
                  }
                />
              </div>
            </div>
            {questionForm.hasCorrectAnswer &&
              (questionForm.answerType === "multiple-choice" ||
                questionForm.answerType === "true-false") && (
                <div>
                  <label className="text-sm text-gray-600">Correct answer</label>
                  <Select
                    value={questionForm.correctAnswer}
                    onValueChange={(value) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        correctAnswer: value,
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">
                        {questionForm.answerType === "true-false" ? "True" : "Choice A"}
                      </SelectItem>
                      <SelectItem value="B">
                        {questionForm.answerType === "true-false" ? "False" : "Choice B"}
                      </SelectItem>
                      {questionForm.answerType === "multiple-choice" && (
                        <SelectItem value="C">Choice C</SelectItem>
                      )}
                      {questionForm.answerType === "multiple-choice" && (
                        <SelectItem value="D">Choice D</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            {questionForm.hasCorrectAnswer &&
              (questionForm.answerType === "short-answer" ||
                questionForm.answerType === "long-answer") && (
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Expected answer</label>
                  <Input
                    className="mt-1"
                    value={questionForm.correctAnswer}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        correctAnswer: event.target.value,
                      }))
                    }
                    placeholder={
                      questionForm.answerType === "short-answer"
                        ? "Enter expected short answer"
                        : "Enter expected long answer guidance"
                    }
                  />
                </div>
              )}
            {(questionForm.answerType === "short-answer" ||
              questionForm.answerType === "long-answer") && (
              <div className="md:col-span-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
                <p className="text-xs text-gray-600">
                  This question uses free-text responses in the employee app.
                </p>
              </div>
            )}
            <div className="flex items-end">
              <div className="flex items-center justify-between w-full rounded-lg border border-gray-200 px-3 py-2">
                <div>
                  <p className="text-sm text-gray-800">Status</p>
                  <p className="text-xs text-gray-500">
                    {questionForm.status === "active" ? "Active" : "Inactive"}
                  </p>
                </div>
                <Switch
                  checked={questionForm.status === "active"}
                  onCheckedChange={(checked) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      status: checked ? "active" : "inactive",
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQuestionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveQuestion}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategoryId ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>Create or update Daily Question categories.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Category name</label>
            <Input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Enter category name"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCategoryDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveCategory}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(creationNotice)} onOpenChange={(open) => !open && setCreationNotice(null)}>
        <DialogContent className="max-w-md">
          {creationNotice && (
            <>
              <DialogHeader>
                <DialogTitle>{creationNotice.title}</DialogTitle>
                <DialogDescription>{creationNotice.message}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" onClick={() => setCreationNotice(null)}>
                  OK
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRulePreviewOpen} onOpenChange={setIsRulePreviewOpen}>
        <DialogContent className="flex max-h-[90vh] w-[96vw] max-w-[780px] flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Rule-Based Question Session Preview</DialogTitle>
            <DialogDescription>
              This preview follows your current rules ({rules.questionsPerDay} question(s) per day).
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {rulePreviewView === "questions" && rulePreviewQuestions.length > 0 ? (
            <div className="space-y-6 rounded-xl border border-[#2daee8] bg-slate-50 p-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1F4FD8]">
                  Employee Timeout Preview
                </p>
                <h3 className="text-2xl font-semibold text-gray-900">Daily Questionnaire</h3>
              </div>
              {rulePreviewQuestions.map((question, index) => (
                <div
                  key={`question-preview-list-${question.id}`}
                  className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F4FD8] text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold leading-6 text-gray-900">{question.question}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                        {question.answerType === "true-false"
                          ? "True or False"
                          : question.answerType.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                  {(question.answerType === "multiple-choice" || question.answerType === "true-false") && (
                    <div className="grid gap-3">
                      {[
                        { key: "A", label: question.choices?.a ?? "" },
                        { key: "B", label: question.choices?.b ?? "" },
                        ...(question.answerType === "multiple-choice"
                          ? [
                              { key: "C", label: question.choices?.c ?? "" },
                              { key: "D", label: question.choices?.d ?? "" },
                            ]
                          : []),
                      ].map((option) => {
                        const selected = (rulePreviewSelections[question.id] ?? "") === option.key;
                        return (
                          <button
                            key={`list-option-${question.id}-${option.key}`}
                            type="button"
                            onClick={() =>
                              setRulePreviewSelections((prev) => ({
                                ...prev,
                                [question.id]: option.key,
                              }))
                            }
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                              selected
                                ? "border-[#27aae1] bg-sky-50 ring-2 ring-[#27aae1]/20"
                                : "border-gray-200 bg-white hover:border-sky-200 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                  selected ? "bg-[#27aae1] text-white" : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {option.key}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{option.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {question.answerType === "short-answer" && (
                    <Input
                      value={rulePreviewSelections[question.id] ?? ""}
                      onChange={(event) =>
                        setRulePreviewSelections((prev) => ({
                          ...prev,
                          [question.id]: event.target.value,
                        }))
                      }
                      placeholder="Type your answer"
                      className="h-12 rounded-2xl border-gray-300 bg-white text-base"
                    />
                  )}
                  {question.answerType === "long-answer" && (
                    <Textarea
                      value={rulePreviewSelections[question.id] ?? ""}
                      onChange={(event) =>
                        setRulePreviewSelections((prev) => ({
                          ...prev,
                          [question.id]: event.target.value,
                        }))
                      }
                      placeholder="Type your answer"
                      className="min-h-24 rounded-2xl border-gray-300 bg-white text-base"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : rulePreviewView === "questions" ? (
            <p className="text-sm text-gray-500">No preview questions generated.</p>
          ) : null}

          {rulePreviewView === "summary" && (
            <div className="space-y-6 rounded-xl border border-[#2daee8] bg-slate-50 p-5">
              <h3 className="text-2xl font-semibold text-gray-900">Daily Questionnaire</h3>
              {rulePreviewSummaryRows.map((row, index) => {
                const sourceQuestion = rulePreviewQuestions.find((question) => question.id === row.questionId);
                const sourceType = sourceQuestion?.answerType ?? "short-answer";
                const sourceChoices = sourceQuestion?.choices;
                return (
                  <div
                    key={`summary-${row.questionId}`}
                    className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <p className="pt-1 text-base font-semibold leading-6 text-gray-900">{row.question}</p>
                    </div>
                    {(sourceType === "multiple-choice" || sourceType === "true-false") && (
                      <div className="grid gap-3">
                        {[
                          { key: "A", label: sourceChoices?.a ?? "" },
                          { key: "B", label: sourceChoices?.b ?? "" },
                          ...(sourceType === "multiple-choice"
                            ? [
                                { key: "C", label: sourceChoices?.c ?? "" },
                                { key: "D", label: sourceChoices?.d ?? "" },
                              ]
                            : []),
                        ].map((option) => {
                          const isCorrectOption = row.hasCorrectAnswer && option.key === row.correctAnswer;
                          const isSelected = option.key === row.submittedAnswer;
                          const isWrongSelection = isSelected && row.isCorrect === false;
                          const isNeutralSelection = isSelected && row.isCorrect !== false && !isCorrectOption;
                          return (
                            <div key={`summary-option-${row.questionId}-${option.key}`}>
                              <div
                                className={`w-full rounded-2xl border px-4 py-3 ${
                                  isCorrectOption
                                    ? "border-green-500 bg-green-50"
                                    : isWrongSelection
                                      ? "border-red-500 bg-red-50"
                                      : isNeutralSelection
                                        ? "border-blue-400 bg-blue-50"
                                        : "border-gray-200 bg-white"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                                    {option.key}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">{option.label}</span>
                                </div>
                              </div>
                              {isCorrectOption && <p className="mt-1 text-sm text-green-700">Correct answer</p>}
                              {isWrongSelection && <p className="mt-1 text-sm text-red-700">Your answer was wrong</p>}
                              {isSelected && row.isCorrect === true && (
                                <p className="mt-1 text-sm text-green-700">Your answer was correct</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {(sourceType === "short-answer" || sourceType === "long-answer") && (
                      <>
                        <div
                          className={`rounded-2xl border px-4 py-3 text-base ${
                            row.isCorrect === true
                              ? "border-green-500 bg-green-50"
                              : row.isCorrect === false
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 bg-white"
                          }`}
                        >
                          {row.submittedAnswer || "(No answer)"}
                        </div>
                        {row.hasCorrectAnswer && row.isCorrect === true && (
                          <p className="text-center text-sm text-green-700">Your Answer is Correct!</p>
                        )}
                        {row.hasCorrectAnswer && row.isCorrect === false && (
                          <p className="text-center text-sm text-red-700">
                            Your Answer is Wrong! Correct answer: {row.correctAnswer ?? "-"}
                          </p>
                        )}
                        {!row.hasCorrectAnswer && (
                          <p className="text-center text-sm text-blue-700">Not graded (no correct answer set)</p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h4 className="text-base font-semibold text-gray-900">Final Result Summary</h4>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
                    <p className="text-gray-500">Answered</p>
                    <p className="font-semibold text-gray-900">
                      {rulePreviewAnsweredCount} / {rulePreviewQuestions.length}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
                    <p className="text-gray-500">Correct</p>
                    <p className="font-semibold text-green-700">
                      {rulePreviewCorrectCount} / {rulePreviewGradableCount}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
                    <p className="text-gray-500">Score</p>
                    <p className="font-semibold text-gray-900">{rulePreviewScorePercent.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsRulePreviewOpen(false);
                setRulePreviewSelections({});
                setRulePreviewAnswers({});
                setRulePreviewView("questions");
              }}
            >
              Close
            </Button>
            {rulePreviewView === "summary" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRulePreviewSelections({});
                  setRulePreviewAnswers({});
                  setRulePreviewView("questions");
                }}
              >
                Review Questions Again
              </Button>
            )}
            {rulePreviewView === "questions" && !isRulePreviewComplete && (
              <Button type="button" onClick={submitRulePreviewAnswer} disabled={!areAllRuleQuestionsAnswered}>
                Submit Answers
              </Button>
            )}
            {rulePreviewView === "summary" && (
              <Button
                type="button"
                onClick={() => {
                  setIsRulePreviewOpen(false);
                  setRulePreviewSelections({});
                  setRulePreviewAnswers({});
                  setRulePreviewView("questions");
                }}
              >
                Proceed to Time Out
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewQuestion)} onOpenChange={(open) => !open && setPreviewQuestion(null)}>
        <DialogContent className="flex max-h-[90vh] w-[96vw] max-w-[720px] flex-col overflow-hidden">
          {previewQuestion && (
            <>
              <DialogHeader>
                <DialogTitle>Questionnaire Preview</DialogTitle>
                <DialogDescription>
                  Test how this question appears in the employee timeout flow.
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 mb-2">
                    {previewQuestion.category} - {previewQuestion.answerType}
                  </p>
                  <p className="text-sm font-medium text-gray-900">{previewQuestion.question}</p>
                </div>

                {(previewQuestion.answerType === "multiple-choice" ||
                  previewQuestion.answerType === "true-false") && (
                  <div className="grid gap-3">
                    {[
                      { key: "A", label: previewQuestion.choices?.a ?? "" },
                      { key: "B", label: previewQuestion.choices?.b ?? "" },
                      ...(previewQuestion.answerType === "multiple-choice"
                        ? [
                            { key: "C", label: previewQuestion.choices?.c ?? "" },
                            { key: "D", label: previewQuestion.choices?.d ?? "" },
                          ]
                        : []),
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                          previewQuestion.hasCorrectAnswer &&
                          previewResult &&
                          option.key === previewQuestion.correctAnswer
                            ? "border-green-400 bg-green-50 text-green-800"
                            : previewQuestion.hasCorrectAnswer &&
                                previewResult === "incorrect" &&
                                option.key === previewAnswer
                              ? "border-red-400 bg-red-50 text-red-800"
                              : previewAnswer === option.key
                            ? "border-[#1F4FD8] bg-blue-50 text-[#1F4FD8]"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setPreviewAnswer(option.key);
                          setPreviewResult(null);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-700">
                            {option.key}
                          </span>
                          <span className="font-medium">{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {previewQuestion.answerType === "short-answer" && (
                  <Input
                    value={previewAnswer}
                    onChange={(event) => {
                      setPreviewAnswer(event.target.value);
                      setPreviewResult(null);
                    }}
                    placeholder="Type short answer"
                    className={
                      previewResult === "correct"
                        ? "border-green-400 focus-visible:ring-green-200"
                        : previewResult === "incorrect"
                          ? "border-red-400 focus-visible:ring-red-200"
                          : undefined
                    }
                  />
                )}

                {previewQuestion.answerType === "long-answer" && (
                  <Textarea
                    value={previewAnswer}
                    onChange={(event) => {
                      setPreviewAnswer(event.target.value);
                      setPreviewResult(null);
                    }}
                    placeholder="Type long answer"
                    className={`min-h-28 ${
                      previewResult === "correct"
                        ? "border-green-400 focus-visible:ring-green-200"
                        : previewResult === "incorrect"
                          ? "border-red-400 focus-visible:ring-red-200"
                          : ""
                    }`}
                  />
                )}

                {previewResult === "correct" && (
                  <p className="text-sm text-green-700">Preview result: Correct answer.</p>
                )}
                {previewResult === "incorrect" && (
                  <p className="text-sm text-red-700">Preview result: Incorrect answer.</p>
                )}
                {previewResult === "submitted" && (
                  <p className="text-sm text-blue-700">Preview submitted (no correct answer configured).</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPreviewQuestion(null)}>
                  Close
                </Button>
                <Button type="button" onClick={submitPreviewAnswer} disabled={!previewAnswer.trim()}>
                  Submit Preview
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
