import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '../../../components/dashboard/DataTable'
import PageHeader from '../../../components/dashboard/PageHeader'
import ReviewModal from '../../../components/dashboard/ReviewModal'
import StatusBadge from '../../../components/dashboard/StatusBadge'
import { useAuth } from '../../../context/useAuth'
import authors from '../../../data/authors'
import { PERMISSIONS } from '../../../utils/roles'
import { addActivityLog, getStoredBooks, saveStoredBooks } from '../../../utils/moderationStorage'

function ReviewQueue() {
  const { currentUser, can } = useAuth()
  const [books, setBooks] = useState(getStoredBooks)
  const [selectedBook, setSelectedBook] = useState(null)
  const pendingBooks = books.filter((book) => book.status === 'pending')
  const categories = [...new Set(books.map((book) => book.category))]
  const authorOptions = authors.map((author) => ({ value: author.id, label: author.name }))

  const waitingLabel = (dateStr) => {
    if (!dateStr) return 'Just now'
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    return days <= 0 ? 'Today' : `${days} days ago`
  }

  const reviewBook = (book, decision, comment) => {
    if (!can(PERMISSIONS.BOOKS_UPDATE) || book.status !== 'pending') return
    const nextStatus = decision === 'approve' ? 'published' : 'rejected'
    const nextBooks = books.map((item) =>
      item.id === book.id
        ? {
            ...item,
            status: nextStatus,
            reviewDecision: decision,
            reviewComment: comment,
            reviewedBy: currentUser.id,
            reviewedAt: new Date().toISOString(),
          }
        : item,
    )
    saveStoredBooks(nextBooks)
    setBooks(nextBooks)
    addActivityLog({
      actorId: currentUser.id,
      actorRole: currentUser.role,
      action: decision,
      entity: 'book',
      entityId: book.id,
      comment,
    })
    setSelectedBook(null)
    toast.success(decision === 'approve' ? 'Book approved.' : 'Book review decision saved.')
  }

  return (
    <>
      <PageHeader
        title="Book Review Queue"
        description="Review pending book submissions and approve or request revisions."
      />
      <DataTable
        title="Pending Book Reviews"
        subtitle="Catalog submissions awaiting editorial review"
        data={pendingBooks}
        searchKeys={['title', 'author', 'category']}
        searchPlaceholder="Search by book or author name..."
        filters={[
          { key: 'category', label: 'All Categories', options: categories.map((value) => ({ value, label: value })) },
          { key: 'authorId', label: 'All Authors', options: authorOptions },
        ]}
        onRowClick={setSelectedBook}
        columns={[
          {
            key: 'title',
            header: 'Book Title',
            sortable: true,
            render: (book) => (
              <span className="font-semibold text-slate-800">{book.title}</span>
            ),
          },
          { key: 'author', header: 'Author', sortable: true },
          { key: 'category', header: 'Category' },
          {
            key: 'submittedAt',
            header: 'Waiting Time',
            sortable: true,
            sortValue: (book) => new Date(book.submittedAt ?? 0).getTime(),
            render: (book) => waitingLabel(book.submittedAt),
          },
          {
            key: 'status',
            header: 'Status',
            render: (book) => <StatusBadge status={book.status} />,
          },
        ]}
        emptyMessage="No books waiting for review."
      />
      {selectedBook && (
        <ReviewModal
          item={selectedBook}
          kind="book"
          onClose={() => setSelectedBook(null)}
          onDecision={(decision, comment) => reviewBook(selectedBook, decision, comment)}
        />
      )}
    </>
  )
}

export default ReviewQueue
