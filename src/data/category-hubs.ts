import type { Tool } from "./tool-model";

export type HubCategoryId = Tool["category"];

export type CategoryHubMeta = {
  id: HubCategoryId;
  path: string;
  h1: string;
  title: string;
  description: string;
  intro: string[];
  whyCluster: string[];
  whoItsFor: string[];
  closing: string;
};

/** Human-written hub copy for topical authority — not template fluff */
export const CATEGORY_HUBS: Record<HubCategoryId, CategoryHubMeta> = {
  finance: {
    id: "finance",
    path: "/tools/finance-calculators",
    h1: "Finance calculators that answer real money questions",
    title: "Finance Calculators — Loans, Tax, Investing & More | ToolSpotAI",
    description:
      "Free finance calculators for mortgages, loans, tax estimates, retirement, crypto, and business—built for people in the US, UK, and EU who want numbers without a sales pitch.",
    intro: [
      "Money decisions rarely come with a pause button. You might be comparing two loan offers after dinner, checking whether refinancing actually saves anything, or trying to ballpark tax before you talk to an accountant. That is where a solid calculator helps: not to replace professional advice, but to give you a clear baseline so you walk into those conversations prepared.",
      "Our finance tools cover the situations people actually search for—EMI and mortgage math, paycheck and tax estimates, compound growth, business margins, VAT, debt ratios, and more. Everything runs in your browser, so you are not uploading bank statements or creating yet another account.",
    ],
    whyCluster: [
      "Search engines tend to reward sites that show depth in a topic, not a single isolated page. By grouping finance tools in one place, you can explore related calculators without hunting through a long list. If you came for a mortgage payment, you might also need a debt-to-income check or a loan comparison—those sit side by side here.",
      "We spell out formulas and assumptions where it matters. Finance is full of “it depends”—rates change, tax rules vary by country, and your bank’s fine print always wins over a website. We are upfront about that, and we still give you a useful number for planning.",
    ],
    whoItsFor: [
      "Homebuyers and renters doing the math on affordability",
      "Freelancers and employees comparing take-home pay across countries",
      "Small business owners pricing products or valuing a side business",
      "Anyone who wants honest estimates before paying for a pro",
    ],
    closing:
      "Pick a tool below, plug in your numbers, and read the short guide under each one—it is written to be readable, not robotic. When the stakes are high (tax, legal, big loans), use these results as a starting point and confirm with a qualified professional.",
  },
  health: {
    id: "health",
    path: "/tools/health-calculators",
    h1: "Health calculators for fitness, pregnancy, and everyday vitals",
    title: "Health Calculators — BMI, Calories, Cycles & More | ToolSpotAI",
    description:
      "Free health and fitness calculators: BMI, BMR, macros, pregnancy timelines, cycle tracking, blood pressure categories, and more. Educational only—not a substitute for medical care.",
    intro: [
      "Most of us are not looking for a diagnosis online—we want a ballpark. How many calories roughly match my activity? Where does my BMI fall on the chart? When might my next period land if my cycle is usually irregular? Good calculators answer those questions in plain language and point you back to real care when something looks off.",
      "These tools use widely cited formulas (like Mifflin–St Jeor for metabolism or standard cycle math for fertility windows). They are not magic, and they cannot see inside your body. What they can do is save you from doing the same arithmetic on a scrap of paper every week.",
    ],
    whyCluster: [
      "Health content online is crowded with hype. We keep the tone practical: here is what the number means, here is when to stop guessing and call a clinician. That matters for trust—especially if you are building a site that hopes to earn from ads without sounding like a pill ad.",
      "If you are pregnant, tracking cycles, or managing weight, you will often need more than one calculator. Linking BMI with calorie targets and ideal-weight ranges is how people actually think about the problem—we reflect that in related tools.",
    ],
    whoItsFor: [
      "People starting a fitness or nutrition plan who need rough calorie and macro targets",
      "Couples tracking pregnancy, ovulation, or due dates",
      "Anyone monitoring blood pressure readings at home between doctor visits",
    ],
    closing:
      "Use these calculators to learn and track trends. If you have symptoms you are worried about, chest pain, very high blood pressure, or anything that feels urgent, skip the web and get medical help.",
  },
  daily: {
    id: "daily",
    path: "/tools/daily-calculators",
    h1: "Daily calculators for time, money on the road, and quick conversions",
    title: "Daily Calculators — Age, Time Zone, Fuel, Currency & More | ToolSpotAI",
    description:
      "Practical everyday calculators: age and dates, time zones, fuel costs, currency, unit conversion, QR codes, typing speed, and more—fast, free, and mobile-friendly.",
    intro: [
      "Not every problem needs a spreadsheet. Sometimes you just need to know how many days between two dates, what time it is in London when it is noon in Chicago, or roughly what a trip will cost in fuel. Daily tools are the small engines that keep errands, travel, and side projects moving.",
      "We bundle the kinds of utilities people bookmark on their phones: quick, reliable, and not buried behind sign-up walls. If you use a tool every week, it should feel obvious—that is the bar we aim for.",
    ],
    whyCluster: [
      "“Daily” sounds generic, but it is actually how most people discover a tool site: they search for one specific need, find a page that works, and come back for another. A hub page like this ties those use cases together so search engines (and humans) see the site as useful for real life, not only for students cramming for exams.",
    ],
    whoItsFor: [
      "Travelers and remote workers juggling time zones",
      "Drivers estimating fuel for road trips",
      "Anyone swapping units or currencies for shopping or homework",
    ],
    closing:
      "Start with what you need today; the list below is updated as we add more everyday utilities.",
  },
  developer: {
    id: "developer",
    path: "/tools/developer-calculators",
    h1: "Developer tools: format, encode, test, and ship faster",
    title: "Developer Tools — JSON, Regex, Markdown, Hash & More | ToolSpotAI",
    description:
      "Free developer utilities: JSON formatter, Base64, hashes, regex tester, color conversion, screen resolution, Markdown editor, image compression, and more—client-side where possible.",
    intro: [
      "If you build for the web, you spend half your life in small utilities: validate this payload, test this regex, grab a hash, tweak a color, shrink an asset. The best tools stay out of the way—fast keyboard paths, no account wall, and clear output you can copy in one click.",
      "Our developer section is intentionally practical. You will not find a bloated IDE here; you will find sharp single-purpose helpers that pair well with your actual editor and deployment flow.",
    ],
    whyCluster: [
      "Developers rarely need one tool in isolation. JSON formatting leads to Base64 for tokens, regex for log parsing, Markdown for READMEs. Clustering these tools signals topical relevance to search engines and saves you from opening ten random tabs with different ad loads.",
    ],
    whoItsFor: [
      "Frontend and backend engineers debugging payloads and configs",
      "Students learning web technologies who need a safe sandbox",
      "Content engineers who live half in Markdown and half in JSON",
    ],
    closing:
      "Pick a tool, keep the tab pinned, and tell us if you want a utility we have not shipped yet—we add based on real demand.",
  },
  education: {
    id: "education",
    path: "/tools/education-calculators",
    h1: "Education tools for grades, science class, and exam season",
    title: "Education Calculators — GPA, Science & Study Helpers | ToolSpotAI",
    description:
      "Free education calculators including GPA tools and scientific calculator—built for students who need correct math and clear results during busy semesters.",
    intro: [
      "Free online education calculators for students at every level. Whether you need to calculate your GPA on the US 4.0 scale, work through scientific equations, or plan your academic goals, these tools give you instant answers in your browser — no signup, no downloads.",
      "From high school grade tracking to college cumulative averages, our education tools are built for accuracy and simplicity. Bookmark this page and come back whenever you need a quick calculation during the school year.",
    ],
    whyCluster: [],
    whoItsFor: [],
    closing: "",
  },
  writing: {
    id: "writing",
    path: "/tools/writing-calculators",
    h1: "Writing tools for counts, cases, and cleaner drafts",
    title: "Writing Tools — Word Count, Case Converter, Text Similarity & More | ToolSpotAI",
    description:
      "Free writing utilities: word and character counts, case conversion, local text similarity and readability analysis, and more—for bloggers, students, and editors who live in deadlines.",
    intro: [
      "Free online writing tools for writers, bloggers, students, and SEO professionals. Count words and characters, check reading time, convert text case, and analyse readability — all instantly in your browser with no signup required.",
      "Whether you are hitting a word count target, formatting text for a platform, or checking the quality and originality of your writing, these tools handle the mechanics so you can focus on the content.",
    ],
    whyCluster: [],
    whoItsFor: [],
    closing: "",
  },
  legal: {
    id: "legal",
    path: "/tools/legal-calculators",
    h1: "Legal planning calculators (estimates only—not legal advice)",
    title: "Legal Calculators — Settlements, Divorce & Accident Estimates | ToolSpotAI",
    description:
      "Free educational calculators for rough settlement ranges, asset splits, and accident compensation estimates. Not legal advice; for discussion with a qualified attorney only.",
    intro: [
      "Free online legal calculators for estimating settlements, asset splits, and compensation claims. These tools give you a rough starting point before consulting a lawyer — helping you understand the numbers involved in personal injury cases, divorce proceedings, and car accident claims.",
      "All results are estimates only and do not constitute legal advice. Always consult a qualified legal professional before making decisions based on any calculation.",
    ],
    whyCluster: [],
    whoItsFor: [],
    closing: "",
  },
};
