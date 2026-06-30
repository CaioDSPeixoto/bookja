export default function CarregandoHistoria() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="aspect-[3/4] w-full flex-shrink-0 rounded-2xl bg-gray-200 md:w-64" />
        <div className="flex-1 space-y-4">
          <div className="h-8 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/3 rounded bg-gray-100" />
          <div className="flex gap-2">
            <div className="h-7 w-28 rounded-full bg-gray-100" />
            <div className="h-7 w-20 rounded-full bg-gray-100" />
          </div>
          <div className="space-y-2 pt-4">
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-5/6 rounded bg-gray-100" />
            <div className="h-3 w-4/6 rounded bg-gray-100" />
          </div>
        </div>
      </div>
      <div className="mt-10 space-y-2">
        <div className="mb-4 h-6 w-32 rounded bg-gray-200" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 w-full rounded-xl border border-gray-100 bg-white shadow-sm" />
        ))}
      </div>
    </div>
  )
}
