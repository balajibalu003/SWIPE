import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { CandidateProfile, InterviewProgress, InterviewSessionState } from '../types'

const initialState: InterviewSessionState = {
	activeCandidate: null,
	progress: null,
	pausedAt: null
}

const sessionSlice = createSlice({
	name: 'session',
	initialState,
	reducers: {
		setActiveCandidate(state, action: PayloadAction<CandidateProfile | null>) {
			state.activeCandidate = action.payload
		},
		startInterview(state, action: PayloadAction<InterviewProgress>) {
			state.progress = action.payload
			state.pausedAt = null
		},
		updateProgress(state, action: PayloadAction<InterviewProgress | null>) {
			state.progress = action.payload
		},
		pauseInterview(state) {
			state.pausedAt = Date.now()
		},
		resumeInterview(state) {
			state.pausedAt = null
		}
		,
		resetSession(state) {
			state.activeCandidate = null
			state.progress = null
			state.pausedAt = null
		}
	}
})

export const { setActiveCandidate, startInterview, updateProgress, pauseInterview, resumeInterview, resetSession } = sessionSlice.actions
export default sessionSlice.reducer


