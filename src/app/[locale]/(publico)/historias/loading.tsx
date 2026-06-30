export default function CarregandoCatalogo() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
      <div className="mb-6 h-8 w-40 rounded bg-gray-200" />
      <div className="mb-6 h-11 w-full rounded-xl bg-gray-100" />
      <div className="mb-6 h-12 w-full rounded-xl bg-gray-100" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="aspect-[3/4] w-full bg-gray-200" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
