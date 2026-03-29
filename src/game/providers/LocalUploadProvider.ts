import { ImportedProblemsData } from '@/types/imported-problems';
import { ProblemProvider, ProblemSetMeta } from './types';
import { validateProblemsData } from './validateProblems';

export class LocalUploadProvider implements ProblemProvider {
  private currentData: ImportedProblemsData | null = null;

  async getProblemSet(): Promise<ImportedProblemsData> {
    if (!this.currentData) {
      throw new Error('No problem set loaded. Upload a JSON file first.');
    }
    return this.currentData;
  }

  async listSets(): Promise<ProblemSetMeta[]> {
    return [];
  }

  async saveSet(): Promise<ProblemSetMeta> {
    throw new Error('LocalUploadProvider does not support persistence.');
  }

  /**
   * Load problems from a File (FileReader). Called by the upload UI.
   */
  loadFromFile(file: File): Promise<ImportedProblemsData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const validated = validateProblemsData(json);
          this.currentData = validated;
          resolve(validated);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Check if a problem set is currently loaded.
   */
  hasData(): boolean {
    return this.currentData !== null;
  }
}
