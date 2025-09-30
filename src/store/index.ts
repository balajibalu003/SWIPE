import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import localforage from 'localforage'
import candidatesReducer from './candidatesSlice'
import sessionReducer from './sessionSlice'

const rootReducer = combineReducers({
	candidates: candidatesReducer,
	session: sessionReducer
})

const persistedReducer = persistReducer({
	key: 'swipe-interview-assistant',
	storage: localforage,
	version: 1,
	whitelist: ['candidates', 'session']
}, rootReducer)

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({ serializableCheck: false })
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch


