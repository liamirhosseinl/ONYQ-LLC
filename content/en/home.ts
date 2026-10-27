/**
 * Homepage copy — original ONYQ text. The section order follows the live reference homepage
 * (see docs/homepage-section-map.md); claims are limited to what the brief confirms.
 */
export const home = {
  meta: {
    title: "ONYQ — websites, apps and AI for business",
    description:
      "ONYQ is a software company registered in Armenia. We design and build websites, online stores, apps, AI assistants and marketing systems for business.",
  },
  hero: {
    chip: "product · ai · content · business",
    registered: "Registered in Armenia",
    title: ["intelligence,", "naturally."],
    lead: "ONYQ designs and builds websites, apps and AI tools for business — from the first sketch to a product people use every day.",
    primary: "Start a brief",
    secondary: "See our work",
    scroll: "Scroll",
    marquee: ["Brand identity", "UX/UI design", "Websites", "Online stores", "Mobile apps", "Telegram bots", "AI assistants", "Video editing", "Reels & Shorts", "Analytics", "SEO", "Ads"],
  },
  work: {
    label: "Selected work",
    title: ["Work we’ve shipped.", "Results you can check."],
    lead: "Brands, platforms and apps ONYQ has designed and built — from the first idea to launch and support.",
    all: "All projects",
    open: "View case",
  },
  stats: {
    label: "In numbers",
    items: [
      { value: 10000, suffix: "+", label: "installs in the first two weeks after launch", source: "Eagle VPN" },
      { value: 80, suffix: "%", label: "of the institute’s tasks simplified, per its written report", source: "English Institute" },
      { value: 25, suffix: "", label: "services under one roof — from logo to AI", source: "ONYQ price list" },
    ],
  },
  story: {
    label: "01 / From spark to product",
    aside: "See the services",
    stages: [
      { key: "idea", tab: "Idea", title: ["Every product", "starts as a sentence."], body: "Every product starts as one sentence: “what if…”. We listen first and write down what your business really wants to change." },
      { key: "research", tab: "Research", title: ["We study", "before we draw."], body: "Customers, competitors and numbers. We find out what people actually need before anyone opens a design tool." },
      { key: "design", tab: "Design", title: ["The idea", "gets a face."], body: "Identity, structure and interface — designed for the phone first and agreed with you before a line of code." },
      { key: "develop", tab: "Develop", title: ["Code, shown", "in working stages."], body: "Clean code on a modern stack, shown in working stages — so you see progress, not promises." },
      { key: "system", tab: "System", title: ["Everything", "talks to everything."], body: "Payments, CRM, bots, analytics and AI wired into one system, so data moves without copy and paste." },
      { key: "product", tab: "Product", title: ["And then", "it’s live."], body: "A product people use every day — measured from the first day and easy to grow." },
    ],
    layers: ["01 / Idea", "02 / System", "03 / Product"],
  },
  capabilities: {
    label: "02 / Four crafts, one team",
    title: ["One team for the whole road,", "from sketch to launch."],
    stages: [
      {
        key: "design",
        tab: "Brand & design",
        title: "A face people remember",
        body: "Identity, interfaces and motion that make a business recognisable and easy to use — on a phone first.",
        tags: ["Identity", "Web design", "UX/UI", "Motion"],
        link: "Explore design",
        href: "/design",
      },
      {
        key: "engineering",
        tab: "Development",
        title: "Systems that hold up",
        body: "Websites, web apps, Telegram bots and integrations on a modern stack — fast, measurable and easy to change.",
        tags: ["Websites", "Web apps", "Telegram", "Integrations"],
        link: "Explore development",
        href: "/development",
      },
      {
        key: "intelligence",
        tab: "AI",
        title: "Less routine for your team",
        body: "AI assistants and automation that work from your own data, with analytics to show what actually changed.",
        tags: ["Assistants", "Automation", "Analytics"],
        link: "Explore AI",
        href: "/ai",
      },
      {
        key: "content",
        tab: "Content",
        title: "Content that holds the thumb",
        body: "Short-form video, editing and content strategy — hooks that land in the first three seconds, with captions, sound and motion built to hold attention.",
        tags: ["Video editing", "Reels & Shorts", "Strategy", "Motion"],
        link: "Explore content",
        href: "/content",
      },
    ],
  },
  process: {
    label: "03 / Working together",
    title: ["Three stages.", "No surprises."],
    stages: [
      {
        key: "brief",
        tab: "Brief",
        title: "A short brief, a clear scope",
        body: "A few questions about the goal, what exists today and how to reach you. From that, ONYQ proposes a scope, a timeline and a price.",
      },
      {
        key: "build",
        tab: "Build",
        title: "Built in visible stages",
        body: "Design is agreed before development starts, and work is shown as it takes shape — so changes happen early, while they are cheap.",
      },
      {
        key: "launch",
        tab: "Launch",
        title: "Launch, then look after it",
        body: "Publishing, analytics and handover, with maintenance available afterwards so the site never stands alone.",
      },
    ],
  },
  value: {
    label: "04 / Why one team costs less",
    title: ["Your budget goes into the product,", "not the hand-offs."],
    lead: "A project costs more than its hours of work. Every hand-off, every re-explained brief and every redo quietly adds to the bill.",
    modes: { separate: "Several vendors", onyq: "ONYQ, end to end" },
    nodes: ["Design", "Development", "Mobile apps", "AI", "Marketing", "Content & video"],
    you: "You",
    captions: {
      separate: "The pieces are yours to connect.",
      onyq: "The pieces arrive connected.",
    },
    rows: [
      { before: "Explain the brief again", after: "One shared context" },
      { before: "Coordinate separate scopes", after: "One plan from sketch to launch" },
      { before: "Rebuild every connection", after: "Integrations planned with the design" },
      { before: "Content made apart from the product", after: "Content built with the brand and the site" },
    ],
    summary: "Less work done twice — more budget left for what your customers need.",
    cta: "Estimate your project",
    disclaimer:
      "A comparison of working models, not a promise of savings. The final cost depends on the scope, requirements and terms of your project.",
    compareHint: "Switch models to compare",
  },
  transformation: {
    label: "05 / Before and after",
    title: "How a website starts bringing customers",
    note: "A study using a fictional store",
    stages: [
      {
        key: "before",
        tab: "Then",
        title: ["The business moved on.", "The site stayed behind."],
        body: "The product is great, but the site is from an earlier chapter: hard to browse on a phone and harder to buy from.",
        points: ["Hard to find", "Hard to buy"],
      },
      {
        key: "after",
        tab: "Now",
        title: ["Same product,", "finally easy to buy."],
        body: "Structure, design and the mobile experience are rethought, so a visitor understands the offer at first glance and orders in a few taps.",
        points: ["Clear offer", "Quick checkout"],
      },
      {
        key: "business",
        tab: "Growth",
        title: ["Now the site", "brings the customers."],
        body: "Search, social and ads bring people in; analytics shows which channel brings orders, so the budget goes where it works.",
        points: ["Traffic → enquiries", "Enquiries → orders"],
      },
    ],
    cta: "Discuss your next chapter",
  },
  origin: {
    label: "Rooted in Armenia",
    word: "Armenia",
    title: ["Based in Armenia.", "Working wherever you sell."],
    body: "ONYQ is a software company registered in Armenia. We build for businesses that sell here and further afield, with sites in English, Russian and Armenian where the audience needs them.",
  },
  principles: {
    label: "How ONYQ works",
    title: "Four habits behind every project.",
    items: [
      {
        title: "One team, one context",
        body: "Design, engineering, AI and marketing are planned together, so nothing gets lost between contractors.",
      },
      {
        title: "Agree before building",
        body: "Structure and design are approved before development starts. Surprises are expensive; decisions are not.",
      },
      {
        title: "Measure from the first day",
        body: "Analytics and goals are part of every launch, so you can see what works instead of guessing.",
      },
      {
        title: "Yours to keep",
        body: "Code, accounts and source files stay with you once the work is paid for.",
      },
    ],
  },
  promise: {
    label: "Your digital side, handled",
    title: ["A better product,", "a budget that makes sense."],
    subtitle: "Your focus stays on the business; the digital side is on us.",
    body: "A website, an app, AI, an internal system or an ad campaign — brought together into one product that customers understand and your team can grow.",
    links: [
      { label: "Brand & design", href: "/design" },
      { label: "Web & applications", href: "/development" },
      { label: "AI & automation", href: "/ai" },
      { label: "Marketing & growth", href: "/marketing" },
    ],
    cta: "Explore your challenge",
  },
};
