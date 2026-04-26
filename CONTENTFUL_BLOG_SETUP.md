# Contentful Blog Setup (Advanced SEO)

This project expects a Contentful content type with ID `blogPost`.

## Required environment variables

Set in local `.env.local` and Vercel:

- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_ENVIRONMENT` (usually `master`)
- `CONTENTFUL_DELIVERY_TOKEN`
- `CONTENTFUL_PREVIEW_TOKEN` (optional for future preview mode)

## Content model: `blogPost`

Create the fields below in Contentful and mark all `required` fields as mandatory.

1. `title` - Short text - **required**
2. `slug` - Short text - **required**, unique
3. `excerpt` - Long text - **required** (150-320 chars recommended)
4. `body` - Rich text - **required**
5. `coverImage` - Media - **required**
6. `publishedAt` - Date & time - **required**
7. `updatedAt` - Date & time - optional
8. `authorName` - Short text - **required**
9. `authorRole` - Short text - optional
10. `tags` - Short text, list - optional
11. `featured` - Boolean - optional
12. `readingMinutes` - Integer - optional

### Advanced SEO fields

13. `seoTitle` - Short text - **required**
14. `seoDescription` - Long text - **required** (120-160 chars recommended)
15. `canonicalUrl` - Short text - optional
16. `seoNoIndex` - Boolean - optional (default false)
17. `focusKeyword` - Short text - **required**
18. `secondaryKeywords` - Short text, list - optional
19. `schemaType` - Short text - **required**
    - allowed values: `Article`, `BlogPosting`, `HowTo`
20. `ogImage` - Media - optional (falls back to `coverImage`)

## Recommended validations

- `slug`: regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- `seoDescription`: max length 160
- `title`: max length 70
- `seoTitle`: max length 70
- `excerpt`: min length 120

## Publishing checklist

- Fill all required SEO fields
- Add at least one internal link in body content
- Use a descriptive cover image alt/description
- Publish the entry (drafts are not shown on production)
