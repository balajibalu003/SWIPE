import { Tabs, Layout, theme } from 'antd'
import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom'
import IntervieweeChat from './pages/IntervieweeChat'
import InterviewerDashboard from './pages/InterviewerDashboard'
import WelcomeBackModal from './components/WelcomeBackModal'
import { useAppDispatch, useAppSelector } from './hooks'
import { pauseInterview } from './store/sessionSlice'

const { Header, Content, Footer } = Layout

function App() {
	const location = useLocation()
	const navigate = useNavigate()
	const dispatch = useAppDispatch()
	const session = useAppSelector(s => s.session.progress)
	const {
		token: { colorBgContainer }
	} = theme.useToken()

	const activeKey = useMemo(() => {
		if (location.pathname.startsWith('/interviewer')) return 'interviewer'
		return 'interviewee'
	}, [location.pathname])

	useEffect(() => {
		// Keep unknown paths redirected to interviewee
		if (location.pathname === '/') {
			navigate('/interviewee', { replace: true })
		}
	}, [location.pathname, navigate])

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (session && !session.completedAt) {
				dispatch(pauseInterview())
				e.preventDefault()
				e.returnValue = ''
			}
		}
		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => window.removeEventListener('beforeunload', handleBeforeUnload)
	}, [dispatch, session])

	return (
		<Layout style={{ minHeight: '100vh' }}>
			<Header style={{ background: colorBgContainer }}>
				<Tabs
					activeKey={activeKey}
					onChange={(key) => {
						navigate(key === 'interviewer' ? '/interviewer' : '/interviewee')
					}}
					items={[
						{ key: 'interviewee', label: 'Interviewee' },
						{ key: 'interviewer', label: 'Interviewer' }
					]}
				/>
			</Header>
			<Content>
				<WelcomeBackModal />
				<Routes>
					<Route path="/interviewee" element={<IntervieweeChat />} />
					<Route path="/interviewer" element={<InterviewerDashboard />} />
					<Route path="*" element={<Navigate to="/interviewee" replace />} />
				</Routes>
			</Content>
			<Footer style={{ textAlign: 'center' }}>Swipe Interview Assistant</Footer>
		</Layout>
	)
}

export default App
