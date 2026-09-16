import Navbar from "./companents/Navbar";

function App() {
  return (
    <div>
      <Navbar />
      <main>
        <section className="flex min-h-screen items-center justify-center bg-[#F9F9F9]">
          <h1 className="text-5xl font-extrabold text-[#FF4A2F]">
            HitMeUp
          </h1>
        </section>
      </main>
    </div>
  );
}

export default App;