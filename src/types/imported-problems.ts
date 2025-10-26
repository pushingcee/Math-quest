export interface ImportedProblem {
  id: number;
  question: string;
  answer: string;
}

export interface ImportedProblemsData {
  problemCount: string;
  problems: ImportedProblem[];
}
