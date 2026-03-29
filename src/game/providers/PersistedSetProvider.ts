import { ImportedProblemsData } from '@/types/imported-problems';
import { ProblemProvider, ProblemSetMeta } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class PersistedSetProvider implements ProblemProvider {
  async getProblemSet(id?: string): Promise<ImportedProblemsData> {
    if (!id) {
      throw new Error('PersistedSetProvider requires a problem set ID.');
    }

    const res = await fetch(`${API_BASE}/api/problem-sets/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch problem set: ${res.statusText}`);
    }

    return res.json();
  }

  async listSets(): Promise<ProblemSetMeta[]> {
    const res = await fetch(`${API_BASE}/api/problem-sets`);
    if (!res.ok) {
      throw new Error(`Failed to list problem sets: ${res.statusText}`);
    }

    return res.json();
  }

  async saveSet(name: string, data: ImportedProblemsData): Promise<ProblemSetMeta> {
    const res = await fetch(`${API_BASE}/api/problem-sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save problem set');
    }

    return res.json();
  }
}
