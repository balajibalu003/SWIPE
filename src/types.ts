export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Question {
	id: string
	text: string
	difficulty: Difficulty
	secondsAllowed: number
}

export interface ChatMessage {
	id: string
	role: 'system' | 'assistant' | 'user'
	text: string
	timestamp: number
}

export interface CandidateProfile {
	id: string
	name: string
	email: string
	phone: string
}

export interface CandidateResult extends CandidateProfile {
	score: number
	summary: string
	chatHistory: ChatMessage[]
	qa: Array<{
		question: Question
		answerText: string
		score: number
		timeTakenSec: number
	}>
}

export interface InterviewProgress {
	currentIndex: number
	startedAt: number | null
	completedAt: number | null
	questions: Question[]
	answers: Array<{
		questionId: string
		answerText: string
		submittedAt: number
		timeTakenSec: number
	}>
	chatHistory: ChatMessage[]
}

export interface InterviewSessionState {
	activeCandidate: CandidateProfile | null
	progress: InterviewProgress | null
	pausedAt: number | null
}


