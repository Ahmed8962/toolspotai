import ToolLayout from "@/components/tools/ToolLayout";
import { getRelatedTools, getToolBySlug, tools } from "@/data/tools";
import {
  contentfulToolCanonical,
  getAllContentfulToolUrlSlugs,
  getPageSeoForTool,
  getToolPageByUrlSlug,
  isContentfulConfiguredForTools,
  mergeToolWithContentful,
  resolveToolForPage,
} from "@/lib/contentful-tool";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateOrganizationSchema,
  generateToolMetadata,
  generateToolMetadataFromCms,
  generateWebAppSchema,
  getCategoryHubPath,
  getCategoryLabel,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import {
  buildToolMetaDescription,
  buildToolPageOnPageSeo,
  getPrimaryKeywordPhrase,
  getSeoSecondaryList,
  toolCanonicalUrl,
} from "@/lib/tool-page-seo";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

const PercentageCalculator = dynamic(() => import("@/components/calculators/PercentageCalculator"));
const AgeCalculator = dynamic(() => import("@/components/calculators/AgeCalculator"));
const EMICalculator = dynamic(() => import("@/components/calculators/EMICalculator"));
const MortgageCalculator = dynamic(() => import("@/components/calculators/MortgageCalculator"));
const CompoundInterestCalculator = dynamic(() => import("@/components/calculators/CompoundInterestCalculator"));
const SalaryCalculator = dynamic(() => import("@/components/calculators/SalaryCalculator"));
const CreditCardPayoffCalculator = dynamic(() => import("@/components/calculators/CreditCardPayoffCalculator"));
const WordCounter = dynamic(() => import("@/components/calculators/WordCounter"));
const DiscountCalculator = dynamic(() => import("@/components/calculators/DiscountCalculator"));
const BMICalculator = dynamic(() => import("@/components/calculators/BMICalculator"));
const JsonFormatter = dynamic(() => import("@/components/tools/JsonFormatter"));
const Base64Encoder = dynamic(() => import("@/components/tools/Base64Encoder"));
const UnitConverter = dynamic(() => import("@/components/tools/UnitConverter"));
const PasswordGenerator = dynamic(() => import("@/components/tools/PasswordGenerator"));
const ProfitMarginCalculator = dynamic(() => import("@/components/calculators/ProfitMarginCalculator"));
const DateCalculator = dynamic(() => import("@/components/calculators/DateCalculator"));
const ROICalculator = dynamic(() => import("@/components/calculators/ROICalculator"));
const TipCalculator = dynamic(() => import("@/components/calculators/TipCalculator"));
const GPACalculator = dynamic(() => import("@/components/calculators/GPACalculator"));
const HashGenerator = dynamic(() => import("@/components/tools/HashGenerator"));
const CaseConverter = dynamic(() => import("@/components/tools/CaseConverter"));
const ColorConverter = dynamic(() => import("@/components/tools/ColorConverter"));
const LoanCalculator = dynamic(() => import("@/components/calculators/LoanCalculator"));
const QRCodeGenerator = dynamic(() => import("@/components/tools/QRCodeGenerator"));
const RegexTester = dynamic(() => import("@/components/tools/RegexTester"));
const InvoiceGenerator = dynamic(() => import("@/components/tools/InvoiceGenerator"));
const IncomeTaxCalculator = dynamic(() => import("@/components/calculators/IncomeTaxCalculator"));
const CalorieTDEECalculator = dynamic(() => import("@/components/calculators/CalorieTDEECalculator"));
const RetirementCalculator = dynamic(() => import("@/components/calculators/RetirementCalculator"));
const InsuranceCalculator = dynamic(() => import("@/components/calculators/InsuranceCalculator"));
const VATCalculator = dynamic(() => import("@/components/calculators/VATCalculator"));
const DTICalculator = dynamic(() => import("@/components/calculators/DTICalculator"));
const CurrencyConverter = dynamic(() => import("@/components/calculators/CurrencyConverter"));
const PregnancyCalculator = dynamic(() => import("@/components/calculators/PregnancyCalculator"));
const TimezoneConverter = dynamic(() => import("@/components/tools/TimezoneConverter"));
const FuelCostCalculator = dynamic(() => import("@/components/calculators/FuelCostCalculator"));
const FuelPriceCheck = dynamic(() => import("@/components/tools/FuelPriceCheck"));
const ScientificCalculator = dynamic(() => import("@/components/tools/ScientificCalculator"));
const TypingSpeedTest = dynamic(() => import("@/components/tools/TypingSpeedTest"));
const PlagiarismChecker = dynamic(() => import("@/components/tools/PlagiarismChecker"));
const ScreenResolutionCalculator = dynamic(() => import("@/components/calculators/ScreenResolutionCalculator"));
const LoanComparisonCalculator = dynamic(() => import("@/components/calculators/LoanComparisonCalculator"));
const PeriodCalculator = dynamic(() => import("@/components/calculators/PeriodCalculator"));
const OvulationCalculator = dynamic(() => import("@/components/calculators/OvulationCalculator"));
const BMRCalculator = dynamic(() => import("@/components/calculators/BMRCalculator"));
const IdealWeightCalculator = dynamic(() => import("@/components/calculators/IdealWeightCalculator"));
const AutoLoanCalculator = dynamic(() => import("@/components/calculators/AutoLoanCalculator"));
const PaycheckCalculator = dynamic(() => import("@/components/calculators/PaycheckCalculator"));
const BodyFatCalculator = dynamic(() => import("@/components/calculators/BodyFatCalculator"));
const MacroCalculator = dynamic(() => import("@/components/calculators/MacroCalculator"));
const InflationCalculator = dynamic(() => import("@/components/calculators/InflationCalculator"));
const BabyNameGenerator = dynamic(() => import("@/components/tools/BabyNameGenerator"));
const SIPCalculator = dynamic(() => import("@/components/calculators/SIPCalculator"));
const ImageCompressor = dynamic(() => import("@/components/tools/ImageCompressor"));
const MarkdownEditor = dynamic(() => import("@/components/tools/MarkdownEditor"));
const BloodPressureCalculator = dynamic(() => import("@/components/calculators/BloodPressureCalculator"));
const PersonalInjurySettlementCalculator = dynamic(() => import("@/components/calculators/PersonalInjurySettlementCalculator"));
const DivorceAssetSplitCalculator = dynamic(() => import("@/components/calculators/DivorceAssetSplitCalculator"));
const CarAccidentCompensationCalculator = dynamic(() => import("@/components/calculators/CarAccidentCompensationCalculator"));
const AiWritingStyleChecker = dynamic(() => import("@/components/tools/AiWritingStyleChecker"));
const ImagePromptBuilder = dynamic(() => import("@/components/tools/ImagePromptBuilder"));
const SocialMediaAdRoiCalculator = dynamic(() => import("@/components/calculators/SocialMediaAdRoiCalculator"));
const CryptoTaxCalculator = dynamic(() => import("@/components/calculators/CryptoTaxCalculator"));
const StudentLoanRefinanceCalculator = dynamic(() => import("@/components/calculators/StudentLoanRefinanceCalculator"));
const BusinessValuationCalculator = dynamic(() => import("@/components/calculators/BusinessValuationCalculator"));
const TOOL_MAP: Record<string, React.ComponentType> = {
  "percentage-calculator": PercentageCalculator,
  "age-calculator": AgeCalculator,
  "emi-calculator": EMICalculator,
  "mortgage-calculator": MortgageCalculator,
  "compound-interest-calculator": CompoundInterestCalculator,
  "salary-calculator": SalaryCalculator,
  "credit-card-payoff-calculator": CreditCardPayoffCalculator,
  "word-counter": WordCounter,
  "discount-calculator": DiscountCalculator,
  "bmi-calculator": BMICalculator,
  "json-formatter": JsonFormatter,
  "base64-encode-decode": Base64Encoder,
  "unit-converter": UnitConverter,
  "password-generator": PasswordGenerator,
  "profit-margin-calculator": ProfitMarginCalculator,
  "date-calculator": DateCalculator,
  "roi-calculator": ROICalculator,
  "tip-calculator": TipCalculator,
  "gpa-calculator": GPACalculator,
  "hash-generator": HashGenerator,
  "case-converter": CaseConverter,
  "color-converter": ColorConverter,
  "loan-calculator": LoanCalculator,
  "qr-code-generator": QRCodeGenerator,
  "regex-tester": RegexTester,
  "invoice-generator": InvoiceGenerator,
  "income-tax-calculator": IncomeTaxCalculator,
  "calorie-tdee-calculator": CalorieTDEECalculator,
  "retirement-calculator": RetirementCalculator,
  "insurance-calculator": InsuranceCalculator,
  "vat-sales-tax-calculator": VATCalculator,
  "debt-to-income-calculator": DTICalculator,
  "currency-converter": CurrencyConverter,
  "pregnancy-calculator": PregnancyCalculator,
  "timezone-converter": TimezoneConverter,
  "fuel-cost-calculator": FuelCostCalculator,
  "fuel-price-check": FuelPriceCheck,
  "scientific-calculator": ScientificCalculator,
  "typing-speed-test": TypingSpeedTest,
  "plagiarism-checker": PlagiarismChecker,
  "screen-resolution-calculator": ScreenResolutionCalculator,
  "loan-comparison-calculator": LoanComparisonCalculator,
  "period-calculator": PeriodCalculator,
  "ovulation-calculator": OvulationCalculator,
  "bmr-calculator": BMRCalculator,
  "ideal-weight-calculator": IdealWeightCalculator,
  "auto-loan-calculator": AutoLoanCalculator,
  "paycheck-calculator": PaycheckCalculator,
  "body-fat-calculator": BodyFatCalculator,
  "macro-calculator": MacroCalculator,
  "inflation-calculator": InflationCalculator,
  "baby-name-generator": BabyNameGenerator,
  "sip-calculator": SIPCalculator,
  "image-compressor": ImageCompressor,
  "markdown-editor": MarkdownEditor,
  "blood-pressure-calculator": BloodPressureCalculator,
  "personal-injury-settlement-calculator": PersonalInjurySettlementCalculator,
  "divorce-asset-split-calculator": DivorceAssetSplitCalculator,
  "car-accident-compensation-calculator": CarAccidentCompensationCalculator,
  "ai-writing-style-checker": AiWritingStyleChecker,
  "image-prompt-builder": ImagePromptBuilder,
  "social-media-ad-roi-calculator": SocialMediaAdRoiCalculator,
  "crypto-tax-calculator": CryptoTaxCalculator,
  "student-loan-refinance-calculator": StudentLoanRefinanceCalculator,
  "business-valuation-calculator": BusinessValuationCalculator,
};

export async function generateStaticParams() {
  const fromCode = tools.map((t) => t.slug);
  if (!isContentfulConfiguredForTools()) {
    return fromCode.map((slug) => ({ slug }));
  }
  try {
    const fromCf = await getAllContentfulToolUrlSlugs();
    if (fromCf.length === 0) {
      return fromCode.map((slug) => ({ slug }));
    }
    return [...new Set([...fromCode, ...fromCf])].map((slug) => ({ slug }));
  } catch {
    return fromCode.map((slug) => ({ slug }));
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let cf: Awaited<ReturnType<typeof getToolPageByUrlSlug>> = null;
  try {
    if (isContentfulConfiguredForTools()) {
      cf = await getToolPageByUrlSlug(slug);
    }
  } catch {
    cf = null;
  }
  if (cf) {
    const base = resolveToolForPage(slug, cf);
    if (!base) return {};
    const merged = mergeToolWithContentful(base, cf);
    const { canonical } = contentfulToolCanonical(cf);
    return generateToolMetadataFromCms(merged, canonical, {
      noIndex: Boolean(cf.payload.seoNoIndex),
    });
  }
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  return generateToolMetadata(tool);
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let cf: Awaited<ReturnType<typeof getToolPageByUrlSlug>> = null;
  try {
    if (isContentfulConfiguredForTools()) {
      cf = await getToolPageByUrlSlug(slug);
    }
  } catch {
    cf = null;
  }
  const base = resolveToolForPage(slug, cf);
  if (!base) notFound();

  const ToolComponent = TOOL_MAP[base.slug];
  if (!ToolComponent) notFound();

  const tool = cf ? mergeToolWithContentful(base, cf) : base;
  const related = getRelatedTools(base.slug, base.relatedSlugs);

  const faqLd = generateFAQSchema(tool.faqs);
  const { canonical: toolUrl } = cf
    ? contentfulToolCanonical(cf)
    : { canonical: toolCanonicalUrl(tool.slug) };
  const breadcrumbLd = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    {
      name: getCategoryLabel(tool.category),
      url: `${SITE_URL}${getCategoryHubPath(tool.category)}`,
    },
    { name: tool.title, url: toolUrl },
  ]);
  const primary = getPrimaryKeywordPhrase(tool);
  const richDescription = cf
    ? tool.seoDescription
    : buildToolMetaDescription(
        tool,
        primary,
        getSeoSecondaryList(tool).slice(0, 8),
      );
  const webAppLd = generateWebAppSchema({ ...tool, slug: tool.slug, seoDescription: richDescription });
  const orgLd = generateOrganizationSchema();
  const pageSeo = getPageSeoForTool(base, cf ?? undefined);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <div className="bg-surface-page">
        <ToolLayout
          tool={tool}
          related={related}
          pageSeo={{
            h1Text: pageSeo.h1Text,
            intro: pageSeo.intro,
            howToUseSteps: pageSeo.howToUseSteps,
          }}
        >
          <ToolComponent />
        </ToolLayout>
      </div>
    </>
  );
}
