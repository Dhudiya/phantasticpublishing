import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Heart, Shield, Users } from "lucide-react";
import { useTeamMembers } from "../hooks/useData";
import { usePageContent } from "../hooks/usePageContent";
import Reveal from "../components/RevealSection";
import SmartImage from "../components/SmartImage";
import SEO from "../components/SEO";

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />,
  Heart: <Heart size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />,
  Shield: <Shield size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />,
  Users: <Users size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />,
};

export default function AboutPage() {
  const { data: teamMembers, loading: teamLoading } = useTeamMembers();
  const { content } = usePageContent("about");

  return (
    <div>
      <SEO title="About Us" description="Learn about Phantastic Publishing — our story, mission, vision, and the team dedicated to bringing bold literary voices to life." />
      {/* Hero */}
      <section className="relative pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-12 sm:pb-16 md:pb-20 lg:pb-28 bg-neutral-950 text-white">
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

      {/* Company Story */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-14 lg:gap-16 items-center">
            <Reveal>
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">{content.story.heading}</h2>
                {content.story.paragraphs.map((p, i) => (
                  <p key={i} className="text-neutral-600 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">{p}</p>
                ))}
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                <SmartImage src={content.story.image_1} alt="Books" className="aspect-[3/4] rounded-lg sm:rounded-lg md:rounded-none" imgClassName="w-full h-full object-cover" />
                <SmartImage src={content.story.image_2} alt="Reading" className="aspect-[3/4] mt-4 sm:mt-6 md:mt-8 rounded-lg sm:rounded-lg md:rounded-none" imgClassName="w-full h-full object-cover" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            <Reveal>
              <div className="p-5 sm:p-6 md:p-10 bg-white rounded-xl sm:rounded-xl md:rounded-none transition-all duration-300 hover:shadow-lg hover:shadow-neutral-200/50">
                <p className="text-neutral-400 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">{content.mission_vision.mission.eyebrow}</p>
                <h3 className="font-serif text-2xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">{content.mission_vision.mission.heading}</h3>
                <p className="text-neutral-600 leading-relaxed text-sm sm:text-base">{content.mission_vision.mission.body}</p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="p-5 sm:p-6 md:p-10 bg-white rounded-xl sm:rounded-xl md:rounded-none transition-all duration-300 hover:shadow-lg hover:shadow-neutral-200/50">
                <p className="text-neutral-400 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">{content.mission_vision.vision.eyebrow}</p>
                <h3 className="font-serif text-2xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">{content.mission_vision.vision.heading}</h3>
                <p className="text-neutral-600 leading-relaxed text-sm sm:text-base">{content.mission_vision.vision.body}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <Reveal>
            <div className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-16">
              <p className="text-neutral-400 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">{content.why_choose.eyebrow}</p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold">{content.why_choose.heading}</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {content.why_choose.items.map((item, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="text-center p-3 sm:p-4 md:p-6">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 bg-neutral-100 rounded-xl sm:rounded-xl md:rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-5 transition-transform duration-300 hover:scale-110">{iconMap[item.icon] ?? <BookOpen size={18} />}</div>
                  <h3 className="font-serif text-xs sm:text-sm md:text-lg font-bold mb-1 sm:mb-2 md:mb-3 line-clamp-2">{item.title}</h3>
                  <p className="text-neutral-500 text-[11px] sm:text-xs md:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32 bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <Reveal>
            <div className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-16">
              <p className="text-neutral-500 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">{content.team.eyebrow}</p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold">{content.team.heading}</h2>
            </div>
          </Reveal>
          {teamLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse text-center">
                  <div className="aspect-square bg-neutral-800 rounded-lg md:rounded-none mb-3 sm:mb-4" />
                  <div className="h-4 bg-neutral-800 rounded w-2/3 mx-auto mb-1" />
                  <div className="h-3 bg-neutral-800 rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {teamMembers.map((member, i) => (
                <Reveal key={member.id} delay={i * 80}>
                  <div className="group text-center">
                    <SmartImage src={member.photo} alt={member.name} className="aspect-square mb-3 sm:mb-4 md:mb-5 rounded-lg sm:rounded-lg md:rounded-none" imgClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <h3 className="font-serif text-sm sm:text-base md:text-lg font-bold line-clamp-1">{member.name}</h3>
                    <p className="text-[11px] sm:text-xs md:text-sm text-neutral-500 mb-1.5 sm:mb-2 md:mb-3">{member.role}</p>
                    <p className="text-[10px] sm:text-[11px] md:text-xs text-neutral-400 leading-relaxed line-clamp-3 md:line-clamp-none">{member.bio}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8 text-center">
          <Reveal>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">{content.cta.heading}</h2>
            <p className="text-neutral-500 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto">{content.cta.body}</p>
            <Link to={content.cta.button_link} className="group inline-flex items-center justify-center gap-2 bg-black text-white px-7 sm:px-8 py-3.5 sm:py-4 text-sm font-medium tracking-wide hover:bg-neutral-800 transition-all duration-300 rounded-xl sm:rounded-xl md:rounded-none hover:shadow-lg hover:shadow-neutral-400/30">
              {content.cta.button_text} <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
