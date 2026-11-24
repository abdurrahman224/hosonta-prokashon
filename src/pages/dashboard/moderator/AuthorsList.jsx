import DataTable from '../../../components/dashboard/DataTable'
import PageHeader from '../../../components/dashboard/PageHeader'
import { useAuth } from '../../../context/useAuth'
import authors from '../../../data/authors'
import { PERMISSIONS } from '../../../utils/roles'

function AuthorsList() {
  const { can } = useAuth()
  const visibleAuthors = can(PERMISSIONS.AUTHORS_READ) ? authors : []

  return (
    <>
      <PageHeader
        title="Authors Directory"
        description="View registered author profiles and publications."
      />
      <DataTable
        title="Verified Authors"
        subtitle="Catalog of active and approved publishing authors"
        data={visibleAuthors}
        searchKeys={['name', 'bio']}
        searchPlaceholder="Search author name or bio..."
        columns={[
          {
            key: 'name',
            header: 'Author Details',
            sortable: true,
            render: (author) => (
              <div className="flex items-center gap-3">
                <img
                  src={author.photo}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover shadow-2xs"
                />
                <span className="font-semibold text-slate-800">{author.name}</span>
              </div>
            ),
          },
          {
            key: 'bio',
            header: 'Biography',
            render: (author) => (
              <span className="line-clamp-2 max-w-lg text-slate-600">
                {author.bio}
              </span>
            ),
          },
          {
            key: 'booksCount',
            header: 'Published Books',
            sortable: true,
            sortValue: (author) => Number(author.booksCount || 0),
          },
        ]}
        emptyMessage="No authors found."
      />
    </>
  )
}

export default AuthorsList
