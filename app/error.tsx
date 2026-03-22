"use client";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>Error</h1>
      <p>{error.message || "An unexpected error occurred."}</p>
    </main>
  );
}
