/**
 * SEO title + meta description updates for toolPage entries in Contentful.
 * Run: npm run contentful:update-tool-seo
 *
 * Requires .env.local:
 *   CONTENTFUL_SPACE_ID
 *   CONTENTFUL_ENVIRONMENT (default master)
 *   CONTENTFUL_MANAGEMENT_TOKEN
 */
export const TOOL_SEO_UPDATES: Record<
  string,
  { seoTitle: string; metaDescription: string }
> = {
  "percentage-calculator": {
    seoTitle: "Percentage Calculator — Fast & Free | ToolSpotAI",
    metaDescription:
      "Calculate any percentage instantly — find X% of a number, percentage change, or what percent one number is of another. Free, no signup.",
  },
  "emi-calculator": {
    seoTitle: "EMI Calculator — Monthly Loan Payments | ToolSpotAI",
    metaDescription:
      "Calculate your monthly EMI for any loan amount, interest rate, and tenure. See full amortisation schedule instantly. Free, no signup required.",
  },
  "mortgage-calculator": {
    seoTitle: "Mortgage Calculator — Estimate Your Payment | ToolSpotAI",
    metaDescription:
      "Calculate your monthly mortgage payment including principal, interest, taxes, and insurance. Free mortgage calculator with amortisation table.",
  },
  "discount-calculator": {
    seoTitle: "Discount Calculator — Sale Price & Savings | ToolSpotAI",
    metaDescription:
      "Find the sale price after any discount percentage. Calculate savings, original price from sale price, or discount percentage. Free and instant.",
  },
  "compound-interest-calculator": {
    seoTitle: "Compound Interest Calculator — Free Tool | ToolSpotAI",
    metaDescription:
      "Calculate compound interest for any principal, rate, and time period. See year-by-year growth with monthly contribution support. Free, no signup.",
  },
  "salary-calculator": {
    seoTitle: "Salary Calculator — Take-Home Pay Estimator | ToolSpotAI",
    metaDescription:
      "Calculate your take-home pay after tax and deductions. Supports US, UK, and India salary calculations. Free salary calculator, no signup needed.",
  },
  "credit-card-payoff-calculator": {
    seoTitle: "Credit Card Payoff Calculator — Free Tool | ToolSpotAI",
    metaDescription:
      "See how long it takes to pay off your credit card and how much interest you will pay. Compare payoff strategies. Free, no signup required.",
  },
  "profit-margin-calculator": {
    seoTitle: "Profit Margin Calculator — Gross & Net | ToolSpotAI",
    metaDescription:
      "Calculate gross profit margin, net profit margin, and markup percentage for any product or business. Free profit margin calculator.",
  },
  "roi-calculator": {
    seoTitle: "ROI Calculator — Return on Investment Tool | ToolSpotAI",
    metaDescription:
      "Calculate return on investment for any asset, project, or campaign. Includes annualised ROI and net return. Free ROI calculator, no signup.",
  },
  "loan-calculator": {
    seoTitle: "Loan Calculator — Monthly Payments & Interest | ToolSpotAI",
    metaDescription:
      "Calculate monthly loan payments, total interest, and full amortisation schedule for any loan amount and rate. Free loan calculator.",
  },
  "invoice-generator": {
    seoTitle: "Invoice Generator — Free Online Tool | ToolSpotAI",
    metaDescription:
      "Create professional invoices instantly online. Add line items, tax, and client details. Download as PDF. Free invoice generator, no signup.",
  },
  "income-tax-calculator": {
    seoTitle: "Income Tax Calculator — US, UK & India | ToolSpotAI",
    metaDescription:
      "Estimate your income tax liability for the US, UK, or India. Calculate take-home pay after federal, state, and local taxes. Free, no signup.",
  },
  "retirement-calculator": {
    seoTitle: "Retirement Calculator — 401k & Savings | ToolSpotAI",
    metaDescription:
      "Project your retirement savings based on contributions, returns, and timeline. Plan your 401k and pension goals. Free retirement calculator.",
  },
  "insurance-calculator": {
    seoTitle: "Insurance Calculator — Premium Estimator | ToolSpotAI",
    metaDescription:
      "Estimate insurance premiums for life, health, and auto coverage. Understand cost factors before you buy. Free insurance calculator, no signup.",
  },
  "vat-sales-tax-calculator": {
    seoTitle: "VAT Calculator — Add or Remove Tax Instantly | ToolSpotAI",
    metaDescription:
      "Add or remove VAT and sales tax from any price. Supports custom tax rates for any country. Free VAT calculator, no signup required.",
  },
  "debt-to-income-calculator": {
    seoTitle: "DTI Calculator — Debt-to-Income Ratio Tool | ToolSpotAI",
    metaDescription:
      "Calculate your debt-to-income ratio and see how lenders assess your borrowing capacity. Free DTI calculator, no signup required.",
  },
  "loan-comparison-calculator": {
    seoTitle: "Loan Comparison Calculator — Compare Deals | ToolSpotAI",
    metaDescription:
      "Compare two or more loans side by side by monthly payment, total interest, and total cost. Free loan comparison tool, no signup.",
  },
  "auto-loan-calculator": {
    seoTitle: "Auto Loan Calculator — Car Payment Estimator | ToolSpotAI",
    metaDescription:
      "Calculate your monthly car payment, total interest, and full loan schedule for any auto loan. Free car loan calculator, no signup.",
  },
  "paycheck-calculator": {
    seoTitle: "Paycheck Calculator — Net Pay Estimator | ToolSpotAI",
    metaDescription:
      "Calculate your net paycheck after federal and state taxes, Social Security, and Medicare deductions. Free paycheck calculator, no signup.",
  },
  "inflation-calculator": {
    seoTitle: "Inflation Calculator — Purchasing Power Tool | ToolSpotAI",
    metaDescription:
      "Calculate the impact of inflation on purchasing power over any time period. See real value of money over time. Free inflation calculator.",
  },
  "sip-calculator": {
    seoTitle: "SIP Calculator — Systematic Investment Plan | ToolSpotAI",
    metaDescription:
      "Calculate returns on your monthly SIP investments over time. See wealth accumulation with compound growth. Free SIP calculator, no signup.",
  },
  "social-media-ad-roi-calculator": {
    seoTitle: "Ad ROI Calculator — Social Media Returns | ToolSpotAI",
    metaDescription:
      "Calculate return on investment for Facebook, Instagram, and Google ad campaigns. Track ROAS and net profit. Free ad ROI calculator.",
  },
  "crypto-tax-calculator": {
    seoTitle: "Crypto Tax Calculator — Capital Gains Tool | ToolSpotAI",
    metaDescription:
      "Estimate capital gains tax on cryptocurrency trades and sales. Supports short and long-term gains. Free crypto tax calculator, no signup.",
  },
  "student-loan-refinance-calculator": {
    seoTitle: "Student Loan Refinance Calculator | ToolSpotAI",
    metaDescription:
      "See how much you could save by refinancing your student loans at a lower interest rate. Free refinance calculator, no signup required.",
  },
  "business-valuation-calculator": {
    seoTitle: "Business Valuation Calculator — Free Tool | ToolSpotAI",
    metaDescription:
      "Estimate the value of any business using revenue multiples and earnings-based methods. Free business valuation calculator, no signup.",
  },
  "word-counter": {
    seoTitle: "Word Counter — Character & Reading Time Tool | ToolSpotAI",
    metaDescription:
      "Count words, characters, sentences, and paragraphs instantly. See estimated reading time too. Free word counter, no signup required.",
  },
  "case-converter": {
    seoTitle: "Case Converter — Text Formatting Tool | ToolSpotAI",
    metaDescription:
      "Convert text to uppercase, lowercase, title case, sentence case, and more instantly. Free case converter tool, no signup required.",
  },
  "plagiarism-checker": {
    seoTitle: "Text Analysis — Readability & Similarity Tool | ToolSpotAI",
    metaDescription:
      "Analyse text readability, similarity scores, and writing quality instantly. Free text analysis tool for writers and SEO. No signup required.",
  },
  "age-calculator": {
    seoTitle: "Age Calculator — Exact Age in Years & Days | ToolSpotAI",
    metaDescription:
      "Calculate your exact age in years, months, and days from any date of birth. Find days until your next birthday. Free age calculator.",
  },
  "bmi-calculator": {
    seoTitle: "BMI Calculator — Body Mass Index Tool | ToolSpotAI",
    metaDescription:
      "Calculate your BMI instantly and see which category you fall into. Supports metric and imperial units. Free BMI calculator, no signup.",
  },
  "unit-converter": {
    seoTitle: "Unit Converter — Length, Weight & More | ToolSpotAI",
    metaDescription:
      "Convert between metric and imperial units for length, weight, temperature, volume, and more. Free unit converter, no signup required.",
  },
  "date-calculator": {
    seoTitle: "Date Calculator — Days Between Dates | ToolSpotAI",
    metaDescription:
      "Calculate the number of days between two dates or add and subtract days from any date. Free date calculator, no signup required.",
  },
  "tip-calculator": {
    seoTitle: "Tip Calculator — Split Bills Easily | ToolSpotAI",
    metaDescription:
      "Calculate the tip amount and total bill per person for any group size and tip percentage. Free tip calculator, no signup required.",
  },
  "qr-code-generator": {
    seoTitle: "QR Code Generator — Free & Instant | ToolSpotAI",
    metaDescription:
      "Generate a QR code for any URL, text, or contact instantly. Download as PNG. Free QR code generator, no signup required.",
  },
  "currency-converter": {
    seoTitle: "Currency Converter — Live Exchange Rates | ToolSpotAI",
    metaDescription:
      "Convert between 150+ currencies using live exchange rates. Fast and free currency converter, no signup required.",
  },
  "timezone-converter": {
    seoTitle: "Time Zone Converter — World Clock Tool | ToolSpotAI",
    metaDescription:
      "Convert times between any two time zones instantly. Plan meetings across countries. Free time zone converter, no signup required.",
  },
  "fuel-cost-calculator": {
    seoTitle: "Fuel Cost Calculator — Trip & Gas Tool | ToolSpotAI",
    metaDescription:
      "Calculate fuel cost for any trip based on distance, fuel efficiency, and current fuel price. Free gas cost calculator, no signup.",
  },
  "fuel-price-check": {
    seoTitle: "Fuel Price Checker — Current Prices | ToolSpotAI",
    metaDescription:
      "Check current fuel and petrol prices by region. Compare prices and track changes over time. Free fuel price checker, no signup required.",
  },
  "typing-speed-test": {
    seoTitle: "Typing Speed Test — WPM & Accuracy | ToolSpotAI",
    metaDescription:
      "Test your typing speed and accuracy in words per minute. Practice and track improvement over time. Free typing test, no signup required.",
  },
  "json-formatter": {
    seoTitle: "JSON Formatter — Validate & Beautify JSON | ToolSpotAI",
    metaDescription:
      "Format, validate, and beautify JSON instantly in your browser. Minify JSON too. Free JSON formatter and validator, no signup required.",
  },
  "base64-encode-decode": {
    seoTitle: "Base64 Encoder & Decoder — Free Tool | ToolSpotAI",
    metaDescription:
      "Encode any text to Base64 or decode any Base64 string instantly. Free Base64 encoder and decoder, no signup required.",
  },
  "password-generator": {
    seoTitle: "Password Generator — Strong & Secure | ToolSpotAI",
    metaDescription:
      "Generate strong, random passwords with custom length and character sets. Free password generator, no signup, nothing stored.",
  },
  "hash-generator": {
    seoTitle: "Hash Generator — MD5, SHA256 & More | ToolSpotAI",
    metaDescription:
      "Generate MD5, SHA1, SHA256, and SHA512 hashes from any text instantly. Free hash generator tool, no signup required.",
  },
  "color-converter": {
    seoTitle: "Color Converter — HEX, RGB & HSL Tool | ToolSpotAI",
    metaDescription:
      "Convert colors between HEX, RGB, HSL, and CMYK formats instantly. Free color converter and picker, no signup required.",
  },
  "regex-tester": {
    seoTitle: "Regex Tester — Test Regular Expressions | ToolSpotAI",
    metaDescription:
      "Test and debug regular expressions with real-time match highlighting. Free regex tester tool for developers, no signup required.",
  },
  "screen-resolution-calculator": {
    seoTitle: "Screen Resolution Calculator — Aspect Ratio | ToolSpotAI",
    metaDescription:
      "Calculate screen resolution, aspect ratio, and pixel density for any display. Free screen resolution calculator, no signup required.",
  },
  "image-compressor": {
    seoTitle: "Image Compressor — Reduce File Size Free | ToolSpotAI",
    metaDescription:
      "Compress JPG, PNG, and WebP images without losing quality. Reduce file size instantly in your browser. Free image compressor, no signup.",
  },
  "markdown-editor": {
    seoTitle: "Markdown Editor — Live Preview Tool | ToolSpotAI",
    metaDescription:
      "Write and preview Markdown in real time. Export as HTML. Free online Markdown editor, no signup required.",
  },
  "ai-writing-style-checker": {
    seoTitle: "AI Writing Style Checker — Free Tool | ToolSpotAI",
    metaDescription:
      "Check your writing style, tone, and clarity with AI-powered analysis. Free AI writing style checker, no signup required.",
  },
  "image-prompt-builder": {
    seoTitle: "Image Prompt Builder — AI Prompt Tool | ToolSpotAI",
    metaDescription:
      "Build detailed AI image prompts for Midjourney, DALL-E, and Stable Diffusion. Free image prompt builder, no signup required.",
  },
  "gpa-calculator": {
    seoTitle: "GPA Calculator — US 4.0 Scale Tool | ToolSpotAI",
    metaDescription:
      "Calculate your GPA on the US 4.0 scale for any semester or cumulative average. Supports weighted and unweighted GPA. Free, no signup.",
  },
  "scientific-calculator": {
    seoTitle: "Scientific Calculator — Free Online Tool | ToolSpotAI",
    metaDescription:
      "Perform advanced scientific calculations including trigonometry, logarithms, and exponents. Free scientific calculator, no signup required.",
  },
  "calorie-tdee-calculator": {
    seoTitle: "Calorie & TDEE Calculator — Daily Intake | ToolSpotAI",
    metaDescription:
      "Calculate your TDEE and daily calorie needs for weight loss, maintenance, or muscle gain. Free TDEE calculator, no signup required.",
  },
  "pregnancy-calculator": {
    seoTitle: "Pregnancy Calculator — Due Date Estimator | ToolSpotAI",
    metaDescription:
      "Calculate your pregnancy due date, current week, and key milestones from your last period. Free pregnancy calculator, no signup.",
  },
  "period-calculator": {
    seoTitle: "Period Calculator — Cycle Tracker Tool | ToolSpotAI",
    metaDescription:
      "Predict your next period date and track cycle length. Free period calculator and cycle tracker, no signup required.",
  },
  "ovulation-calculator": {
    seoTitle: "Ovulation Calculator — Fertile Window Tool | ToolSpotAI",
    metaDescription:
      "Calculate your ovulation date and fertile window from your last period and cycle length. Free ovulation calculator, no signup.",
  },
  "bmr-calculator": {
    seoTitle: "BMR Calculator — Basal Metabolic Rate Tool | ToolSpotAI",
    metaDescription:
      "Calculate your basal metabolic rate using the Mifflin-St Jeor equation. Find calories burned at rest. Free BMR calculator, no signup.",
  },
  "ideal-weight-calculator": {
    seoTitle: "Ideal Weight Calculator — Healthy Range | ToolSpotAI",
    metaDescription:
      "Calculate your ideal body weight range based on height, age, and sex using multiple formulas. Free ideal weight calculator, no signup.",
  },
  "body-fat-calculator": {
    seoTitle: "Body Fat Calculator — Percentage Estimator | ToolSpotAI",
    metaDescription:
      "Estimate your body fat percentage using the Navy circumference method. Free body fat calculator, no signup required.",
  },
  "macro-calculator": {
    seoTitle: "Macro Calculator — Protein, Carbs & Fat | ToolSpotAI",
    metaDescription:
      "Calculate your daily macronutrient targets for any fitness goal. Free macro calculator for protein, carbs, and fat. No signup required.",
  },
  "baby-name-generator": {
    seoTitle: "Baby Name Generator — Free Name Finder | ToolSpotAI",
    metaDescription:
      "Find the perfect baby name by origin, meaning, and popularity. Browse thousands of names. Free baby name generator, no signup required.",
  },
  "blood-pressure-calculator": {
    seoTitle: "Blood Pressure Calculator — Check Your Range | ToolSpotAI",
    metaDescription:
      "Enter your blood pressure reading and instantly see which category it falls into with guidance. Free blood pressure tool, no signup.",
  },
  "personal-injury-settlement-calculator": {
    seoTitle: "Injury Settlement Calculator — Estimate | ToolSpotAI",
    metaDescription:
      "Estimate a personal injury settlement range based on damages, liability, and injury type. Free calculator — not legal advice, no signup.",
  },
  "divorce-asset-split-calculator": {
    seoTitle: "Divorce Asset Calculator — Split Estimator | ToolSpotAI",
    metaDescription:
      "Estimate how assets may be divided in a divorce based on contributions and jurisdiction. Free tool — not legal advice, no signup required.",
  },
  "car-accident-compensation-calculator": {
    seoTitle: "Car Accident Calculator — Claim Estimator | ToolSpotAI",
    metaDescription:
      "Estimate car accident compensation based on injury severity and damages. Free tool — not legal advice, no signup required.",
  },
};
