import { Typography, Upload, message, Form, Input, Button, Space, Card, Alert, Progress, Result } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { extractResumeText, parseProfileFromText } from '../utils/resume'
import { useAppDispatch, useAppSelector } from '../hooks'
import { setActiveCandidate, startInterview, updateProgress, resetSession } from '../store/sessionSlice'
import { generateQuestions, scoreAnswer, calculateFinalScore, summarizeCandidate } from '../utils/interview'
import { v4 as uuid } from 'uuid'
import { useNavigate } from 'react-router-dom'
import { upsertCandidate } from '../store/candidatesSlice'

export default function IntervieweeChat() {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const active = useAppSelector(s => s.session.activeCandidate)
	const [loading, setLoading] = useState(false)
	const [form] = Form.useForm()

	const beforeUpload = async (file: File) => {
		const name = file.name.toLowerCase()
		if (!(name.endsWith('.pdf') || name.endsWith('.docx'))) {
			message.error('Please upload a PDF or DOCX file')
			return Upload.LIST_IGNORE
		}
		setLoading(true)
		try {
			const text = await extractResumeText(file)
			const parsed = parseProfileFromText(text)
			form.setFieldsValue({
				name: parsed.name,
				email: parsed.email,
				phone: parsed.phone
			})
			message.success('Resume parsed. Please verify details.')
		} catch (e: any) {
			message.error(e?.message || 'Failed to parse resume')
		} finally {
			setLoading(false)
		}
		return Upload.LIST_IGNORE
	}

	const onSubmit = async () => {
		try {
			const values = await form.validateFields()
			dispatch(setActiveCandidate({ id: 'current', ...values }))
			const questions = generateQuestions()
			dispatch(startInterview({
				currentIndex: 0,
				startedAt: Date.now(),
				completedAt: null,
				questions,
				answers: [],
				chatHistory: [
					{ id: uuid(), role: 'assistant', text: 'Welcome! Your interview will begin now.', timestamp: Date.now() }
				],
				questionStartedAt: Date.now()
			}))
			message.success('Interview started')
		} catch {
			// validation errors are shown by antd
		}
	}

	const session = useAppSelector(s => s.session.progress)
	const [answer, setAnswer] = useState('')
	const activeQuestion = useMemo(() => session?.questions[session.currentIndex ?? 0], [session])
	const secondsLeft = useCountdown(session?.questionStartedAt ?? null, activeQuestion?.secondsAllowed ?? 0)
	const isCompleted = !!session?.completedAt

	useEffect(() => {
		if (!session || !activeQuestion) return
		if (secondsLeft <= 0) {
			submitAnswer()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [secondsLeft])

	function useCountdown(startedAt: number | null, durationSec: number) {
		const [now, setNow] = useState(Date.now())
		useEffect(() => {
			if (!startedAt || durationSec <= 0) return
			const id = setInterval(() => setNow(Date.now()), 200)
			return () => clearInterval(id)
		}, [startedAt, durationSec])
		if (!startedAt || durationSec <= 0) return 0
		const elapsed = Math.floor((now - startedAt) / 1000)
		return Math.max(0, durationSec - elapsed)
	}

	const submitAnswer = () => {
		if (!session || !activeQuestion) return
		const end = Date.now()
		const timeTaken = Math.floor(((end) - (session.questionStartedAt ?? end)) / 1000)
		// score is recalculated per question below when persisting results
		const answers = [
			...session.answers,
			{ questionId: activeQuestion.id, answerText: answer, submittedAt: end, timeTakenSec: timeTaken }
		]
		const nextIndex = session.currentIndex + 1
		if (nextIndex >= session.questions.length) {
			// finish
			dispatch(updateProgress({
				...session,
				answers,
				completedAt: end,
				chatHistory: [
					...session.chatHistory,
					{ id: uuid(), role: 'assistant', text: 'Interview completed. Thank you!', timestamp: end }
				],
				questionStartedAt: null
			}))
			// compute score and store candidate result
			const perQuestionScores = answers.map(a => {
				const q = session.questions.find(q => q.id === a.questionId)!
				return scoreAnswer(a.answerText, q.difficulty, a.timeTakenSec, q.secondsAllowed)
			})
			const total = calculateFinalScore(perQuestionScores)
			const profile = active!
			const summary = summarizeCandidate(profile.name, total)
			dispatch(upsertCandidate({
				id: profile.id,
				name: profile.name,
				email: profile.email,
				phone: profile.phone,
				score: total,
				summary,
				chatHistory: session.chatHistory,
				qa: answers.map(a => ({
					question: session.questions.find(q => q.id === a.questionId)!,
					answerText: a.answerText,
					score: scoreAnswer(a.answerText, session.questions.find(q => q.id === a.questionId)!.difficulty, a.timeTakenSec, session.questions.find(q => q.id === a.questionId)!.secondsAllowed),
					timeTakenSec: a.timeTakenSec
				}))
			}))
			message.success('Interview completed')
			setAnswer('')
			return
		}
		dispatch(updateProgress({
			...session,
			currentIndex: nextIndex,
			answers,
			chatHistory: [
				...session.chatHistory,
				{ id: uuid(), role: 'assistant', text: 'Next question...', timestamp: end }
			],
			questionStartedAt: Date.now()
		}))
		setAnswer('')
	}

	return (
		<div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
			<Typography.Title level={3} style={{ marginTop: 0 }}>Interviewee</Typography.Title>
			{!session && (
				<Card style={{ marginBottom: 16 }}>
				<Upload.Dragger name="file" multiple={false} accept=".pdf,.docx" beforeUpload={beforeUpload} showUploadList={false} disabled={loading}>
					<p className="ant-upload-drag-icon"><InboxOutlined /></p>
					<p className="ant-upload-text">Click or drag resume to upload</p>
					<p className="ant-upload-hint">PDF required, DOCX optional</p>
				</Upload.Dragger>
				</Card>
			)}
			{!session && (
				<Card title="Your Details">
					<Form form={form} layout="vertical" disabled={loading} initialValues={{ name: active?.name, email: active?.email, phone: active?.phone }}>
						<Form.Item
							label="Name"
							name="name"
							rules={[
								{ required: true, message: 'Name is required' },
								{ min: 2, message: 'Name must be at least 2 characters' },
								{ pattern: /^[A-Za-z][A-Za-z .'-]{1,58}$/, message: 'Use letters, spaces, dot, hyphen, apostrophe' }
							]}
						>
							<Input placeholder="Full name" allowClear />
						</Form.Item>
						<Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
							<Input placeholder="you@example.com" allowClear />
						</Form.Item>
						<Form.Item
							label="Phone"
							name="phone"
							getValueFromEvent={(e) => (e?.target?.value ?? '').replace(/\D/g, '').slice(0, 10)}
							rules={[
								{ required: true, message: 'Phone is required' },
								{ pattern: /^\d{10}$/, message: 'Enter a 10-digit phone number' }
							]}
						>
							<Input placeholder="10-digit phone number" allowClear inputMode="numeric" maxLength={10} />
						</Form.Item>
						<Space>
							<Button type="primary" onClick={onSubmit} loading={loading}>Save & Continue</Button>
						</Space>
					</Form>
				</Card>
			)}

			{session && activeQuestion && !isCompleted && (
				<Card title={`Question ${session.currentIndex + 1} of ${session.questions.length} — ${activeQuestion.difficulty.toUpperCase()}`}>
					<Alert type="info" showIcon message={activeQuestion.text} style={{ marginBottom: 12 }} />
					<Progress percent={Math.round((secondsLeft / activeQuestion.secondsAllowed) * 100)} showInfo format={() => `${secondsLeft}s left`} />
					<Form layout="vertical" style={{ marginTop: 12 }}>
						<Form.Item label="Your Answer">
							<Input.TextArea value={answer} onChange={e => setAnswer(e.target.value)} autoSize={{ minRows: 4 }} placeholder="Type your answer here..." />
						</Form.Item>
						<Space>
							<Button type="primary" onClick={submitAnswer}>Submit</Button>
						</Space>
					</Form>
				</Card>
			)}

			{session && isCompleted && (
				<Card>
					<Result
						status="success"
						title="Interview completed!"
						subTitle="Your responses have been recorded. View your final score and summary on the Interviewer tab."
						extra={
							<Space>
								<Button type="primary" onClick={() => navigate('/interviewer')}>View Results</Button>
								<Button onClick={() => { dispatch(resetSession()); navigate('/interviewee') }}>Start Over</Button>
							</Space>
						}
					/>
				</Card>
			)}
		</div>
	)
}


