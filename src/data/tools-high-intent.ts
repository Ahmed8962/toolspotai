import type { Tool } from "./tool-model";

export const highIntentTools: Tool[] = [
  {
    slug: "personal-injury-settlement-calculator",
    title: "Personal Injury Settlement Calculator",
    shortTitle: "Injury Settlement",
    category: "legal",
    icon: "⚖️",
    description:
      "Rough, educational estimate for special damages and pain-and-suffering multipliers—not legal advice or a prediction of your case.",
    seoTitle: "Personal Injury Settlement Calculator - Free Estimate Tool | ToolSpotAI",
    seoDescription:
      "Free personal injury settlement calculator for rough ranges from medical bills and lost wages. Educational only—not legal advice. US-style estimates.",
    ogDescription:
      "Estimate a rough settlement range from specials and a multiplier. Not legal advice; talk to an attorney.",
    keywords: [
      "personal injury settlement calculator",
      "pain and suffering calculator",
      "settlement estimate",
      "injury claim calculator",
      "car accident settlement estimate",
    ],
    faqs: [
      {
        question: "Is this legal advice?",
        answer:
          "No. This tool is for education and rough math only. Outcomes depend on liability, insurance limits, jurisdiction, and facts a form cannot capture. Always consult a licensed attorney in your state.",
      },
      {
        question: "What is a pain and suffering multiplier?",
        answer:
          "In informal negotiation, some parties multiply economic damages (medical bills plus documented lost wages) by a factor—often discussed between about 1.5 and 5 depending on severity—to approximate general damages. Courts and insurers do not use one universal formula.",
      },
      {
        question: "Why does my number differ from what my lawyer said?",
        answer:
          "Because your lawyer applies facts, evidence, policy limits, and local norms. Online calculators cannot see medical records, comparative fault, or how a jury in your county tends to award.",
      },
      {
        question: "Does this work outside the United States?",
        answer:
          "The interface uses dollar formatting as a default. Legal rules for damages vary widely by country; treat any output as a conversation starter, not a jurisdiction-specific prediction.",
      },
    ],
    content: {
      whatIs: `A personal injury settlement calculator is something people reach for when they are shaken, bills are stacking up, and they want a sense of scale before they even know which questions to ask a lawyer. It does not decide fault, read your medical records, or know what the other side’s policy limit is. What it can do is translate a few hard numbers—medical expenses and lost wages you can document—into a rough illustration of how some negotiators think about “general” damages on top of those “special” damages.

We are careful with language on purpose. Settlement talks are messy. Two people with similar injuries can end up with very different outcomes because of evidence, state law, insurance coverage, and timing. If you use this page, use it to organize your thoughts and to prepare for a consultation, not to skip one.`,

      howItWorks: `You enter medical bills (the part often called special damages for out-of-pocket treatment), lost wages you can actually support with documentation, and a multiplier band that stands in for the highly subjective pain-and-suffering component. The tool adds your economic base, then applies the multiplier to that base to produce an illustrative total, plus a wide band around it to remind you that real life is not a single number.

We do not ask for names, case numbers, or uploads. Nothing here leaves your browser for the math itself—though like any website, normal server logs may still apply depending on how we host the page.`,

      formula: `Economic base = Medical bills + Documented lost wages
General damages (illustrative) = Economic base × Multiplier
Illustrative total = Economic base + General damages
Negotiation band (shown as a range around the illustrative total) = heuristic only`,

      formulaExplanation: `This is a teaching pattern sometimes discussed in negotiation textbooks, not a rule of law. Multipliers vary by severity of injury, clarity of liability, permanence of symptoms, and whether future medical care is likely. Insurers may use different models entirely. Treat the multiplier slider as a way to explore scenarios—low, medium, and high—not as a verdict.`,

      example: `Medical bills: $25,000. Lost wages: $8,000. Economic base = $33,000. If you move the multiplier to 2.5× for discussion purposes, the illustrative general-damages layer is $82,500, for a rough combined illustration around $115,500 before any deductions for fault, liens, or attorney fees—each of which changes what you actually take home.`,

      tips: [
        "Bring records, not guesses—unsupported wage claims get challenged fast.",
        "Ask your attorney about liens from health insurers or Medicare before you mentally spend a number.",
        "Policy limits cap recovery even when the math “says” more on paper.",
        "Pain is real; the law still wants proof—consistency in treatment matters.",
      ],
      useCases: [
        "Getting a ballpark before a free consultation with a personal injury firm",
        "Comparing two multiplier scenarios side by side",
        "Explaining to a family member why “pain and suffering” is not arbitrary",
      ],
    },
    relatedSlugs: ["car-accident-compensation-calculator", "divorce-asset-split-calculator", "insurance-calculator"],
    popular: true,
  },
  {
    slug: "divorce-asset-split-calculator",
    title: "Divorce Asset Split Calculator",
    shortTitle: "Divorce Split",
    category: "legal",
    icon: "⚖️",
    description:
      "Split a simple net marital pool by percentage—math only, not legal advice about what counts as marital property.",
    seoTitle: "Divorce Asset Split Calculator - Free Property Estimate | ToolSpotAI",
    seoDescription:
      "Free divorce asset split calculator. Estimate each party’s share of a net marital estate by percentage. Educational—not legal advice.",
    ogDescription: "Simple percentage split of net assets minus debts—use with a lawyer for real cases.",
    keywords: [
      "divorce asset calculator",
      "property division calculator",
      "marital assets split",
      "divorce financial calculator",
    ],
    faqs: [
      {
        question: "Does this decide who keeps the house?",
        answer:
          "No. It only divides a single net number by percentage. Who keeps which asset, how to handle retirement accounts, tax on sale, and separate property claims need legal advice.",
      },
      {
        question: "What about debts?",
        answer:
          "You can subtract marital debts from total assets to get a net figure. Joint vs. individual debt still depends on state law and your facts.",
      },
      {
        question: "Is a 50/50 split guaranteed?",
        answer:
          "Not everywhere. Some states aim for equitable distribution instead of equal. This tool lets you model percentages your counsel discusses with you.",
      },
    ],
    content: {
      whatIs: `Divorce finance is emotionally loud but, at some point, it still comes down to lists: what you own together, what you owe together, and how a settlement or court might allocate net value. This calculator does one narrow job well: it takes a rough total for marital assets, subtracts a rough total for marital debts, and applies a percentage split between two parties so you can see two net outcomes.

It does not know your prenup, inheritance, business goodwill, or whether the house is truly a marital asset in your state. Think of it as a whiteboard for “if the net pool were X and we agreed on a Y/Z split, what does each side walk away with on paper?”`,

      howItWorks: `Enter dollar amounts as honestly as you can for now. Subtract debts from assets to form a net estate. Move the slider to reflect the share one side might receive under a deal you are discussing—sometimes 50/50, sometimes not. The other side fills in automatically. If your numbers change after discovery, come back and rerun it.`,

      formula: `Net marital estate = Total marital assets − Total marital debts
Party A net = Net × (A% / 100)
Party B net = Net × (B% / 100)`,

      formulaExplanation: `This is arithmetic, not equity law. Courts can adjust for dissipation of assets, unequal earning capacity, custody-related housing needs, and more. The split percentage here is something you choose to model—not something the tool “knows” is fair.`,

      example: `Assets $420,000; debts $68,000; net $352,000. At 52% to Party A, Party A’s notional share is $183,040 and Party B’s is $168,960. How you actually fund that—cash, sale of home, offset with retirement—still requires professional drafting.`,

      tips: [
        "Update numbers after appraisals and account statements—guesses early are fine, precision matters before you sign.",
        "Retirement splits may need a QDRO—this tool does not model tax or penalties.",
        "Student loans can be surprisingly contentious; confirm characterization with counsel.",
      ],
      useCases: [
        "Mediation prep when both sides share a net pool estimate",
        "Translating a percentage offer into dollar terms you can feel",
      ],
    },
    relatedSlugs: ["personal-injury-settlement-calculator", "percentage-calculator", "loan-calculator"],
    popular: true,
  },
  {
    slug: "car-accident-compensation-calculator",
    title: "Car Accident Compensation Calculator",
    shortTitle: "Accident Claim",
    category: "legal",
    icon: "🚗",
    description:
      "Blend property damage with rough general-damages bands on economic losses—illustrative only, not an insurer’s offer.",
    seoTitle: "Car Accident Compensation Calculator - Free Estimate | ToolSpotAI",
    seoDescription:
      "Free car accident compensation estimate from property damage, medical bills, and wage loss. Educational only—not legal advice or a claim value guarantee.",
    ogDescription: "Rough illustration for vehicle damage plus injury-related economic and general damages.",
    keywords: [
      "car accident compensation calculator",
      "auto accident claim estimate",
      "whiplash settlement calculator",
      "vehicle accident damages",
    ],
    faqs: [
      {
        question: "Will the insurance company match this number?",
        answer:
          "Unlikely to match exactly. Carriers evaluate liability, coverage, policy limits, and documentation. This page is not connected to any insurer.",
      },
      {
        question: "What if I was partly at fault?",
        answer:
          "Comparative fault rules reduce recovery depending on your state. This tool does not apply a fault percentage—you should discuss that with an attorney.",
      },
    ],
    content: {
      whatIs: `After a crash, people want two different kinds of clarity: how much the car repair or replacement might run, and what kind of number might eventually sit on the table for injury-related harms when documentation exists. This calculator keeps those ideas separate enough to be honest—property damage is often more concrete, while injury components vary wildly by facts.

We add a deliberately coarse “severity band” that nudges a general-damages style layer on top of medical and wage specials. It is not a medical model and not a legal verdict. It is a structured way to think about why two crashes with the same sheet metal bill can still settle differently once people are hurt.`,

      howItWorks: `Enter vehicle or property damage as a dollar line item. Add medical expenses you treat as tied to the incident and lost wages you can document. Pick a severity band that roughly matches how heavy treatment was—this only adjusts a multiplier-style layer on the economic injury stack, then sums with property damage for a single illustrative total.`,

      formula: `Economic injury stack = Medical + Lost wages
General layer (illustrative) = Economic injury stack × Band factor
Illustrative total = Property damage + Economic injury stack + General layer`,

      formulaExplanation: `Band factors are stand-ins for conversation, not biology. Real claims involve imaging, permanence, future care, and credibility. Use bands to compare scenarios, not to predict a jury.`,

      example: `Property $4,500; medical $12,000; wages $3,500; moderate band. You will see property separated from the injury stack, then a general layer added before a combined illustration—still not a payout promise.`,

      tips: [
        "Photos, police report, and timely treatment notes matter more than a big number on a website.",
        "Rental car and diminished value claims may be separate—ask your adjuster or lawyer.",
      ],
      useCases: [
        "Understanding why property damage and injury value diverge",
        "Preparing questions before speaking with counsel",
      ],
    },
    relatedSlugs: ["personal-injury-settlement-calculator", "insurance-calculator", "auto-loan-calculator"],
    popular: true,
  },
  {
    slug: "ai-writing-style-checker",
    title: "AI Writing Style Checker",
    shortTitle: "Style Check",
    category: "developer",
    icon: "✨",
    description:
      "Lightweight heuristics on sentence length, word variety, and a few overused patterns—editing help, not a courtroom AI detector.",
    seoTitle: "AI Writing Style Checker - Free Text Analysis | ToolSpotAI",
    seoDescription:
      "Free writing style checker: sentence stats, word variety, and buzzword flags. Heuristic editing aid—not a definitive AI detector.",
    ogDescription: "Improve drafts with simple readability-style signals. Not a model-based detector.",
    keywords: [
      "ai writing checker",
      "writing style analyzer",
      "text readability tool",
      "edit ai generated text",
    ],
    faqs: [
      {
        question: "Can this prove a student used AI?",
        answer:
          "No. It does not inspect model internals or compare against a database of AI text. It applies simple statistics and pattern counts humans also use when line-editing.",
      },
      {
        question: "Why did my human writing score oddly?",
        answer:
          "Because jargon-heavy or highly uniform professional writing can look “smooth” to naive heuristics. Use judgment.",
      },
    ],
    content: {
      whatIs: `Everyone wants a magic button that labels text “human” or “machine.” Outside specialized labs and productized APIs with their own limits, most sites should not pretend. What we offer instead is closer to what a careful editor does on a first pass: look at whether sentences all sound the same length, whether vocabulary repeats a little too cleanly, and whether a few tired filler phrases show up too often.

That can help you revise drafts so they sound more like you—not because the score is gospel, but because the stats point at where readers might tune out.`,

      howItWorks: `Paste text. We tokenize words roughly, estimate sentences, compute average length, a simple uniqueness ratio, count a handful of passive-voice-shaped patterns, and flag a short list of buzzwords that show up in bland marketing copy. The score blends those signals into a single number for convenience. It is not calibrated like a standardized test—think “directionally useful,” not “forensic.”`,

      formula: `Score = clamp( base + f(diversity, sentence length) − g(passive, buzzwords) , 0, 100 ) — illustrative weighting`,

      formulaExplanation: `Weights favor diverse vocabulary and varied pacing, and nudge down uniform, passive, buzzword-heavy prose. You can disagree with the score and still use the breakdown lines to edit.`,

      example: `A short email might score higher than a dense legal memo—not because the memo is AI, but because the memo’s uniformity looks similar to naive measures. Context always wins.`,

      tips: [
        "Read aloud: if you stumble, the reader will too.",
        "Swap a few generic adjectives for concrete nouns and verbs.",
        "Break up strings of medium-length sentences with a short one.",
      ],
      useCases: [
        "Bloggers tightening drafts before publish",
        "Students learning editing skills—not cheating policies",
      ],
    },
    relatedSlugs: ["word-counter", "plagiarism-checker", "case-converter", "hash-generator"],
    popular: true,
  },
  {
    slug: "image-prompt-builder",
    title: "Image Prompt Builder",
    shortTitle: "Prompt Builder",
    category: "developer",
    icon: "🎨",
    description:
      "Assemble clear prompts for image models from subject, style, lighting, mood, and aspect ratio—no upload required.",
    seoTitle: "Image Prompt Builder - Midjourney & DALL-E Style Prompts | ToolSpotAI",
    seoDescription:
      "Free image prompt builder for AI art tools. Combine subject, style, lighting, mood, and aspect ratio—copy a ready-to-paste prompt.",
    ogDescription: "Build structured prompts for image generators—subject, style, lighting, mood.",
    keywords: [
      "midjourney prompt generator",
      "dalle prompt builder",
      "ai image prompt",
      "stable diffusion prompt",
    ],
    faqs: [
      {
        question: "Does this generate images?",
        answer:
          "No—it only builds text prompts you can paste into your favorite image tool that you already use and pay for according to its terms.",
      },
      {
        question: "Why separate lighting and mood?",
        answer:
          "Image models respond well to layered cues; splitting them helps you reuse blocks that work across subjects.",
      },
    ],
    content: {
      whatIs: `A good prompt is not magic—it is specific nouns, adjectives that actually modify those nouns, constraints like aspect ratio, and a style anchor so the model knows which visual world you mean. This builder collects those pieces in one place so you are not rewriting the same scaffolding every time you start a new idea.

It is especially handy when you are learning: you can see how swapping “soft studio” for “neon night” changes the string before you spend credits in an image tool.`,

      howItWorks: `Fill in the scene, pick a broad style, choose lighting and mood, set an aspect ratio hint, and add any hard constraints like “no text in frame.” We concatenate intelligently and keep a copy button handy. Nothing uploads; it is just string building in your browser.`,

      formula: `Prompt string = f(subject, style, lighting, mood, ratio, constraints)`,

      formulaExplanation: `Order matters less than completeness—models read the whole string—but we put subject first so you can scan your intent quickly.`,

      example: `Subject: “rain-soaked alley in Osaka.” Style: “film still.” Lighting: “neon night.” Mood: “moody.” Ratio: “21:9.” Constraints: “no text, high detail.” Paste into your tool and iterate from there.`,

      tips: [
        "Name the camera feel you want—film grain vs. crisp digital—if your model supports it.",
        "If hands or faces fail, add “simple pose” or reduce clutter in the scene.",
      ],
      useCases: [
        "Storyboarders exploring visual directions quickly",
        "Marketers drafting ad concepts before a photoshoot",
      ],
    },
    relatedSlugs: ["color-converter", "screen-resolution-calculator", "image-compressor"],
    popular: true,
  },
  {
    slug: "social-media-ad-roi-calculator",
    title: "Social Media Ad ROI Calculator",
    shortTitle: "Ad ROI",
    category: "finance",
    icon: "📣",
    description:
      "Compute ROAS, ROI percent, and optional CPA from spend, attributed revenue, and conversions.",
    seoTitle: "Social Media Ad ROI Calculator - ROAS & CPA Free | ToolSpotAI",
    seoDescription:
      "Free social media ad ROI calculator. Compute ROAS, ROI, and cost per conversion from spend and attributed revenue.",
    ogDescription: "Measure ROAS and ROI from paid social campaigns—simple inputs, clear outputs.",
    keywords: [
      "social media roi calculator",
      "roas calculator",
      "facebook ads roi",
      "paid social calculator",
    ],
    faqs: [
      {
        question: "What revenue should I use?",
        answer:
          "The revenue you can fairly tie to the campaign window you paid for—often from your ad platform plus checkout analytics, knowing attribution is imperfect.",
      },
      {
        question: "Is ROAS the same as ROI?",
        answer:
          "ROAS is revenue divided by ad spend. ROI here is percent return on the spend itself. They answer related but different questions.",
      },
    ],
    content: {
      whatIs: `Marketing math should not require a spreadsheet every time someone asks “was Meta worth it this month?” Return on ad spend (ROAS) and return on investment (ROI) are the basic lenses—one is a ratio people quote in meetings, the other translates into percent gain or loss on dollars risked. Cost per conversion adds another lens when your funnel is volume-based.

This calculator keeps the definitions visible so you do not mix up numerator and denominator when you are in a hurry.`,

      howItWorks: `Plug in total spend for the period, revenue you are willing to attribute to that spend, and optionally conversions if you want a back-of-envelope CPA. We compute ROAS as revenue over spend, ROI as profit over spend in percent terms, and CPA as spend divided by conversions when you gave a conversion count.`,

      formula: `ROAS = Revenue ÷ Ad spend
ROI % = ((Revenue − Ad spend) ÷ Ad spend) × 100
CPA = Ad spend ÷ Conversions (if conversions > 0)`,

      formulaExplanation: `These formulas assume revenue and spend line up to the same time window and attribution story. If your business has long sales cycles, your marketing team may track blended models instead—still useful as a starting point.`,

      example: `Spend $5,000; attributed revenue $18,500; 142 purchases. ROAS ≈ 3.7×, ROI ≈ 270% on spend, CPA ≈ $35.21 per purchase—then ask whether margin supports that CPA.`,

      tips: [
        "Separate brand vs. prospecting when you can—they behave differently.",
        "Watch incrementality tests when someone demands “prove it.”",
      ],
      useCases: [
        "Monthly paid social retros for lean teams",
        "Agency slide decks that need clean definitions",
      ],
    },
    relatedSlugs: ["roi-calculator", "profit-margin-calculator", "vat-sales-tax-calculator"],
    popular: true,
  },
  {
    slug: "crypto-tax-calculator",
    title: "Crypto Tax Estimator",
    shortTitle: "Crypto Tax",
    category: "finance",
    icon: "₿",
    description:
      "Rough reserve estimate on taxable crypto gains by region preset—never a substitute for a tax professional.",
    seoTitle: "Crypto Tax Calculator - Free Gain Estimate (US/UK/EU) | ToolSpotAI",
    seoDescription:
      "Free crypto tax estimator for rough tax reserves on gains. US, UK, EU presets—illustrative only. Not tax advice.",
    ogDescription: "Estimate a rough tax reserve on crypto gains—education only.",
    keywords: [
      "crypto tax calculator",
      "bitcoin tax calculator",
      "capital gains crypto",
      "crypto tax uk",
      "crypto tax usa",
    ],
    faqs: [
      {
        question: "Is staking or lending included?",
        answer:
          "Not specifically. Treatment varies by country and year. This tool only multiplies a gain you supply by a rough effective rate.",
      },
      {
        question: "Why can I override the rate?",
        answer:
          "Because your actual bracket, holding period, and offsets change the answer. Overrides let you mirror what your accountant modeled.",
      },
    ],
    content: {
      whatIs: `Crypto taxes are a moving target: how cost basis is tracked, whether losses offset gains, and how staking rewards are classified can all change the picture. What many people actually want in the moment is simpler—if I realize this much gain, about how much should I not touch because taxes might eat it? This estimator is for that kind of envelope math, not for filing.

We offer broad region presets with blunt disclaimers. Your country may treat short- and long-term gains differently; we do not know your income, your other gains, or your carryforwards.`,

      howItWorks: `Enter the gain amount you believe is taxable after basis. Pick a region preset for a very rough rate, or type your own effective percentage if you already got guidance. We multiply to show a reserve-style tax estimate and what might be left after that reserve—still illustrative.`,

      formula: `Estimated tax ≈ Taxable gain × Effective rate
After-tax ≈ Taxable gain − Estimated tax`,

      formulaExplanation: `Effective rate is where real life hides—progressive brackets, NIIT, state taxes, and foreign exchange quirks all matter. This stays intentionally naive so you do not confuse it with a return.`,

      example: `If you type a $12,000 net taxable gain and a 22% illustrative effective rate, the reserve shown is $2,640—money you might segregate until your CPA finalizes the year.`,

      tips: [
        "Track basis as you go—retroactive reconstruction is expensive.",
        "Stablecoins are not magically tax-free; trades can still be events.",
      ],
      useCases: [
        "Quarterly estimated tax planning conversations",
        "Deciding whether to realize gains before year-end",
      ],
    },
    relatedSlugs: ["income-tax-calculator", "vat-sales-tax-calculator", "percentage-calculator"],
    popular: true,
  },
  {
    slug: "student-loan-refinance-calculator",
    title: "Student Loan Refinance Calculator",
    shortTitle: "Refinance",
    category: "finance",
    icon: "🎓",
    description:
      "Compare monthly payment and total interest when you refinance federal or private loans—numbers only, not lender offers.",
    seoTitle: "Student Loan Refinance Calculator - Payment Compare | ToolSpotAI",
    seoDescription:
      "Free student loan refinance calculator. Compare monthly payment and interest before and after refinancing. Illustrative—not a lender offer.",
    ogDescription: "See payment and total interest differences when you refinance student loans.",
    keywords: [
      "student loan refinance calculator",
      "refinance student loans payment",
      "student loan interest calculator",
    ],
    faqs: [
      {
        question: "Will I lose federal protections?",
        answer:
          "Refinancing federal loans into a private loan can forfeit income-driven plans and certain forgiveness paths. Research carefully before you switch.",
      },
      {
        question: "Why is my total interest higher with a lower rate?",
        answer:
          "Stretching the term lowers monthly payments but can increase lifetime interest. Compare both payment and total cost.",
      },
    ],
    content: {
      whatIs: `Refinancing chatter always leads with the monthly payment because that is what hits the budget—but the lifetime interest line matters just as much, especially if someone quietly resets you to a longer term. This calculator shows payment and total interest side by side using standard amortization math so you can see trade-offs in one place.

It does not pull live rates from lenders. You type what you are actually offered or what you are modeling.`,

      howItWorks: `Enter your current balance, annual rate, and months left on your existing loan. Then enter the new rate and the new term you are considering. We compute payments with a standard fixed-rate installment formula and compare totals.`,

      formula: `Monthly payment = P × r × (1+r)^n / ((1+r)^n − 1)
where r is monthly rate and n is months`,

      formulaExplanation: `Same reducing-balance logic as other loan tools on the site. If your loan has variable rates or fees, those belong in a spreadsheet with your exact promissory note.`,

      example: `Balance $38,000 at 6.8% with 120 months left might refinance to 5.1% for 120 months—monthly payment falls, but if you instead stretch to 180 months at the lower rate, check total interest before you sign.`,

      tips: [
        "Get quotes in writing; APR includes some fees, nominal rate does not.",
        "Autopay discounts can stack—ask.",
      ],
      useCases: [
        "Comparing two refinance quotes on total cost, not just monthly payment",
      ],
    },
    relatedSlugs: ["loan-calculator", "loan-comparison-calculator", "emi-calculator"],
    popular: true,
  },
  {
    slug: "business-valuation-calculator",
    title: "Business Valuation Calculator",
    shortTitle: "Biz Value",
    category: "finance",
    icon: "📈",
    description:
      "SDE times a multiple—rough small-business ballpark, not a formal appraisal.",
    seoTitle: "Business Valuation Calculator - SDE Multiple Estimate | ToolSpotAI",
    seoDescription:
      "Free small business valuation calculator using SDE × multiple ranges. Rough ballpark—not a formal appraisal or broker opinion.",
    ogDescription: "Estimate a rough business value from SDE and a multiple—education only.",
    keywords: [
      "business valuation calculator",
      "sde multiple calculator",
      "small business value estimate",
    ],
    faqs: [
      {
        question: "What is SDE?",
        answer:
          "Seller’s discretionary earnings—roughly profit plus owner salary and discretionary expenses buyers normalize. Your accountant may define it slightly differently.",
      },
      {
        question: "Why a range?",
        answer:
          "Because the same SDE can trade at different multiples depending on industry, growth, concentration risk, and transferability.",
      },
    ],
    content: {
      whatIs: `When someone says “two times SDE,” they are compressing a mountain of diligence into one headline. For Main Street deals, multiples are still a useful shorthand—as long as nobody confuses shorthand for an appraisal. This tool multiplies your SDE input by a band around a middle multiple so you can see how sensitive value is to small changes in buyer appetite.

It does not model balance sheet items, working capital needs, or earnouts. It is a napkin, not a fairness opinion.`,

      howItWorks: `Type an annual SDE figure you and your advisor believe is defensible. Slide a multiple typical for your rough industry bucket—often discussed between about 2× and 4× for many small services businesses, higher for some software-like recurring models, lower for heavy-owner-dependent shops. We show low, mid, and high around your midpoint multiple.`,

      formula: `Indicative value ≈ SDE × Multiple
Range shown ≈ SDE × (Multiple ± 0.5) — illustrative`,

      formulaExplanation: `The ±0.5 band is only to visualize sensitivity, not a statistical confidence interval. Real buyers discount for customer concentration, legal risk, and capex needs.`,

      example: `SDE $185,000 at a 3.0× mid implies about $555,000 at the midpoint, with a wider band around that if you nudge the multiple slider.`,

      tips: [
        "Normalize financials for three years when possible—buyers hate surprises in year two.",
        "Document processes so the business is not “only you.”",
      ],
      useCases: [
        "Owners wondering whether a broker’s range passes the smell test",
      ],
    },
    relatedSlugs: ["profit-margin-calculator", "roi-calculator", "invoice-generator"],
    popular: true,
  },
];
