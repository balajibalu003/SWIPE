import { Typography, Upload, message, Form, Input, Button, Space, Card } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { extractResumeText, parseProfileFromText } from '../utils/resume'
import { useAppDispatch, useAppSelector } from '../hooks'
import { setActiveCandidate } from '../store/sessionSlice'

export default function IntervieweeChat() {
	const dispatch = useAppDispatch()
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
			message.success('Profile saved. Interview will start next step.')
		} catch {
			// validation errors are shown by antd
		}
	}

	return (
		<div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
			<Typography.Title level={3} style={{ marginTop: 0 }}>Interviewee</Typography.Title>
			<Card style={{ marginBottom: 16 }}>
				<Upload.Dragger name="file" multiple={false} accept=".pdf,.docx" beforeUpload={beforeUpload} showUploadList={false} disabled={loading}>
					<p className="ant-upload-drag-icon"><InboxOutlined /></p>
					<p className="ant-upload-text">Click or drag resume to upload</p>
					<p className="ant-upload-hint">PDF required, DOCX optional</p>
				</Upload.Dragger>
			</Card>
			<Card title="Your Details">
				<Form form={form} layout="vertical" disabled={loading} initialValues={{ name: active?.name, email: active?.email, phone: active?.phone }}>
					<Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
						<Input placeholder="Full name" allowClear />
					</Form.Item>
					<Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
						<Input placeholder="you@example.com" allowClear />
					</Form.Item>
					<Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Phone is required' }]}>
						<Input placeholder="Phone number" allowClear />
					</Form.Item>
					<Space>
						<Button type="primary" onClick={onSubmit} loading={loading}>Save & Continue</Button>
					</Space>
				</Form>
			</Card>
		</div>
	)
}


