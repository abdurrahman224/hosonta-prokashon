import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '../../../components/dashboard/DataTable'
import PageHeader from '../../../components/dashboard/PageHeader'
import StatusBadge from '../../../components/dashboard/StatusBadge'
import ConfirmModal from '../../../components/dashboard/ConfirmModal'
import { useAuth } from '../../../context/useAuth'
import { PERMISSIONS } from '../../../utils/roles'
import { getStoredMessages, saveStoredMessages } from '../../../utils/moderationStorage'

function MessageModeration() {
  const { can } = useAuth()
  const [messages, setMessages] = useState(getStoredMessages)
  const [deleting, setDeleting] = useState(null)

  const updateMessage = (message, status) => {
    if (!can(PERMISSIONS.MESSAGES_MODERATE)) return
    const next = messages.map((item) => item.id === message.id ? { ...item, status } : item)
    saveStoredMessages(next)
    setMessages(next)
    toast.success(status === 'resolved' ? 'Message marked as resolved.' : 'Message marked as spam.')
  }

  const removeMessage = () => {
    if (!deleting || !can(PERMISSIONS.MESSAGES_MODERATE)) return
    const next = messages.filter((item) => item.id !== deleting.id)
    saveStoredMessages(next)
    setMessages(next)
    setDeleting(null)
    toast.success('Message deleted.')
  }

  return (
    <>
      <PageHeader
        title="Message Moderation"
        description="Review incoming customer contact requests and moderate spam."
      />
      <DataTable
        title="Inquiries & Messages"
        subtitle="Manage and moderate incoming messages"
        data={messages}
        searchKeys={['name', 'email', 'subject', 'message']}
        searchPlaceholder="Search by name, subject or message..."
        filters={[
          {
            key: 'status',
            label: 'All Statuses',
            options: [
              { value: 'open', label: 'Open' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'spam', label: 'Spam' },
            ],
          },
        ]}
        columns={[
          {
            key: 'name',
            header: 'Sender',
            sortable: true,
            render: (item) => (
              <div>
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-400">{item.email}</p>
              </div>
            ),
          },
          { key: 'type', header: 'Type' },
          { key: 'subject', header: 'Subject', sortable: true },
          {
            key: 'message',
            header: 'Message',
            render: (item) => (
              <span className="line-clamp-1 max-w-xs text-slate-600">
                {item.message}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <StatusBadge status={item.status} />,
          },
        ]}
        rowActions={(message) => [
          { label: 'Mark Resolved', onClick: () => updateMessage(message, 'resolved') },
          { label: 'Mark Spam', onClick: () => updateMessage(message, 'spam'), danger: true },
          { label: 'Delete', onClick: () => setDeleting(message), danger: true },
        ]}
        emptyMessage="No messages found."
      />
      <ConfirmModal
        isOpen={Boolean(deleting)}
        title="Delete Message"
        message="Are you sure you want to permanently delete this message?"
        confirmLabel="Delete"
        isDanger
        onConfirm={removeMessage}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}

export default MessageModeration
