import { Link } from "react-router-dom";
import { PenTool, CheckCircle, Palette, Printer, Globe, TrendingUp, ArrowRight } from "lucide-react";
import { useServices } from "../hooks/useData";
import { usePageContent } from "../hooks/usePageContent";
import Reveal from "../components/RevealSection";
import SmartImage from "../components/SmartImage";
import SEO from "../components/SEO";

const iconMap: Record<string, React.ReactNode> = {
  PenTool: <PenTool size={22} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />,
  CheckCircle: <CheckCircle size={22} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />,
  Palette: <Palette size={22} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />,
  Printer: <Printer size={22} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />,
  Globe: <Globe size={22} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />,
  TrendingUp: <TrendingUp size={22} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />,
};

export default function ServicesPage() {
  const { data: services, loading } = useServices();
  const { content } = usePageContent("services");

  return (
    <div>
      <SEO title="Services" description="Explore our publishing services — editing, proofreading, cover design, printing, distribution, and marketing." />
      {/* Hero */}
      <section className="relative pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-12 sm:pb-16 md:pb-20 lg:pb-20 bg-neutral-950 text-white">
        <div className="absolute inset-0">
          <SmartImage src={content.hero.background_image} alt="" className="w-full h-full" imgClassName="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 to-neutral-950" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <p className="text-neutral-500 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">{content.hero.eyebrow}</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold mb-3 sm:mb-6">{content.hero.title}</h1>
          <p className="text-neutral-400 text-base sm:text-lg max-w-xl sm:max-w-xl md:max-w-2xl leading-relaxed">{content.hero.subtitle}</p>
        </div>
      </section>

      {/* Services */}
      <section className="py-10 sm:py-12 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          {loading ? (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse grid md:grid-cols-5 gap-5 sm:gap-6 md:gap-8 p-5 sm:p-6 md:p-8 border border-neutral-200 rounded-xl md:rounded-none">
                  <div className="md:col-span-3"><div className="w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 bg-neutral-200 rounded-xl md:rounded-none mb-3" /><div className="h-5 bg-neutral-200 rounded w-1/3 mb-3" /><div className="h-3 bg-neutral-200 rounded w-full mb-1" /><div className="h-3 bg-neutral-200 rounded w-3/4" /></div>
                  <div className="md:col-span-2"><div className="h-3 bg-neutral-200 rounded w-1/3 mb-3" /><div className="space-y-2"><div className="h-3 bg-neutral-200 rounded w-full" /><div className="h-3 bg-neutral-200 rounded w-4/5" /><div className="h-3 bg-neutral-200 rounded w-3/5" /></div></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {services.map((service, i) => (
                <Reveal key={service.id} delay={i * 60}>
                  <div className={`grid md:grid-cols-5 gap-5 sm:gap-6 md:gap-8 p-5 sm:p-6 md:p-8 lg:p-12 border border-neutral-200 hover:border-neutral-400 rounded-xl sm:rounded-xl md:rounded-none transition-all duration-300 hover:shadow-lg hover:shadow-neutral-200/50 ${i % 2 === 1 ? "bg-neutral-50" : ""}`}>
                    <div className="md:col-span-3">
                      <div className="flex items-center gap-3 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 bg-black text-white flex items-center justify-center shrink-0 rounded-xl sm:rounded-xl md:rounded-none transition-transform duration-300 hover:scale-110">{iconMap[service.icon]}</div>
                        <h2 className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">{service.title}</h2>
                      </div>
                      <p className="text-neutral-600 leading-relaxed text-sm sm:text-sm md:text-base">{service.description}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[10px] sm:text-xs md:text-xs text-neutral-400 uppercase tracking-wider mb-3 sm:mb-3 md:mb-4">What's Included</p>
                      <ul className="space-y-2 sm:space-y-2 md:space-y-3">
                        {service.features.map((feature, fi) => (
                          <li key={fi} className="flex items-center gap-2 sm:gap-2 md:gap-3 text-xs sm:text-xs md:text-sm text-neutral-600">
                            <span className="w-1.5 h-1.5 bg-black rounded-full shrink-0" />{feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8 text-center">
          <Reveal>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">{content.cta.heading}</h2>
            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto">{content.cta.body}</p>
            <Link to={content.cta.button_link} className="group inline-flex items-center justify-center gap-2 bg-white text-black px-7 sm:px-8 py-3.5 sm:py-4 text-sm font-medium tracking-wide hover:bg-neutral-200 transition-all duration-300 rounded-xl sm:rounded-xl md:rounded-none active:scale-[0.98]">
              {content.cta.button_text} <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
