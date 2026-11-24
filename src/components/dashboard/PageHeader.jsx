function PageHeader({ title, description, action }) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="font-heading text-sm sm:text-xl font-bold text-dark">{title}</h1>
        {description && <p className="mt-2 text-dark-muted text-xs sm:text-base">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export default PageHeader
