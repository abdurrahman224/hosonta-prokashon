import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '../../../components/dashboard/DataTable'
import PageHeader from '../../../components/dashboard/PageHeader'
import ReviewModal from '../../../components/dashboard/ReviewModal'
import StatusBadge from '../../../components/dashboard/StatusBadge'
import { useAuth } from '../../../context/useAuth'
import { PERMISSIONS } from '../../../utils/roles'
import { addActivityLog, getStoredMagazines, saveStoredMagazines } from '../../../utils/moderationStorage'

function MagazineReview() {
  const { currentUser, can } = useAuth()
  const [magazines, setMagazines] = useState(getStoredMagazines)
  const [selected, setSelected] = useState(null)
  const pendingMagazines = magazines.filter((magazine) => magazine.status === 'pending')

  const review = (magazine, decision, comment) => {
    if (!can(PERMISSIONS.MAGAZINES_UPDATE) || magazine.status !== 'pending') return
    const nextStatus = decision === 'approve' ? 'published' : 'rejected'
    const next = magazines.map((item) =>
      item.id === magazine.id
        ? {
            ...item,
            status: nextStatus,
            reviewDecision: decision,
            reviewComment: comment,
            reviewedBy: currentUser.id,
          }
        : item,
    )
    saveStoredMagazines(next)
    setMagazines(next)
    addActivityLog({
      actorId: currentUser.id,
      actorRole: currentUser.role,
      action: decision,
      entity: 'magazine',
      entityId: magazine.id,
      comment,
    })
    setSelected(null)
    toast.success('Magazine-এর সিদ্ধান্ত সংরক্ষণ হয়েছে।')
  }

  return (
    <>
      <PageHeader
        title="Magazine Reviews"
        description="Review, approve or reject submitted Magazine."
      />
      <DataTable
        title="Pending Magazine Submissions"
        subtitle="Magazine awaiting editorial review"
        data={pendingMagazines}
        searchKeys={['title', 'excerpt', 'category']}
        searchPlaceholder="Search Magazine..."
        columns={[
          {
            key: 'title',
            header: 'Post Title',
            sortable: true,
            render: (magazine) => (
              <span className="font-semibold text-slate-800">{magazine.title}</span>
            ),
          },
          { key: 'category', header: 'Category', sortable: true },
          { key: 'date', header: 'Submission Date', sortable: true },
          {
            key: 'status',
            header: 'Status',
            render: (magazine) => <StatusBadge status={magazine.status} />,
          },
        ]}
        onRowClick={setSelected}
        emptyMessage="No Magazine waiting for review."
      />
      {selected && (
        <ReviewModal
          item={selected}
          kind="magazine"
          onClose={() => setSelected(null)}
          onDecision={(decision, comment) =>
            review(selected, decision, comment)
          }
        />
      )}
    </>
  )
}

export default MagazineReview
