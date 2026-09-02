import { Link } from "react-router-dom";
import { ArrowRight, Star, ChevronRight, BookOpen, Award, Send } from "lucide-react";
import { useBooks, useAuthors, useTestimonials, useServices } from "../hooks/useData";
import { usePageContent } from "../hooks/usePageContent";
import Reveal from "../components/RevealSection";
import SmartImage from "../components/SmartImage";
import SEO from "../components/SEO";
import SchemaInjector from "../components/SchemaInjector";

export default function HomePage() {
  const { data: books, loading: booksLoading } = useBooks();
  const { data: authors, loading: authorsLoading } = useAuthors();
  const { data: testimonials, loading: testimonialsLoading } = useTestimonials();
  const { data: services, loading: servicesLoading } = useServices();
  const { content } = usePageContent("home");

  const featuredBooks = books.slice(0, 4);
  const featuredAuthors = authors.slice(0, 4);

  return (
    <div>
      <SEO pageType="home" canonicalPath="/" />
      <SchemaInjector schemas={[]} />
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-neutral-950">
        <div className="absolute inset-0">
          <SmartImage
            src={content.hero.background_image}
            alt=""
            className="w-full h-full"
            imgClassName="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-neutral-950" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8 text-center py-24">
          <p className="text-neutral-400 text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-5 sm:mb-6 animate-fade-in">
            {content.hero.eyebrow}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-5 sm:mb-6 animate-fade-in-up leading-[1.1]">
            {content.hero.title_line_1}
            <br />
            <span className="text-neutral-300">{content.hero.title_line_2}</span>
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg md:text-xl max-w-lg sm:max-w-xl md:max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2 animate-fade-in-up-delay">
            {content.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-in-up-delay-2">
            <Link
              to={content.hero.cta_primary_link}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 glass-btn text-neutral-900 px-7 sm:px-8 py-3.5 sm:py-4 text-sm font-medium tracking-wide rounded-xl sm:rounded-xl md:rounded-full"
            >
              {content.hero.cta_primary_text}
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to={content.hero.cta_secondary_link}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 glass-btn-dark text-white px-7 sm:px-8 py-3.5 sm:py-4 text-sm font-medium tracking-wide rounded-xl sm:rounded-xl md:rounded-full"
            >
              {content.hero.cta_secondary_text}
            </Link>
          </div>
        </div>
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-neutral-500 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1 h-2 bg-neutral-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between mb-10 sm:mb-12 md:mb-16 lg:mb-16">
              <div>
                <p className="text-neutral-400 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">
                  {content.featured_books.eyebrow}
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold">
                  {content.featured_books.heading}
                </h2>
              </div>
              <Link
                to={content.featured_books.view_all_link}
                className="hidden md:inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all duration-300"
              >
                {content.featured_books.view_all_text}
                <ChevronRight size={16} />
              </Link>
            </div>
          </Reveal>

          {booksLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-neutral-200 rounded-lg md:rounded-none mb-3 sm:mb-4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-neutral-200 rounded w-2/3 mb-1" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {featuredBooks.map((book, i) => (
                <Reveal key={book.id} delay={i * 80}>
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
                    <p className="text-xs sm:text-sm text-neutral-500">{authors.find(a => a.id === book.author_id)?.name}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
          <Link
            to={content.featured_books.view_all_link}
            className="md:hidden mt-6 sm:mt-8 inline-flex items-center gap-2 text-sm font-medium"
          >
            {content.featured_books.view_all_text} <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* About Intro */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-14 lg:gap-16 items-center">
            <Reveal>
              <div>
                <p className="text-neutral-400 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">
                  {content.about_intro.eyebrow}
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                  {content.about_intro.heading}
                </h2>
                {content.about_intro.paragraphs.map((p, i) => (
                  <p key={i} className="text-neutral-600 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                    {p}
                  </p>
                ))}
                <Link
                  to={content.about_intro.link_url}
                  className="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all duration-300"
                >
                  {content.about_intro.link_text} <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="relative">
                <SmartImage
                  src={content.about_intro.image}
                  alt="Bookshelves"
                  className="aspect-[4/5] rounded-lg sm:rounded-lg md:rounded-none"
                  imgClassName="w-full h-full object-cover"
                />
                <div className="absolute -bottom-4 sm:-bottom-6 -left-2 sm:-left-6 bg-white p-4 sm:p-6 shadow-xl rounded-xl sm:rounded-xl md:rounded-none max-w-[180px] sm:max-w-[240px]">
                  <p className="font-serif text-3xl sm:text-4xl font-bold">{content.about_intro.stat_value}</p>
                  <p className="text-xs sm:text-sm text-neutral-500">{content.about_intro.stat_label}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <Reveal>
            <div className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-16">
              <p className="text-neutral-400 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">
                {content.services_overview.eyebrow}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                {content.services_overview.heading}
              </h2>
              <p className="text-neutral-500 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto text-sm sm:text-base">
                {content.services_overview.subtitle}
              </p>
            </div>
          </Reveal>
          {servicesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse p-5 sm:p-6 md:p-8 border border-neutral-200 rounded-xl md:rounded-none">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-neutral-200 rounded-xl md:rounded-none mb-4 sm:mb-5" />
                  <div className="h-5 bg-neutral-200 rounded w-1/2 mb-3" />
                  <div className="h-3 bg-neutral-200 rounded w-full mb-2" />
                  <div className="h-3 bg-neutral-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {services.slice(0, 3).map((service, i) => (
                <Reveal key={service.id} delay={i * 100}>
                  <div className="group p-5 sm:p-6 md:p-8 border border-neutral-200 hover:border-black rounded-xl sm:rounded-xl md:rounded-none transition-all duration-300 hover:shadow-lg hover:shadow-neutral-200/50">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-neutral-100 group-hover:bg-black rounded-xl sm:rounded-xl md:rounded-none flex items-center justify-center mb-4 sm:mb-5 md:mb-6 transition-colors duration-300">
                      {service.icon === "PenTool" && <BookOpen size={18} className="text-black group-hover:text-white transition-colors sm:w-5 sm:h-5" />}
                      {service.icon === "CheckCircle" && <Award size={18} className="text-black group-hover:text-white transition-colors sm:w-5 sm:h-5" />}
                      {service.icon === "Palette" && <Star size={18} className="text-black group-hover:text-white transition-colors sm:w-5 sm:h-5" />}
                    </div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                      {service.title}
                    </h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
          <Reveal>
            <div className="text-center mt-8 sm:mt-10 md:mt-12">
              <Link
                to={content.services_overview.view_all_link}
                className="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all duration-300"
              >
                {content.services_overview.view_all_text} <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Featured Authors */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32 bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between mb-10 sm:mb-12 md:mb-16 lg:mb-16">
              <div>
                <p className="text-neutral-500 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">
                  {content.featured_authors.eyebrow}
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold">
                  {content.featured_authors.heading}
                </h2>
              </div>
              <Link
                to={content.featured_authors.view_all_link}
                className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white hover:gap-3 transition-all duration-300"
              >
                {content.featured_authors.view_all_text}
                <ChevronRight size={16} />
              </Link>
            </div>
          </Reveal>
          {authorsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-neutral-800 rounded-lg md:rounded-none mb-3 sm:mb-4" />
                  <div className="h-4 bg-neutral-800 rounded w-2/3 mb-1" />
                  <div className="h-3 bg-neutral-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {featuredAuthors.map((author, i) => (
                <Reveal key={author.id} delay={i * 80}>
                  <Link to={`/authors/${author.slug}`} className="group">
                    <SmartImage
                      src={author.photo}
                      alt={author.name}
                      className="aspect-square mb-3 sm:mb-4 md:mb-5 rounded-lg sm:rounded-lg md:rounded-none"
                      imgClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <h3 className="font-serif text-sm sm:text-base md:text-base lg:text-lg font-bold group-hover:text-neutral-300 transition-colors line-clamp-1">
                      {author.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs md:text-sm text-neutral-500">{author.genre}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
          <Link
            to={content.featured_authors.view_all_link}
            className="md:hidden mt-6 sm:mt-8 inline-flex items-center gap-2 text-sm font-medium text-neutral-400"
          >
            {content.featured_authors.view_all_text} <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <Reveal>
            <div className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-16">
              <p className="text-neutral-400 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">
                {content.testimonials.eyebrow}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold">
                {content.testimonials.heading}
              </h2>
            </div>
          </Reveal>
          {testimonialsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse p-5 sm:p-6 md:p-8 border border-neutral-200 rounded-xl md:rounded-none">
                  <div className="flex gap-1 mb-4"><div className="w-3 h-3 bg-neutral-200 rounded-full" /><div className="w-3 h-3 bg-neutral-200 rounded-full" /><div className="w-3 h-3 bg-neutral-200 rounded-full" /></div>
                  <div className="h-3 bg-neutral-200 rounded w-full mb-2" />
                  <div className="h-3 bg-neutral-200 rounded w-3/4 mb-4" />
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-neutral-200 rounded-full" /><div><div className="h-3 bg-neutral-200 rounded w-20 mb-1" /><div className="h-2 bg-neutral-200 rounded w-16" /></div></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={i * 100}>
                  <div className="p-5 sm:p-6 md:p-8 border border-neutral-200 hover:border-neutral-400 transition-all duration-300 rounded-xl sm:rounded-xl md:rounded-none hover:shadow-lg hover:shadow-neutral-200/50">
                    <div className="flex items-center gap-1 mb-4 sm:mb-5 md:mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className="fill-black text-black sm:w-3.5 sm:h-3.5" />
                      ))}
                    </div>
                    <p className="text-neutral-600 leading-relaxed mb-4 sm:mb-5 md:mb-6 italic text-sm sm:text-base">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <SmartImage
                        src={t.avatar}
                        alt={t.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0"
                        imgClassName="w-full h-full object-cover rounded-full"
                      />
                      <div>
                        <p className="font-medium text-xs sm:text-sm">{t.name}</p>
                        <p className="text-[10px] sm:text-xs text-neutral-400">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8 text-center">
          <Reveal>
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-2xl sm:rounded-2xl md:rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 transition-transform duration-300 hover:scale-110">
              <Send size={22} className="text-white sm:w-6 sm:h-6" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              {content.cta.heading}
            </h2>
            <p className="text-neutral-500 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto">
              {content.cta.body}
            </p>
            <Link
              to={content.cta.button_link}
              className="group inline-flex items-center justify-center gap-2 bg-black text-white px-7 sm:px-8 py-3.5 sm:py-4 text-sm font-medium tracking-wide hover:bg-neutral-800 transition-all duration-300 rounded-xl sm:rounded-xl md:rounded-none hover:shadow-lg hover:shadow-neutral-400/30"
            >
              {content.cta.button_text}
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
