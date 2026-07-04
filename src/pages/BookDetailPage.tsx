import { useParams, Link } from "react-router-dom";
import { Star, ArrowLeft } from "lucide-react";
import { useBookBySlug, useAuthors, useRelatedBooks } from "../hooks/useData";
import Reveal from "../components/RevealSection";
import SmartImage from "../components/SmartImage";
import BookCover3D from "../components/BookCover3D";
import PlatformBadges from "../components/PlatformLogos";
import SEO from "../components/SEO";

export default function BookDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: book, reviews, loading, error } = useBookBySlug(slug);
  const { data: authors } = useAuthors();
  const { data: related } = useRelatedBooks(book?.id, book?.genre, 4);

  const author = book ? authors.find(a => a.id === book.author_id) : undefined;

  if (loading) return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
        <div className="animate-pulse grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2"><div className="aspect-[3/4] bg-neutral-200 rounded-lg md:rounded-none max-w-[300px]" /></div>
          <div className="md:col-span-3"><div className="h-4 bg-neutral-200 rounded w-1/4 mb-3" /><div className="h-8 bg-neutral-200 rounded w-3/4 mb-4" /><div className="h-4 bg-neutral-200 rounded w-1/2 mb-6" /><div className="h-3 bg-neutral-200 rounded w-full mb-2" /><div className="h-3 bg-neutral-200 rounded w-5/6 mb-2" /><div className="h-3 bg-neutral-200 rounded w-4/6" /></div>
        </div>
      </div>
    </div>
  );

  if (error || !book) return (
    <div className="pt-32 pb-20 text-center px-4">
      <p className="text-neutral-400">Book not found.</p>
      <Link to="/books" className="text-sm font-medium underline mt-4 inline-block">Back to Books</Link>
    </div>
  );

  const hasRating = book.rating !== null && book.rating > 0;
  const showReviews = book.reviews_enabled && reviews.length > 0;

  return (
    <div>
      <SEO title={book.title} description={book.short_description} image={book.cover_image} type="article" />
      <section className="pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-12 sm:pb-16 md:pb-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <Link to="/books" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors mb-6 sm:mb-8">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Books</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="grid md:grid-cols-5 gap-6 sm:gap-8 md:gap-14 lg:gap-20">
            <Reveal className="md:col-span-2">
              {/* Book cover — extra horizontal padding so the rotated 3D book doesn't clip */}
              <div className="flex flex-col items-center md:items-start">
                <div className="w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px] px-6 md:px-8">
                  <BookCover3D src={book.cover_image} alt={book.title} />
                </div>
                <div className="mt-5 sm:mt-6 w-full max-w-[260px] sm:max-w-[300px] md:max-w-none">
                  <PlatformBadges
                    googleBooksUrl={book.google_books_url}
                    appleBooksUrl={book.apple_books_url}
                    amazonKindleUrl={book.amazon_kindle_url}
                  />
                </div>
              </div>
            </Reveal>

            <Reveal delay={150} className="md:col-span-3">
              <div>
                <p className="text-[10px] sm:text-xs md:text-xs text-neutral-400 uppercase tracking-wider mb-1 sm:mb-2">{book.genre}</p>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 leading-tight">{book.title}</h1>
                <Link to={`/authors/${author?.slug}`} className="text-base sm:text-lg text-neutral-600 hover:text-black transition-colors">{author?.name}</Link>

                {hasRating && (
                  <div className="flex items-center gap-3 sm:gap-4 mt-4 sm:mt-5 md:mt-6 mb-6 sm:mb-7 md:mb-8">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={`sm:w-4 sm:h-4 ${i < Math.round(book.rating!) ? "fill-black text-black" : "fill-neutral-200 text-neutral-200"}`} />
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm text-neutral-500">{book.rating} / 5</span>
                  </div>
                )}

                {!hasRating && <div className="mt-4 sm:mt-5 md:mt-6 mb-6 sm:mb-7 md:mb-8" />}

                <p className="text-neutral-600 leading-relaxed text-sm sm:text-base md:text-base lg:text-lg mb-6 sm:mb-7 md:mb-8">{book.description}</p>

                <div className="grid grid-cols-3 gap-3 sm:gap-4 border-t border-neutral-200 pt-5 sm:pt-6 md:pt-8 mb-5 sm:mb-6 md:mb-8">
                  <div><p className="text-[10px] sm:text-xs text-neutral-400 uppercase tracking-wider mb-0.5 sm:mb-1">Published</p><p className="font-medium text-xs sm:text-sm">{book.year}</p></div>
                  <div><p className="text-[10px] sm:text-xs text-neutral-400 uppercase tracking-wider mb-0.5 sm:mb-1">Pages</p><p className="font-medium text-xs sm:text-sm">{book.pages}</p></div>
                  <div><p className="text-[10px] sm:text-xs text-neutral-400 uppercase tracking-wider mb-0.5 sm:mb-1">ISBN</p><p className="font-medium text-[10px] sm:text-sm break-all">{book.isbn}</p></div>
                </div>

                {author && (
                  <Link to={`/authors/${author?.slug}`} className="flex items-center gap-3 sm:gap-3 md:gap-4 p-3 sm:p-3 md:p-4 bg-neutral-50 hover:bg-neutral-100 rounded-lg md:rounded-none transition-all duration-300 group">
                    <SmartImage src={author.photo} alt={author.name} className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full shrink-0" imgClassName="w-full h-full object-cover rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-neutral-400 uppercase tracking-wider mb-0.5">About the Author</p>
                      <p className="font-medium text-sm sm:text-base truncate group-hover:text-neutral-600 transition-colors">{author.name}</p>
                    </div>
                    <ArrowLeft size={16} className="rotate-180 text-neutral-400 group-hover:text-black transition-colors shrink-0" />
                  </Link>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Reviews — only shown if enabled AND reviews exist */}
      {showReviews && (
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
            <Reveal><h2 className="font-serif text-2xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 md:mb-10">Reviews</h2></Reveal>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {reviews.map((review, i) => (
                <Reveal key={review.id} delay={i * 100}>
                  <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg md:rounded-none transition-all duration-300 hover:shadow-lg hover:shadow-neutral-200/50">
                    <div className="flex items-center gap-0.5 sm:gap-1 mb-2 sm:mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11} className={`sm:w-3 sm:h-3 ${i < review.rating ? "fill-black text-black" : "fill-neutral-200 text-neutral-200"}`} />
                      ))}
                    </div>
                    <p className="text-neutral-600 leading-relaxed mb-3 sm:mb-4 md:mb-6 italic text-sm sm:text-base">&ldquo;{review.text}&rdquo;</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-medium">{review.reviewer}</p>
                      <p className="text-[10px] sm:text-xs text-neutral-400">{review.date}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Books */}
      {related.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
            <Reveal><h2 className="font-serif text-2xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 md:mb-10">Related Books</h2></Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {related.map((b, i) => (
                <Reveal key={b.id} delay={i * 80}>
                  <Link to={`/books/${b.slug}`} className="group">
                    <SmartImage src={b.cover_image} alt={b.title} className="aspect-[3/4] mb-3 sm:mb-4 md:mb-5 bg-neutral-100 rounded-lg md:rounded-none" imgClassName="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
                    <h3 className="font-serif text-sm sm:text-base md:text-base font-bold mb-0.5 sm:mb-1 group-hover:text-neutral-600 transition-colors line-clamp-1">{b.title}</h3>
                    <p className="text-xs sm:text-sm text-neutral-500">{authors.find(a => a.id === b.author_id)?.name}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
