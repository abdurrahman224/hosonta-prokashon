import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '../../../components/dashboard/DataTable'
import PageHeader from '../../../components/dashboard/PageHeader'
import StatusBadge from '../../../components/dashboard/StatusBadge'
import { useAuth } from '../../../context/useAuth'
import { getAuthorApplications, saveAuthorApplications } from '../../../utils/userStorage'
import { PERMISSIONS } from '../../../utils/roles'

function AuthorApplications() {
  const { currentUser, approveAuthorApplication, can } = useAuth()
  const [applications, setApplications] = useState(getAuthorApplications)
  const [rejecting, setRejecting] = useState(null)
  const [feedback, setFeedback] = useState('')

  const decide = (application, decision) => {
    if (!can(PERMISSIONS.AUTHOR_APPLICATIONS_REVIEW)) return
    if (decision === 'approve') {
      const result = approveAuthorApplication(application.userId)
      if (!result.success) return toast.error(result.message)
    }
    const next = applications.map((item) =>
      item.id === application.id
        ? {
            ...item,
            status: decision === 'approve' ? 'approved' : 'rejected',
            feedback,
            reviewedBy: currentUser.id,
            reviewedAt: new Date().toISOString(),
          }
        : item,
    )
    saveAuthorApplications(next)
    setApplications(next)
    setRejecting(null)
    setFeedback('')
    toast.success(
      decision === 'approve'
        ? 'Author application approved.'
        : 'Author application rejected.',
    )
  }

  return (
    <>
      <PageHeader
        title="Author Applications"
        description="Review reader applications to become verified authors."
      />
      <DataTable
        title="Applications Queue"
        // subtitle="Pending and processed author registration requests"
        data={applications}
        searchKeys={['name', 'identity', 'sample', 'motivation']}
        searchPlaceholder="Search applicant, identity or sample..."
        filters={[
          {
            key: 'status',
            label: 'All Statuses',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ],
          },
        ]}
        columns={[
          {
            key: 'name',
            header: 'Applicant',
            sortable: true,
            render: (item) => (
              <span className="font-semibold text-slate-800">{item.name}</span>
            ),
          },
          { key: 'identity', header: 'Identity' },
          {
            key: 'sample',
            header: 'Sample Work',
            render: (item) => (
              <span className="line-clamp-1 max-w-xs text-slate-600">
                {item.sample}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <StatusBadge status={item.status} />,
          },
        ]}
        rowActions={(application) =>
          application.status === 'pending'
            ? [
                {
                  label: 'Approve',
                  onClick: () => decide(application, 'approve'),
                },
                {
                  label: 'Reject',
                  danger: true,
                  onClick: () => setRejecting(application),
                },
              ]
            : []
        }
        emptyMessage="No author applications found."
      />
      {rejecting && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-dark/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Reason for Rejection
            </h2>
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows="4"
              placeholder="State the reason..."
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-blue-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejecting(null)
                  setFeedback('')
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  feedback.trim()
                    ? decide(rejecting, 'reject')
                    : toast.error('Please enter a reason.')
                }
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AuthorApplications
