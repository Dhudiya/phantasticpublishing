import { Link } from "react-router-dom";
import { useAuthors } from "../hooks/useData";
import { usePageContent } from "../hooks/usePageContent";
import Reveal from "../components/RevealSection";
import SmartImage from "../components/SmartImage";
import SEO from "../components/SEO";

export default function AuthorsPage() {
  const { data: authors, loading } = useAuthors();
  const { content } = usePageContent("authors");

  return (
    <div>
      <SEO title="Authors" description="Discover the talented authors behind our published books — their stories, awards, and published works." />
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
          <p className="text-neutral-500 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">{content.hero.eyebrow}</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold mb-3 sm:mb-6">{content.hero.title}</h1>
          <p className="text-neutral-400 text-base sm:text-lg max-w-xl sm:max-w-xl md:max-w-2xl leading-relaxed">
            {content.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Authors Grid */}
      <section className="py-10 sm:py-12 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-neutral-200 rounded-lg md:rounded-none mb-3 sm:mb-4" />
                  <div className="h-4 bg-neutral-200 rounded w-2/3 mb-1" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {authors.map((author, i) => (
                <Reveal key={author.id} delay={Math.min(i * 80, 400)}>
                  <Link to={`/authors/${author.slug}`} className="group">
                    <SmartImage
                      src={author.photo}
                      alt={author.name}
                      className="aspect-[4/5] mb-3 sm:mb-4 md:mb-5 rounded-lg sm:rounded-lg md:rounded-none"
                      imgClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <h3 className="font-serif text-sm sm:text-base md:text-xl font-bold group-hover:text-neutral-600 transition-colors line-clamp-1">{author.name}</h3>
                    <p className="text-[11px] sm:text-xs md:text-sm text-neutral-500">{author.genre}</p>
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
