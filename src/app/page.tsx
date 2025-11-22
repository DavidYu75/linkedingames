import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
          LinkedIn Games Clone
        </h1>
        <p className="text-lg text-muted-foreground max-w-[600px]">
          Play unlimited versions of your favorite LinkedIn puzzle games.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
          <Link 
            href="/queens"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Queens{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Place queens so no two share a row, column, or color region.
            </p>
          </Link>

          {/* Placeholders for future games */}
          <div className="rounded-lg border border-transparent px-5 py-4 opacity-50 cursor-not-allowed">
            <h2 className="mb-3 text-2xl font-semibold">
              Tango
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Coming soon...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
