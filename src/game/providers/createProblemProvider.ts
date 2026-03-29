import { ProblemProvider } from './types';
import { LocalUploadProvider } from './LocalUploadProvider';
import { PersistedSetProvider } from './PersistedSetProvider';
import { ApiProvider } from './ApiProvider';

export function createProblemProvider(): ProblemProvider {
  const source = process.env.NEXT_PUBLIC_PROBLEM_SOURCE ?? 'local';

  if (source === 'api') {
    return new ApiProvider();
  }

  const persistedSets = process.env.NEXT_PUBLIC_FF_PERSISTED_PROBLEM_SETS === 'true';

  if (persistedSets) {
    return new PersistedSetProvider();
  }

  return new LocalUploadProvider();
}
