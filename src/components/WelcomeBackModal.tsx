import { Modal, Button, Space } from 'antd'
import { useAppDispatch, useAppSelector } from '../hooks'
import { resetSession, resumeInterview } from '../store/sessionSlice'

export default function WelcomeBackModal() {
	const dispatch = useAppDispatch()
	const session = useAppSelector(s => s.session.progress)
	const pausedAt = useAppSelector(s => s.session.pausedAt)
	// Only show when there's an unfinished session that was paused
	const show = !!session && !session.completedAt && !!pausedAt

	return (
		<Modal open={show} title="Welcome back" footer={null} closable={false}>
			<p>You have an unfinished interview session. Would you like to resume?</p>
			<Space>
				<Button type="primary" onClick={() => dispatch(resumeInterview())}>Resume</Button>
				<Button onClick={() => dispatch(resetSession())}>Start Over</Button>
			</Space>
		</Modal>
	)
}


