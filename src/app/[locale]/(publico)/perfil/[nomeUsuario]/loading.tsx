export default function CarregandoPerfil() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-8">
      <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-20 bg-gray-200" />
        <div className="flex items-start gap-4 px-5 pb-5">
          <div className="-mt-10 h-20 w-20 rounded-full border-4 border-white bg-gray-200" />
          <div className="flex-1 space-y-2 pt-3">
            <div className="h-6 w-40 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-100" />
          </div>
        </div>
      </div>
      <div className="mb-4 h-6 w-44 rounded bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="h-24 w-16 flex-shrink-0 rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
