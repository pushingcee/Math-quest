import { Router, type Router as ExpressRouter } from 'express';
import { prisma } from '../lib/prisma';
import { validateProblemsData } from './validateProblems';

export const problemSetsRouter: ExpressRouter = Router();

// GET /api/problem-sets — list all sets
problemSetsRouter.get('/', async (_req, res) => {
  const sets = await prisma.problemSet.findMany({
    select: { id: true, name: true, createdAt: true, data: true },
    orderBy: { createdAt: 'desc' },
  });

  const meta = sets.map((s: (typeof sets)[number]) => ({
    id: s.id,
    name: s.name,
    problemCount: JSON.parse(s.data).problems?.length ?? 0,
    createdAt: s.createdAt,
  }));

  res.json(meta);
});

// POST /api/problem-sets — create a new set
problemSetsRouter.post('/', async (req, res) => {
  const { name, data } = req.body;

  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  try {
    validateProblemsData(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid problem data';
    res.status(400).json({ error: message });
    return;
  }

  const set = await prisma.problemSet.create({
    data: {
      name,
      data: JSON.stringify(data),
    },
  });

  res.status(201).json({
    id: set.id,
    name: set.name,
    problemCount: data.problems?.length ?? 0,
    createdAt: set.createdAt,
  });
});

// GET /api/problem-sets/:id — fetch one set
problemSetsRouter.get('/:id', async (req, res) => {
  const set = await prisma.problemSet.findUnique({
    where: { id: req.params.id },
  });

  if (!set) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  res.json(JSON.parse(set.data));
});
