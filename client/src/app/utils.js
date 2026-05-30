export function answerText(options = [], answerId) {
  return options.find((option) => option.id === answerId)?.text || "Not available";
}

export function emptyQuestionDraft() {
  return {
    title: "",
    scenario: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0,
    explanation: "",
    learningObjective: "",
    recommendedBehavior: "",
    category: "",
    difficulty: ""
  };
}

export function validateQuestionDraft(question) {
  if (!question.title.trim()) return "Question title is required";
  if (!question.scenario.trim()) return "Scenario description is required";
  if (question.options.length !== 4) return "Exactly 4 answer options are required";
  if (question.options.some((option) => !option.trim())) return "All 4 answer options are required";
  if (!Number.isInteger(question.correctOptionIndex)) return "Select the correct answer";
  if (!question.explanation.trim()) return "Explanation is required";
  if (!question.learningObjective.trim()) return "Learning objective is required";
  if (!question.recommendedBehavior.trim()) return "Recommended behavior is required";
  return "";
}

export function participantStatusLabel(status) {
  if (status === "left") return "Left session";
  if (status === "connected") return "Connected";
  return "Disconnected";
}

export function participantStatusTone(status) {
  if (status === "connected") return "success";
  if (status === "left") return "warning";
  return "muted";
}

export function phaseDescription(currentRound, answerProgress, remainingSeconds) {
  if (currentRound?.state === "question") {
    return `${answerProgress.answered} of ${answerProgress.total} answered · ${remainingSeconds}s left`;
  }
  if (currentRound?.state === "locked") {
    return `Locked · evaluating ${answerProgress.answered} of ${answerProgress.total} responses`;
  }
  if (currentRound?.state === "reveal") {
    return "Reveal · correct answer and leaderboard are now visible";
  }
  return "Waiting for the next scenario to begin";
}

export function cn(...values) {
  return values.filter(Boolean).join(" ");
}
