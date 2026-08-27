import { Mail, Briefcase, BookOpen, Scale, PenTool, Send } from "lucide-react";
import { usePageContent } from "../hooks/usePageContent";
import Reveal from "../components/RevealSection";
import SmartImage from "../components/SmartImage";
import SEO from "../components/SEO";
import SchemaInjector, { buildBreadcrumbSchema } from "../components/SchemaInjector";

const iconMap: Record<string, React.ReactNode> = {
  Mail: <Mail size={18} className="sm:w-5 sm:h-5" />,
  Briefcase: <Briefcase size={18} className="sm:w-5 sm:h-5" />,
  Send: <Send size={18} className="sm:w-5 sm:h-5" />,
  BookOpen: <BookOpen size={18} className="sm:w-5 sm:h-5" />,
  Scale: <Scale size={18} className="sm:w-5 sm:h-5" />,
  PenTool: <PenTool size={18} className="sm:w-5 sm:h-5" />,
};

export default function ContactPage() {
  const { content } = usePageContent("contact");

  return (
    <div>
      <SEO title="Contact" description="Get in touch with Phantastic Publishing for general enquiries, careers, submissions, and business partnerships." image={content.hero.background_image} canonicalPath="/contact" />
      <SchemaInjector schemas={[buildBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }])]} />
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

      {/* Contact Sections */}
      <section className="py-10 sm:py-12 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-10">

            {/* General Enquiries */}
            <Reveal>
              <div className="p-5 sm:p-6 md:p-8 lg:p-10 border border-neutral-200 rounded-xl sm:rounded-xl md:rounded-none hover:border-neutral-400 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-200/50 h-full">
                <div className="flex items-center gap-3 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-neutral-100 rounded-xl sm:rounded-xl md:rounded-none flex items-center justify-center shrink-0">
                    {iconMap.Mail}
                  </div>
                  <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-bold">
                    {content.cards.general.heading}
                  </h2>
                </div>
                <p className="text-neutral-500 text-sm sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-5 md:mb-6">
                  {content.cards.general.body}
                </p>
                <a
                  href={`mailto:${content.cards.general.email}`}
                  className="text-sm sm:text-sm md:text-base font-medium hover:text-neutral-600 transition-colors"
                >
                  {content.cards.general.email}
                </a>
              </div>
            </Reveal>

            {/* Careers */}
            <Reveal delay={80}>
              <div className="p-5 sm:p-6 md:p-8 lg:p-10 border border-neutral-200 rounded-xl sm:rounded-xl md:rounded-none hover:border-neutral-400 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-200/50 h-full">
                <div className="flex items-center gap-3 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-neutral-100 rounded-xl sm:rounded-xl md:rounded-none flex items-center justify-center shrink-0">
                    {iconMap.Briefcase}
                  </div>
                  <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-bold">
                    {content.cards.careers.heading}
                  </h2>
                </div>
                <p className="text-neutral-500 text-sm sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-5 md:mb-6">
                  {content.cards.careers.body}
                </p>
                <a
                  href={`mailto:${content.cards.careers.email}`}
                  className="text-sm sm:text-sm md:text-base font-medium hover:text-neutral-600 transition-colors"
                >
                  {content.cards.careers.email}
                </a>
              </div>
            </Reveal>

            {/* Submissions */}
            <Reveal delay={160}>
              <div className="p-5 sm:p-6 md:p-8 lg:p-10 border border-neutral-200 rounded-xl sm:rounded-xl md:rounded-none hover:border-neutral-400 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-200/50 h-full">
                <div className="flex items-center gap-3 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-neutral-100 rounded-xl sm:rounded-xl md:rounded-none flex items-center justify-center shrink-0">
                    {iconMap.Send}
                  </div>
                  <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-bold">
                    {content.cards.submissions.heading}
                  </h2>
                </div>
                <p className="text-neutral-500 text-sm sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-5 md:mb-6">
                  {content.cards.submissions.body}
                </p>
                <a
                  href={`mailto:${content.cards.submissions.email}`}
                  className="text-sm sm:text-sm md:text-base font-medium hover:text-neutral-600 transition-colors"
                >
                  {content.cards.submissions.email}
                </a>
              </div>
            </Reveal>

            {/* Business & Publishing */}
            <Reveal delay={240}>
              <div className="p-5 sm:p-6 md:p-8 lg:p-10 border border-neutral-200 rounded-xl sm:rounded-xl md:rounded-none hover:border-neutral-400 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-200/50 h-full">
                <div className="flex items-center gap-3 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-neutral-100 rounded-xl sm:rounded-xl md:rounded-none flex items-center justify-center shrink-0">
                    {iconMap.BookOpen}
                  </div>
                  <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-bold">
                    {content.cards.business.heading}
                  </h2>
                </div>
                <p className="text-neutral-500 text-sm sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-5 md:mb-6">
                  {content.cards.business.body}
                </p>
                <div className="space-y-3 sm:space-y-3 md:space-y-4">
                  {content.departments.map((dept, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 sm:gap-3 md:gap-4"
                    >
                      <div className="w-9 h-9 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black text-white rounded-lg sm:rounded-lg md:rounded-none flex items-center justify-center shrink-0">
                        {iconMap[dept.icon] ?? <Mail size={18} />}
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs md:text-sm text-neutral-500 mb-0.5">
                          {dept.label}
                        </p>
                        <a
                          href={`mailto:${dept.email}`}
                          className="text-sm sm:text-sm md:text-base font-medium hover:text-neutral-600 transition-colors"
                        >
                          {dept.email}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Closing line */}
          <Reveal>
            <p className="text-center text-neutral-400 text-sm sm:text-base mt-8 sm:mt-10 md:mt-16 lg:mt-20">
              {content.closing}
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
