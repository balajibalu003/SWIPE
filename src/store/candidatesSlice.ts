import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { CandidateResult } from '../types'

export interface CandidatesState {
	list: CandidateResult[]
}

const initialState: CandidatesState = {
	list: []
}

const candidatesSlice = createSlice({
	name: 'candidates',
	initialState,
	reducers: {
		upsertCandidate(state, action: PayloadAction<CandidateResult>) {
			const idx = state.list.findIndex(c => c.id === action.payload.id)
			if (idx >= 0) state.list[idx] = action.payload
			else state.list.push(action.payload)
		},
		setCandidates(state, action: PayloadAction<CandidateResult[]>) {
			state.list = action.payload
		}
	}
})

export const { upsertCandidate, setCandidates } = candidatesSlice.actions
export default candidatesSlice.reducer


