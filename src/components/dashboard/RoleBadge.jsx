const roleClasses = {
  admin: 'bg-red-100 text-red-700',
  moderator: 'bg-purple-100 text-purple-700',
  author: 'bg-blue-100 text-blue-700',
  employee: 'bg-emerald-100 text-emerald-700',
  user: 'bg-amber-100 text-amber-800',
}

const roleLabels = {
  admin: 'Admin',
  moderator: 'Moderator',
  author: 'Author',
  employee: 'Employee',
  user: 'Reader',
}

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        roleClasses[role] ?? 'bg-dark/10 text-dark'
      }`}
    >
      {roleLabels[role] || role}
    </span>
  )
}

export default RoleBadge
