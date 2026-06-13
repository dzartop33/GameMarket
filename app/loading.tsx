export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />

        <p className="text-zinc-400">
          Загрузка...
        </p>
      </div>
    </main>
  );
}