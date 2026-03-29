'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PersistedSetProvider } from '@/game/providers/PersistedSetProvider';
import { ProblemSetMeta } from '@/game/providers/types';
import { ImportedProblemsData, ImportedProblem } from '@/types/imported-problems';
import './problem-sets.css';

const provider = new PersistedSetProvider();

/* ── Detail sub-view ── */
function ProblemSetDetail({
    id,
    onBack,
}: {
    id: string;
    onBack: () => void;
}) {
    const [data, setData] = useState<ImportedProblemsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        provider
            .getProblemSet(id)
            .then(setData)
            .catch(() => setError('Failed to load problem set'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="ps-loading">
                <div className="ps-spinner" />
                <p>Loading problems…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ps-error">
                <p>{error}</p>
                <button onClick={onBack} className="ps-back-link" style={{ marginTop: '1rem' }}>
                    ← Back to list
                </button>
            </div>
        );
    }

    if (!data) return null;

    return (
        <>
            <button onClick={onBack} className="ps-back-link">
                ← All Problem Sets
            </button>
            <h1 className="ps-title">Problem Set</h1>
            <p className="ps-subtitle">Viewing all problems in this set</p>

            {/* Stats bar */}
            <div className="ps-stats">
                <div className="ps-stat">
                    <div className="ps-stat-label">Total Problems</div>
                    <div className="ps-stat-value">{data.problems.length}</div>
                </div>
                <div className="ps-stat">
                    <div className="ps-stat-label">Unique Answers</div>
                    <div className="ps-stat-value">
                        {new Set(data.problems.map((p: ImportedProblem) => p.answer)).size}
                    </div>
                </div>
            </div>

            {/* Problems table */}
            <div className="ps-table-wrap">
                <table className="ps-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Question</th>
                            <th style={{ textAlign: 'right' }}>Answer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.problems.map((problem: ImportedProblem) => (
                            <tr key={problem.id}>
                                <td className="ps-id-cell">{problem.id}</td>
                                <td className="ps-question-cell">{problem.question}</td>
                                <td className="ps-answer-cell">{problem.answer}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

/* ── Main page ── */
export default function ProblemSetsPage() {
    const [sets, setSets] = useState<ProblemSetMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        provider
            .listSets()
            .then(setSets)
            .catch(() => setError('Failed to load problem sets'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="ps-page">
            <div className="ps-container">
                {/* ── Detail view ── */}
                {selectedId ? (
                    <header className="ps-header">
                        <ProblemSetDetail id={selectedId} onBack={() => setSelectedId(null)} />
                    </header>
                ) : (
                    <>
                        {/* ── List view ── */}
                        <header className="ps-header">
                            <Link href="/" className="ps-back-link">
                                ← Back to Game
                            </Link>
                            <h1 className="ps-title">Problem Sets</h1>
                            <p className="ps-subtitle">
                                Browse and inspect your saved math problem collections
                            </p>
                        </header>

                        {loading && (
                            <div className="ps-loading">
                                <div className="ps-spinner" />
                                <p>Loading problem sets…</p>
                            </div>
                        )}

                        {error && (
                            <div className="ps-error">
                                <p>{error}</p>
                            </div>
                        )}

                        {!loading && !error && sets.length === 0 && (
                            <div className="ps-empty">
                                <p>No problem sets found yet.</p>
                                <p>Upload a problem set from the game setup screen to get started.</p>
                            </div>
                        )}

                        {!loading && !error && sets.length > 0 && (
                            <div className="ps-grid">
                                {sets.map((set) => (
                                    <button
                                        key={set.id}
                                        onClick={() => setSelectedId(set.id)}
                                        className="ps-card"
                                    >
                                        <span className="ps-card-name">{set.name}</span>
                                        <div className="ps-card-meta">
                                            <span className="ps-card-count">
                                                # {set.problemCount} problems
                                            </span>
                                            <span>
                                                {new Date(set.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
