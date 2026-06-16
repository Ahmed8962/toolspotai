/** Strip inline FAQ section from blog body (FAQs belong in the `faqs` field only). */
export function stripFaqSectionFromBody(body: string): string {
  const faqHeading = /^## Frequently asked questions\s*$/im;
  const relatedHeading = /^## Related tools on ToolSpotAI\s*$/im;

  const faqMatch = body.match(faqHeading);
  if (!faqMatch || faqMatch.index === undefined) {
    return body.trim();
  }

  const afterFaq = body.slice(faqMatch.index + faqMatch[0].length);
  const relatedMatch = afterFaq.match(relatedHeading);

  if (relatedMatch && relatedMatch.index !== undefined) {
    const beforeFaq = body.slice(0, faqMatch.index).trimEnd();
    const relatedOn = afterFaq.slice(relatedMatch.index).trimStart();
    return `${beforeFaq}\n\n${relatedOn}`.trim();
  }

  return body.slice(0, faqMatch.index).trim();
}

export function sanitizeEmDash(text: string): string {
  return text.replace(/\u2014/g, " - ").replace(/\u2013/g, " - ");
}

export function prepareBlogBody(body: string): string {
  return sanitizeEmDash(stripFaqSectionFromBody(body));
}
