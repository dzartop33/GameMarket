export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <p className="text-zinc-500 text-sm">
          Загрузка...
        </p>
      </div>
    </main>
  );
}