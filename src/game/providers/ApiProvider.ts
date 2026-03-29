import { ImportedProblemsData } from '@/types/imported-problems';
import { ProblemProvider, ProblemSetMeta } from './types';

export class ApiProvider implements ProblemProvider {
  async getProblemSet(): Promise<ImportedProblemsData> {
    throw new Error('ApiProvider is not yet implemented.');
  }

  async listSets(): Promise<ProblemSetMeta[]> {
    throw new Error('ApiProvider is not yet implemented.');
  }

  async saveSet(): Promise<ProblemSetMeta> {
    throw new Error('ApiProvider is not yet implemented.');
  }
}
