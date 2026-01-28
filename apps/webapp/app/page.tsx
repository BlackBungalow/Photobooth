export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold">Photobooth événementiel</h1>
      <p className="max-w-xl text-gray-300">
        Utilisez /admin pour gérer vos projets ou /p/&lt;slug&gt;/booth pour la prise photo.
      </p>
    </main>
  );
}
