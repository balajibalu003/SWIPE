import { v4 as uuid } from 'uuid'
import type { Difficulty, Question } from '../types'

const QUESTION_BANK: Record<Difficulty, string[]> = {
	easy: [
		'What is React state and how do you update it?',
		'Explain the difference between let, const, and var.',
		'What is a REST API?'
	],
	medium: [
		'How does React reconciliation work? Explain keys.',
		'Explain async/await and the event loop in Node.js.',
		'How would you design pagination for a large list?'
	],
	hard: [
		'How would you architect SSR + CSR for a React/Node app?',
		'Explain horizontal scaling and stateless services with session storage.',
		'Design a rate limiter for an API gateway in Node.js.'
	]
}

export function generateQuestions(): Question[] {
	const difficulties: Array<{ d: Difficulty; seconds: number }> = [
		{ d: 'easy', seconds: 20 },
		{ d: 'easy', seconds: 20 },
		{ d: 'medium', seconds: 60 },
		{ d: 'medium', seconds: 60 },
		{ d: 'hard', seconds: 120 },
		{ d: 'hard', seconds: 120 }
	]
	const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
	return difficulties.map(({ d, seconds }) => ({
		id: uuid(),
		text: pick(QUESTION_BANK[d]),
		difficulty: d,
		secondsAllowed: seconds
	}))
}

export function scoreAnswer(answerText: string, difficulty: Difficulty, timeTakenSec: number, secondsAllowed: number): number {
	if (!answerText || !answerText.trim()) return 0
	const lengthScore = Math.min(answerText.trim().split(/\s+/).length / 50, 1) // up to ~50 words
	const timeFactor = Math.max(0.5, Math.min(1, 1 - (timeTakenSec - secondsAllowed) / secondsAllowed))
	const base = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
	return Math.round(base * lengthScore * timeFactor)
}

export function calculateFinalScore(perQuestionScores: number[]): number {
	return Math.max(0, Math.min(100, Math.round(perQuestionScores.reduce((a, b) => a + b, 0))))
}

export function summarizeCandidate(name: string, total: number): string {
	if (total >= 80) return `${name} shows strong full‑stack proficiency and clear communication.`
	if (total >= 60) return `${name} demonstrates solid fundamentals with room to deepen system design.`
	if (total >= 40) return `${name} has core knowledge; would benefit from more practical experience.`
	return `${name} needs improvement across React/Node basics and problem solving.`
}


