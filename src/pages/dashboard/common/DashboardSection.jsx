import PageHeader from '../../../components/dashboard/PageHeader'

function DashboardSection({ title, description = 'এই মডিউলটি শীঘ্রই প্রস্তুত হবে।' }) {
  return (
    <section>
      <PageHeader title={title} description={description} />
      <div className="rounded-xl border border-dashed border-dark/20 bg-white px-6 py-20 text-center">
        <h2 className="font-heading text-2xl font-bold text-dark">মডিউল প্রস্তুত হচ্ছে</h2>
        <p className="mt-3 text-dark-muted">ড্যাশবোর্ডের ভিত্তি সফলভাবে কাজ করছে।</p>
      </div>
    </section>
  )
}

export default DashboardSection
