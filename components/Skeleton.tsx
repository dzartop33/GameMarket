export function CardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-32 bg-zinc-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-800 rounded w-1/2" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-1/2 mb-2" />
          <div className="h-3 bg-zinc-800 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-zinc-800" />
          <div className="space-y-3">
            <div className="h-6 bg-zinc-800 rounded w-40" />
            <div className="h-4 bg-zinc-800 rounded w-60" />
          </div>
        </div>
      </div>
    </div>
  );
}