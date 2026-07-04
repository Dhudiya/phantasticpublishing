import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useBooks, useAuthors, useGenres } from "../hooks/useData";
import { usePageContent } from "../hooks/usePageContent";
import Reveal from "../components/RevealSection";
import SmartImage from "../components/SmartImage";
import SEO from "../components/SEO";

export default function BooksPage() {
  const { data: books, loading } = useBooks();
  const { data: authors } = useAuthors();
  const genres = useGenres();
  const { content } = usePageContent("books");

  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return books.filter((book) => {
      const matchesGenre =
        selectedGenre === "All" || book.genre === selectedGenre;
      const authorName = authors.find(a => a.id === book.author_id)?.name ?? "";
      const matchesSearch =
        search === "" ||
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        authorName.toLowerCase().includes(search.toLowerCase()) ||
        book.genre.toLowerCase().includes(search.toLowerCase());
      return matchesGenre && matchesSearch;
    });
  }, [books, authors, search, selectedGenre]);

  return (
    <div>
      <SEO title="Books" description="Browse our full catalog of published books across every genre — fiction, non-fiction, poetry, and more." />
      {/* Hero */}
      <section className="relative pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-12 sm:pb-16 md:pb-20 lg:pb-20 bg-neutral-950 text-white">
        <div className="absolute inset-0">
          <SmartImage
            src={content.hero.background_image}
            alt=""
            className="w-full h-full"
            imgClassName="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 to-neutral-950" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <p className="text-neutral-500 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">
            {content.hero.eyebrow}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold mb-3 sm:mb-6">
            {content.hero.title}
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg max-w-xl sm:max-w-xl md:max-w-2xl leading-relaxed">
            {content.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="sticky top-16 sm:top-20 z-30 px-4 sm:px-6 md:px-8 lg:px-8 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto glass rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search books..."
                className="w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-neutral-50 border border-neutral-200 rounded-xl sm:rounded-xl md:rounded-none text-sm focus:outline-none focus:border-black transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl sm:rounded-xl md:rounded-none text-sm font-medium transition-all duration-300 shrink-0 ${
                showFilters
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-neutral-200 hover:border-black"
              }`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium border rounded-full transition-all duration-300 ${
                    selectedGenre === genre
                      ? "bg-black text-white border-black"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-black"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Books Grid */}
      <section className="py-10 sm:py-12 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <p className="text-xs sm:text-sm text-neutral-400 mb-5 sm:mb-6 md:mb-8">
            {filtered.length} {filtered.length === 1 ? "book" : "books"} found
            {selectedGenre !== "All" && ` in ${selectedGenre}`}
            {search && ` matching "${search}"`}
          </p>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-neutral-200 rounded-lg md:rounded-none mb-3 sm:mb-4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-neutral-200 rounded w-2/3 mb-1" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <p className="text-neutral-400 text-base sm:text-lg">
                No books found matching your criteria.
              </p>
              <button
                onClick={() => { setSearch(""); setSelectedGenre("All"); }}
                className="mt-4 text-sm font-medium underline underline-offset-4 hover:text-black transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {filtered.map((book, i) => (
                <Reveal key={book.id} delay={Math.min(i * 60, 300)}>
                  <Link to={`/books/${book.slug}`} className="group">
                    <SmartImage
                      src={book.cover_image}
                      alt={book.title}
                      className="aspect-[3/4] mb-3 sm:mb-4 md:mb-5 bg-neutral-100 rounded-lg sm:rounded-lg md:rounded-none"
                      imgClassName="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                    />
                    <p className="text-[10px] sm:text-xs md:text-xs text-neutral-400 uppercase tracking-wider mb-0.5 sm:mb-1">
                      {book.genre}
                    </p>
                    <h3 className="font-serif text-sm sm:text-base md:text-base lg:text-lg font-bold mb-0.5 sm:mb-1 group-hover:text-neutral-600 transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-500 mb-1 sm:mb-2">
                      {authors.find(a => a.id === book.author_id)?.name}
                    </p>
                    <p className="text-[11px] sm:text-xs text-neutral-400 line-clamp-2 hidden sm:block">
                      {book.short_description}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
