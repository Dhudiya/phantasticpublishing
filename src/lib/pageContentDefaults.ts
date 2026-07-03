// Default content for each public page. The frontend merges DB content over
// these defaults so the site renders even before any admin content is saved.

export interface HomeContent {
  hero: {
    eyebrow: string;
    title_line_1: string;
    title_line_2: string;
    subtitle: string;
    background_image: string;
    cta_primary_text: string;
    cta_primary_link: string;
    cta_secondary_text: string;
    cta_secondary_link: string;
  };
  featured_books: {
    eyebrow: string;
    heading: string;
    view_all_text: string;
    view_all_link: string;
  };
  about_intro: {
    eyebrow: string;
    heading: string;
    paragraphs: string[];
    link_text: string;
    link_url: string;
    image: string;
    stat_value: string;
    stat_label: string;
  };
  services_overview: {
    eyebrow: string;
    heading: string;
    subtitle: string;
    view_all_text: string;
    view_all_link: string;
  };
  featured_authors: {
    eyebrow: string;
    heading: string;
    view_all_text: string;
    view_all_link: string;
  };
  testimonials: {
    eyebrow: string;
    heading: string;
  };
  cta: {
    heading: string;
    body: string;
    button_text: string;
    button_link: string;
  };
}

export interface AboutContent {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    background_image: string;
  };
  story: {
    heading: string;
    paragraphs: string[];
    image_1: string;
    image_2: string;
  };
  mission_vision: {
    mission: { eyebrow: string; heading: string; body: string };
    vision: { eyebrow: string; heading: string; body: string };
  };
  why_choose: {
    eyebrow: string;
    heading: string;
    items: { icon: string; title: string; desc: string }[];
  };
  team: {
    eyebrow: string;
    heading: string;
  };
  cta: {
    heading: string;
    body: string;
    button_text: string;
    button_link: string;
  };
}

export interface BooksContent {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    background_image: string;
  };
}

export interface AuthorsContent {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    background_image: string;
  };
}

export interface ServicesContent {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    background_image: string;
  };
  cta: {
    heading: string;
    body: string;
    button_text: string;
    button_link: string;
  };
}

export interface ContactContent {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    background_image: string;
  };
  cards: {
    general: { heading: string; body: string; email: string };
    careers: { heading: string; body: string; email: string };
    submissions: { heading: string; body: string; email: string };
    business: { heading: string; body: string };
  };
  departments: { icon: string; label: string; email: string }[];
  closing: string;
}

export type PageContentMap = {
  home: HomeContent;
  about: AboutContent;
  books: BooksContent;
  authors: AuthorsContent;
  services: ServicesContent;
  contact: ContactContent;
};

export const PAGE_SLUGS = ["home", "about", "books", "authors", "services", "contact"] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export const PAGE_LABELS: Record<PageSlug, string> = {
  home: "Home",
  about: "About",
  books: "Books",
  authors: "Authors",
  services: "Services",
  contact: "Contact",
};

export const homeContentDefaults: HomeContent = {
  hero: {
    eyebrow: "Est. 2015",
    title_line_1: "Bringing Stories",
    title_line_2: "to Life",
    subtitle:
      "We champion bold, original voices and craft books that endure. From manuscript to bookshelf, we bring your story into the world with care, precision, and passion.",
    background_image:
      "https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=1920",
    cta_primary_text: "Explore Our Books",
    cta_primary_link: "/books",
    cta_secondary_text: "Submit a Manuscript",
    cta_secondary_link: "/contact",
  },
  featured_books: {
    eyebrow: "Featured",
    heading: "Our Latest Releases",
    view_all_text: "View All Books",
    view_all_link: "/books",
  },
  about_intro: {
    eyebrow: "Who We Are",
    heading: "A Publishing House Built on Passion",
    paragraphs: [
      "Phantastic Publishing was founded in 2015 with a simple conviction: that extraordinary stories deserve extraordinary care. We are an independent publishing house dedicated to discovering and nurturing bold literary voices across every genre.",
      "From the first spark of an idea to a beautifully bound book in a reader's hands, we pour the same passion and precision into every project. We believe that publishing is not just a business — it's a craft, and a calling.",
    ],
    link_text: "Learn More About Us",
    link_url: "/about",
    image:
      "https://images.pexels.com/photos/2589802/pexels-photo-2589802.jpeg?auto=compress&cs=tinysrgb&w=800",
    stat_value: "10+",
    stat_label: "Years of Excellence",
  },
  services_overview: {
    eyebrow: "What We Offer",
    heading: "End-to-End Publishing Services",
    subtitle: "Every step of the journey, handled with expertise and care.",
    view_all_text: "View All Services",
    view_all_link: "/services",
  },
  featured_authors: {
    eyebrow: "Our Writers",
    heading: "Featured Authors",
    view_all_text: "All Authors",
    view_all_link: "/authors",
  },
  testimonials: {
    eyebrow: "Voices",
    heading: "What They Say",
  },
  cta: {
    heading: "Have a Manuscript?",
    body: "We're always looking for extraordinary stories. If you have a manuscript that's ready for the world, we'd love to hear from you.",
    button_text: "Submit Your Manuscript",
    button_link: "/contact",
  },
};

export const aboutContentDefaults: AboutContent = {
  hero: {
    eyebrow: "Our Story",
    title: "About Phantastic",
    subtitle: "A decade of championing bold voices and crafting books that endure.",
    background_image:
      "https://images.pexels.com/photos/1112568/pexels-photo-1112568.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
  story: {
    heading: "Our Story",
    paragraphs: [
      "Phantastic Publishing was born in 2015 from a simple frustration: too many extraordinary manuscripts were being overlooked by an industry obsessed with trends. Our founder, Victoria Ashford, left a senior role at a major publishing house to create something different — a place where quality always comes first, where authors are partners, and where every book receives the care it deserves.",
      "What started as a one-woman operation in a Brooklyn apartment has grown into a team of passionate readers, editors, designers, and marketers who share a single conviction: that the right book, in the right hands, can change a life.",
      "Ten years later, we've published over 200 titles, launched the careers of dozens of debut authors, and built a community of readers who trust the Phantastic name as a mark of quality.",
    ],
    image_1:
      "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=600",
    image_2:
      "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  mission_vision: {
    mission: {
      eyebrow: "Our Mission",
      heading: "To Discover and Amplify Extraordinary Voices",
      body: "We exist to find stories that matter and bring them to readers with the highest possible quality — in writing, design, and production.",
    },
    vision: {
      eyebrow: "Our Vision",
      heading: "A World Where Great Stories Always Find Their Readers",
      body: "We envision a publishing landscape where quality is the only currency that matters — where bold, original work is celebrated.",
    },
  },
  why_choose: {
    eyebrow: "Why Phantastic",
    heading: "Why Authors Choose Us",
    items: [
      { icon: "BookOpen", title: "Author-First Approach", desc: "You retain creative control. We guide, never override." },
      { icon: "Heart", title: "Passionate Team", desc: "Every team member reads your manuscript before we sign." },
      { icon: "Shield", title: "Quality Without Compromise", desc: "Every element receives meticulous attention to detail." },
      { icon: "Users", title: "Community of Readers", desc: "Our loyal readership trusts our name as a mark of quality." },
    ],
  },
  team: {
    eyebrow: "The People",
    heading: "Our Team",
  },
  cta: {
    heading: "Join Our Story",
    body: "Whether you're an author with a manuscript or a reader looking for your next great book, we'd love to hear from you.",
    button_text: "Get in Touch",
    button_link: "/contact",
  },
};

export const booksContentDefaults: BooksContent = {
  hero: {
    eyebrow: "Our Collection",
    title: "Books",
    subtitle: "Explore our catalog of extraordinary stories across every genre.",
    background_image:
      "https://images.pexels.com/photos/2041540/pexels-photo-2041540.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
};

export const authorsContentDefaults: AuthorsContent = {
  hero: {
    eyebrow: "Our Writers",
    title: "Authors",
    subtitle: "Meet the extraordinary voices behind our books.",
    background_image:
      "https://images.pexels.com/photos/261909/pexels-photo-261909.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
};

export const servicesContentDefaults: ServicesContent = {
  hero: {
    eyebrow: "What We Do",
    title: "Services",
    subtitle:
      "End-to-end publishing services designed to bring your story from manuscript to reader with care and expertise.",
    background_image:
      "https://images.pexels.com/photos/326333/pexels-photo-326333.jpeg?auto=compress&cs=tinysrgb&w=1920",
  },
  cta: {
    heading: "Ready to Publish?",
    body: "Whether you need a single service or the full publishing journey, we're here to help. Let's discuss your project.",
    button_text: "Get Started",
    button_link: "/contact",
  },
};

export const contactContentDefaults: ContactContent = {
  hero: {
    eyebrow: "Reach Out",
    title: "Contact Us",
    subtitle:
      "At Phantastic Publishing, we are always looking for new content, creative ideas, and exciting opportunities to collaborate.",
    background_image:
      "https://images.pexels.com/photos/7108/writing-notes-idea-conference.jpg?auto=compress&cs=tinysrgb&w=1920",
  },
  cards: {
    general: {
      heading: "General Enquiries",
      body: "For general questions or information:",
      email: "contact@phantasticpub.com",
    },
    careers: {
      heading: "Careers",
      body: "Interested in joining our team? Reach out at:",
      email: "careers@phantasticpub.com",
    },
    submissions: {
      heading: "Submissions",
      body: "Have a manuscript, proposal, or idea to share? Send it to:",
      email: "submissions@phantasticpub.com",
    },
    business: {
      heading: "Business & Publishing",
      body: "For business-related discussions, partnerships, or publishing opportunities, please contact the relevant department below.",
    },
  },
  departments: [
    { icon: "Scale", label: "Copyright & Licensing", email: "rights@phantasticpub.com" },
    { icon: "PenTool", label: "Editorial", email: "editorial@phantasticpub.com" },
  ],
  closing: "We look forward to hearing from you.",
};

export const pageContentDefaults: PageContentMap = {
  home: homeContentDefaults,
  about: aboutContentDefaults,
  books: booksContentDefaults,
  authors: authorsContentDefaults,
  services: servicesContentDefaults,
  contact: contactContentDefaults,
};

// Deep merge DB content over defaults so missing keys fall back gracefully.
export function mergeContent<T>(defaults: T, override: Partial<T> | undefined): T {
  if (!override) return defaults;
  if (typeof defaults !== "object" || defaults === null || Array.isArray(defaults)) {
    return (override as T) ?? defaults;
  }
  const result: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const key of Object.keys(override as Record<string, unknown>)) {
    const dv = (defaults as Record<string, unknown>)[key];
    const ov = (override as Record<string, unknown>)[key];
    if (dv && typeof dv === "object" && !Array.isArray(dv) && ov && typeof ov === "object" && !Array.isArray(ov)) {
      result[key] = mergeContent(dv, ov as Partial<typeof dv>);
    } else if (Array.isArray(dv) && Array.isArray(ov)) {
      result[key] = ov;
    } else if (ov !== undefined && ov !== null) {
      result[key] = ov;
    } else {
      result[key] = dv;
    }
  }
  return result as T;
}
