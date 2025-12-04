import { AuthButton } from "@/components/auth-button";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-center sm:text-left">
          Top 100 Tracks
        </h1>
        <p className="text-lg text-center sm:text-left max-w-md">
          Create your definitive list of the top 100 tracks of all time. Share with friends and see what they think.
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <AuthButton />
        </div>
      </main>
    </div>
  );
}
