export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">ClubSphere</h1>
        <p className="text-muted-foreground text-sm">
          Next.js boilerplate initialized with Prisma (PostgreSQL), Clerk Auth, TypeScript, and Zod validation.
        </p>
      </div>
    </main>
  );
}
