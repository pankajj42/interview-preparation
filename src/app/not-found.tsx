import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-[560px] px-8 py-12 text-center">
      <h1 className="text-[28px] font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">That page does not exist. Head back to the start.</p>
      <Link href="/" className="mt-5 inline-block rounded-lg bg-ink px-4 py-2 text-[14px] font-semibold text-bg no-underline">Home</Link>
    </div>
  );
}
