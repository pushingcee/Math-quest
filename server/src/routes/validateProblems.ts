export class ProblemValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProblemValidationError';
  }
}

export function validateProblemsData(json: unknown): void {
  const data = json as Record<string, unknown>;

  if (!data.problems || !Array.isArray(data.problems)) {
    throw new ProblemValidationError('Invalid JSON format: missing problems array');
  }

  const valid = data.problems.every(
    (p: Record<string, unknown>) =>
      p.id !== undefined && p.question !== undefined && p.answer !== undefined
  );

  if (!valid) {
    throw new ProblemValidationError(
      'Invalid JSON format: problems must have id, question, and answer'
    );
  }
}
