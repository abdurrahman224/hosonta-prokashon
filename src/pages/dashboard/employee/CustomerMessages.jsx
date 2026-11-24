import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '../../../components/dashboard/DataTable'
import PageHeader from '../../../components/dashboard/PageHeader'
import StatusBadge from '../../../components/dashboard/StatusBadge'
import { useAuth } from '../../../context/useAuth'
import { PERMISSIONS } from '../../../utils/roles'
import { getStoredMessages, saveStoredMessages } from '../../../utils/moderationStorage'

function CustomerMessages() {
  const { can } = useAuth()
  const [messages, setMessages] = useState(getStoredMessages)
  const [selected, setSelected] = useState(null)

  const saveReply = (reply) => {
    if (!can(PERMISSIONS.SUPPORT_READ)) return
    const next = messages.map((message) => message.id === selected.id ? { ...message, reply, status: 'resolved' } : message)
    saveStoredMessages(next)
    setMessages(next)
    setSelected(null)
    toast.success('Reply saved and message marked as resolved.')
  }

  const resolve = (message) => {
    const next = messages.map((item) => item.id === message.id ? { ...item, status: 'resolved' } : item)
    saveStoredMessages(next)
    setMessages(next)
    toast.success('Message marked as resolved.')
  }

  return (
    <>
      <PageHeader
        title="Customer Messages"
        description="Respond to customer inquiries and monitor support messages."
      />
      <DataTable
        title="Inquiries & Support"
        subtitle="Customer contact submissions and feedback"
        data={messages.filter((message) => message.type === 'contact')}
        searchKeys={['name', 'email', 'subject', 'message']}
        searchPlaceholder="Search customer or message..."
        columns={[
          {
            key: 'name',
            header: 'Customer',
            sortable: true,
            render: (message) => (
              <div>
                <p className="font-semibold text-slate-800">{message.name}</p>
                <p className="text-xs text-slate-400">{message.email}</p>
              </div>
            ),
          },
          { key: 'subject', header: 'Subject', sortable: true },
          {
            key: 'message',
            header: 'Message',
            render: (message) => (
              <span className="line-clamp-1 max-w-md text-slate-600">
                {message.message}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (message) => <StatusBadge status={message.status} />,
          },
          { key: 'createdAt', header: 'Date', sortable: true },
        ]}
        rowActions={(message) => [
          { label: 'Reply', onClick: () => setSelected(message) },
          ...(message.status !== 'resolved'
            ? [{ label: 'Mark Resolved', onClick: () => resolve(message) }]
            : []),
        ]}
        emptyMessage="No customer messages found."
      />
      {selected && <ReplyModal message={selected} onClose={() => setSelected(null)} onSubmit={saveReply} />}
    </>
  )
}

function ReplyModal({ message, onClose, onSubmit }) {
  const [reply, setReply] = useState(message.reply ?? '')
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-dark/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400">{message.email}</p>
            <h2 className="font-heading text-xl font-bold text-slate-900 mt-0.5">
              {message.subject}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            ×
          </button>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs md:text-sm leading-6 text-slate-700">
          {message.message}
        </div>
        <label className="mt-4 block text-xs font-semibold text-slate-700">
          Your Reply
          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            rows="4"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
          />
        </label>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => onSubmit(reply)}
            disabled={!reply.trim()}
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-dark disabled:opacity-50 hover:bg-primary-hover shadow-xs"
          >
            Save Reply
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerMessages
