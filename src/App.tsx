import { Tabs, Layout, theme } from 'antd'
import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, Outlet, Routes, Route, Navigate } from 'react-router-dom'
import IntervieweeChat from './pages/IntervieweeChat'
import InterviewerDashboard from './pages/InterviewerDashboard'

const { Header, Content, Footer } = Layout

function App() {
	const location = useLocation()
	const navigate = useNavigate()
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
