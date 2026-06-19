export function Skeleton() {
  return (
    <div className="flex-1 overflow-hidden px-4 py-3" aria-busy="true" aria-label="加载中">
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[168px] animate-pulse rounded-xl border border-line bg-surface/60"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex h-full gap-3 p-3">
              <div className="w-[230px] space-y-2">
                <div className="h-3 w-24 rounded bg-raised" />
                <div className="h-6 w-full rounded bg-raised" />
                <div className="h-6 w-full rounded bg-raised" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-raised" />
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <div key={j} className="h-12 w-16 rounded-md bg-raised" />
                  ))}
                </div>
              </div>
              <div className="w-[200px] space-y-2">
                <div className="h-2 w-full rounded-full bg-raised" />
                <div className="h-2 w-full rounded-full bg-raised" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
