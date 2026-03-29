import { ImportedProblemsData } from '@/types/imported-problems';

export interface ProblemSetMeta {
  id: string;
  name: string;
  problemCount: number;
  createdAt: Date;
}

export interface ProblemProvider {
  getProblemSet(id?: string): Promise<ImportedProblemsData>;
  listSets(): Promise<ProblemSetMeta[]>;
  saveSet(name: string, data: ImportedProblemsData): Promise<ProblemSetMeta>;
}
