import { Modal, Button, Space } from 'antd'
import { useAppDispatch, useAppSelector } from '../hooks'
import { resetSession, resumeInterview, startInterview } from '../store/sessionSlice'

export default function WelcomeBackModal() {
	const dispatch = useAppDispatch()
	const session = useAppSelector(s => s.session.progress)
	const show = !!session && !session.completedAt

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


