import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Award, BookOpen } from "lucide-react";
import { useAuthorBySlug } from "../hooks/useData";
import Reveal from "../components/RevealSection";
import SmartImage from "../components/SmartImage";
import SEO from "../components/SEO";
import { safeHref } from "../lib/security";

export default function AuthorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: author, books, loading, error } = useAuthorBySlug(slug);

  if (loading) return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
        <div className="animate-pulse grid md:grid-cols-3 gap-8">
          <div className="aspect-[4/5] bg-neutral-200 rounded-lg md:rounded-none max-w-[260px]" />
          <div className="md:col-span-2"><div className="h-3 bg-neutral-200 rounded w-1/4 mb-3" /><div className="h-8 bg-neutral-200 rounded w-1/2 mb-6" /><div className="h-3 bg-neutral-200 rounded w-full mb-2" /><div className="h-3 bg-neutral-200 rounded w-5/6" /></div>
        </div>
      </div>
    </div>
  );

  if (error || !author) return (
    <div className="pt-32 pb-20 text-center px-4">
      <p className="text-neutral-400">Author not found.</p>
      <Link to="/authors" className="text-sm font-medium underline mt-4 inline-block">Back to Authors</Link>
    </div>
  );

  const social = {
    twitter: safeHref(author.social_twitter),
    instagram: safeHref(author.social_instagram),
    website: safeHref(author.social_website),
  };

  return (
    <div>
      <SEO title={author.name} description={author.short_bio} image={author.photo} type="article" />
      <section className="pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-12 sm:pb-16 md:pb-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <Link to="/authors" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors mb-6 sm:mb-8">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Authors</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 md:gap-12 lg:gap-16">
            <Reveal>
              <SmartImage
                src={author.photo}
                alt={author.name}
                className="aspect-[4/5] rounded-lg md:rounded-none mx-auto md:mx-0 max-w-[220px] sm:max-w-[260px] md:max-w-none"
                imgClassName="w-full h-full object-cover"
              />
            </Reveal>

            <Reveal delay={150} className="md:col-span-2">
              <div>
                <p className="text-[10px] sm:text-xs md:text-xs text-neutral-400 uppercase tracking-wider mb-1 sm:mb-2">{author.genre}</p>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 md:mb-8 leading-tight">{author.name}</h1>
                <p className="text-neutral-600 leading-relaxed text-sm sm:text-base md:text-base lg:text-lg mb-5 sm:mb-6 md:mb-8">{author.biography}</p>

                {author.awards.length > 0 && (
                  <div className="mb-5 sm:mb-6 md:mb-8">
                    <h3 className="flex items-center gap-2 sm:gap-2 md:gap-3 font-serif text-base sm:text-base md:text-lg font-bold mb-3 sm:mb-3 md:mb-4">
                      <Award size={18} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
                      Awards & Recognition
                    </h3>
                    <ul className="space-y-1.5 sm:space-y-2 md:space-y-2">
                      {author.awards.map((award, i) => (
                        <li key={i} className="flex items-center gap-2 sm:gap-2.5 md:gap-3 text-xs sm:text-xs md:text-sm text-neutral-600">
                          <span className="w-1.5 h-1.5 bg-black rounded-full shrink-0" />{award}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-2 sm:gap-2 md:gap-3 flex-wrap">
                  {social.twitter && (
                    <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3 md:px-4 py-2 border border-neutral-200 rounded-lg md:rounded-none text-xs sm:text-xs md:text-sm hover:border-black transition-all duration-300 active:scale-[0.97]">
                      <ExternalLink size={12} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />Twitter
                    </a>
                  )}
                  {social.instagram && (
                    <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3 md:px-4 py-2 border border-neutral-200 rounded-lg md:rounded-none text-xs sm:text-xs md:text-sm hover:border-black transition-all duration-300 active:scale-[0.97]">
                      <ExternalLink size={12} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />Instagram
                    </a>
                  )}
                  {social.website && (
                    <a href={social.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3 md:px-4 py-2 border border-neutral-200 rounded-lg md:rounded-none text-xs sm:text-xs md:text-sm hover:border-black transition-all duration-300 active:scale-[0.97]">
                      <ExternalLink size={12} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />Website
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {books.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
            <Reveal>
              <h2 className="flex items-center gap-2 sm:gap-2 md:gap-3 font-serif text-2xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 md:mb-10">
                <BookOpen size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />Published Books
              </h2>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {books.map((book, i) => (
                <Reveal key={book.id} delay={i * 80}>
                  <Link to={`/books/${book.slug}`} className="group">
                    <SmartImage src={book.cover_image} alt={book.title} className="aspect-[3/4] mb-3 sm:mb-4 md:mb-5 bg-neutral-100 rounded-lg md:rounded-none" imgClassName="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
                    <h3 className="font-serif text-sm sm:text-base md:text-base font-bold mb-0.5 sm:mb-1 group-hover:text-neutral-600 transition-colors line-clamp-1">{book.title}</h3>
                    <p className="text-[10px] sm:text-xs md:text-xs text-neutral-400 uppercase tracking-wider">{book.genre}</p>
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
