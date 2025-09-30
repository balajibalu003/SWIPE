import { Typography, Table, Input, Space, Drawer, Descriptions, Tag } from 'antd'
import { useMemo, useState } from 'react'
import { useAppSelector } from '../hooks'
import type { CandidateResult } from '../types'

export default function InterviewerDashboard() {
	const candidates = useAppSelector(s => s.candidates.list)
	const [query, setQuery] = useState('')
	const [selected, setSelected] = useState<CandidateResult | null>(null)

	const data = useMemo(() => {
		const q = query.toLowerCase()
		return [...candidates]
			.filter(c => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
			.sort((a, b) => b.score - a.score)
	}, [candidates, query])

	return (
		<div style={{ padding: 16 }}>
			<Typography.Title level={3} style={{ marginTop: 0 }}>Interviewer Dashboard</Typography.Title>
			<Space style={{ marginBottom: 12 }}>
				<Input.Search allowClear placeholder="Search by name or email" onSearch={setQuery} onChange={e => setQuery(e.target.value)} style={{ width: 320 }} />
			</Space>
			<Table
				rowKey={(r) => r.id}
				dataSource={data}
				pagination={{ pageSize: 8 }}
				onRow={(record) => ({ onClick: () => setSelected(record) })}
			>
				<Table.Column title="Name" dataIndex="name" key="name" />
				<Table.Column title="Email" dataIndex="email" key="email" />
				<Table.Column title="Phone" dataIndex="phone" key="phone" />
				<Table.Column title="Score" dataIndex="score" key="score" sorter={(a, b) => a.score - b.score} defaultSortOrder="descend" />
			</Table>
			<Drawer open={!!selected} width={640} onClose={() => setSelected(null)} title={selected ? `${selected.name} — ${selected.score}` : ''}>
				{selected && (
					<>
						<Descriptions column={1} size="small" bordered>
							<Descriptions.Item label="Email">{selected.email}</Descriptions.Item>
							<Descriptions.Item label="Phone">{selected.phone}</Descriptions.Item>
							<Descriptions.Item label="Summary">{selected.summary}</Descriptions.Item>
						</Descriptions>
						<Typography.Title level={5} style={{ marginTop: 16 }}>Questions & Answers</Typography.Title>
						{selected.qa.map(item => (
							<div key={item.question.id} style={{ marginBottom: 12 }}>
								<Typography.Text strong>{item.question.text}</Typography.Text>
								<div>
									<Tag color={item.question.difficulty === 'easy' ? 'green' : item.question.difficulty === 'medium' ? 'orange' : 'red'}>{item.question.difficulty.toUpperCase()}</Tag>
									<Tag>Score: {item.score}</Tag>
									<Tag>Time: {item.timeTakenSec}s</Tag>
								</div>
								<Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>{item.answerText || '(no answer)'}</Typography.Paragraph>
							</div>
						))}
					</>
				)}
			</Drawer>
		</div>
	)
}


