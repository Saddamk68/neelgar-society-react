export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only fixed top-2 left-2 z-[9999] bg-white text-black px-3 py-2 rounded shadow"
    >
      Skip to main content
    </a>
  );
}
