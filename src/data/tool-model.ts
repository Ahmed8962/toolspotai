export type FAQItem = {
  question: string
  answer: string
}

export type Tool = {
  slug: string
  title: string
  shortTitle: string
  category: 'finance' | 'writing' | 'daily' | 'developer' | 'education' | 'health' | 'legal'
  icon: string
  description: string
  seoTitle: string
  seoDescription: string
  ogDescription: string
  keywords: string[]
  faqs: FAQItem[]
  content: {
    whatIs: string
    howItWorks: string
    formula: string
    formulaExplanation: string
    example: string
    tips: string[]
    useCases: string[]
  }
  relatedSlugs: string[]
  popular: boolean
}
