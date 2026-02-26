# HPInet-Next Layout Review & Improvement Plan

**Date:** 2026-02-23
**Scope:** UI/UX layout analysis of the `hpinetdb-next` React application
**Reviewer:** Claude Code (Opus 4.6)

---

## 1. Executive Summary

HPInet-Next is a well-structured React 19 + Bootstrap 5 application with a custom design system built on CSS variables. The current layout is functional and visually cohesive with a warm, academic aesthetic (serif headers, earthy tones, teal accents). However, there are several areas where layout improvements would enhance usability, visual hierarchy, information density, and responsiveness.

**Overall strengths:** Consistent design tokens, good component reuse, clean feature-based architecture.
**Key areas for improvement:** Header density, whitespace management, navigation scalability, mobile experience, content hierarchy on data-heavy pages, and footer minimalism.

---

## 2. Current Architecture Overview

| Layer | Implementation |
|-------|---------------|
| Shell | Flex column, `min-height: 100vh`, sticky header + auto-margin footer |
| Header | 2-row: topline (brand/tags/logos) + navbar (centered nav + CTA) |
| Content | `Container fluid="xl"` with page header + card-based sections |
| Cards | Gradient background, 16px radius, 14px shadow |
| Typography | Fraunces (headings), IBM Plex Sans (body) |
| Colors | Teal accent (#0e6a62), warm neutrals (#f1ecdf, #cdbf9e) |

---

## 3. Issue-by-Issue Analysis

### 3.1 Header — Too Tall, Low Information Density

**File:** `src/features/layout/SiteHeader.jsx`, `src/styles/app.css:12-146`

**Problem:** The header occupies ~120-140px of vertical space with two rows (topline + navbar). For a data-intensive scientific tool, this steals valuable viewport from tables and visualizations. The topline row (brand + tags + logos) is mostly decorative.

**Recommendations:**
- **Collapse to single-row header.** Merge the brand mark and navigation into one row. Move the lab/university logos to the footer or an "About" page.
- **Reduce brand copy.** The kicker ("Host-Pathogen Interaction Network"), title ("HPInet"), and subtitle all appear in the header. Keep only the logo + "HPInet" wordmark.
- **Remove `hp-header-tags`** ("Cereal Host-Pathogen", "Interaction Atlas"). These are redundant with the brand subtitle and consume horizontal space.
- **Estimated height savings:** ~50-60px, reclaimed for content.

### 3.2 Navigation — Limited Scalability, Hidden Key Actions

**File:** `src/features/layout/SiteHeader.jsx:43-99`

**Problem:** Navigation is centered with `mx-auto`, pushing the "Start Workflow" CTA to the far right where it's easy to miss. The Species dropdown lists 10 items with scientific names, making it very long.

**Recommendations:**
- **Left-align navigation** for conventional scanning. Place CTA button adjacent to nav items rather than isolated on the right.
- **Add a search icon/shortcut in the navbar** — the `/search` page is buried inside the "Analysis" dropdown, but search is a high-frequency action.
- **Truncate species dropdown** — Show common names only (Wheat, Maize, Barley) with scientific names as tooltips or secondary text, to reduce dropdown height.
- **Add visual separators** between dropdown groups (Species | Analysis | Annotation | Info pages) using a subtle divider.

### 3.3 Page Header — Underutilized for Workflow Context

**File:** `src/shared/ui/PageHeader.jsx`, `src/styles/app.css:148-186`

**Problem:** The `PageHeader` shows title + subtitle but doesn't communicate workflow position. Users navigating Home → Plants → Interactome → Results → Network have no breadcrumb or step indicator.

**Recommendations:**
- **Add breadcrumb navigation** above the page title showing the workflow path (e.g., "Home > Wheat > Interactome > Results").
- **Add a step indicator** for the workflow pages (Plants → Interactome → Results → Network) — a simple 4-step progress bar.
- **Make subtitle more dynamic** — show host/pathogen species names and method in the subtitle on Results and Network pages instead of raw IDs.

### 3.4 Home Page — Hero Section Takes Too Much Vertical Space

**File:** `src/features/home/HomePage.jsx`

**Problem:** The hero card with the description paragraph, 3 pill links, metric strip, and hero image takes up the entire viewport on most screens. The species table (the primary action target) is pushed below the fold.

**Recommendations:**
- **Reduce hero section height.** Make the hero image smaller or move it to a background/overlay position. Reduce `hp-lead-copy` to 2-3 lines.
- **Elevate the Species Launch Board.** Consider a compact species selector (card grid or horizontal scroll) above the fold instead of a full table.
- **Metric strip refinement.** The 4 metrics (10 species, 30+ pathogens, 4 engines, 6 modules) are low-information. Consider moving them inline with the hero text or into the page header subtitle.

### 3.5 Card Layout — Uniform Styling Lacks Content Hierarchy

**File:** `src/styles/app.css:188-199`

**Problem:** Every content section uses the same `hp-card` style — same padding, same border, same shadow. This creates a flat visual hierarchy where the hero card, filter controls, data tables, and detail panels all have equal visual weight.

**Recommendations:**
- **Introduce card variants:**
  - `hp-card-elevated` — Larger shadow, used for primary content (tables, visualizations).
  - `hp-card-flush` — No padding, borderless, for inline controls and filters.
  - `hp-card-subtle` — Reduced shadow/border, for secondary panels (node details on Network page).
- **Differentiate filter bars from content areas.** The Results page filter row (`hp-card mb-3` at line 185) should look like a toolbar, not a card.

### 3.6 Results Page — Dense Table Without Enough Affordances

**File:** `src/features/results/ResultsPage.jsx`

**Problem:**
- The filter is a single text input labeled "Quick filter" with no indication of what fields it searches.
- The category/method display is buried in the subtitle string.
- The "Download CSV" and "Open Network" buttons are in the page header actions area, easily overlooked.
- Pagination is at the bottom only.

**Recommendations:**
- **Add top pagination** as well as bottom (or use a sticky toolbar).
- **Surface active filters** — Show the current method, host, and pathogen as removable chips/badges above the table.
- **Add column-level sorting** to the table headers.
- **Move action buttons** (Download, Open Network) into a sticky toolbar that remains visible during scroll.
- **Add placeholder text** to the filter input: "Filter by protein ID, source, score..."

### 3.7 Network Page — Split Layout Needs Better Proportions

**File:** `src/features/network/NetworkPage.jsx`

**Problem:** The network visualization gets `Col lg={7}` and the detail/table panel gets `Col lg={5}`. The Cytoscape graph is fixed at 620px height within a 660px card. On large screens, this is adequate, but:
- The detail panel stacks 3 cards vertically (search, selection details, table) which can overflow.
- There is no legend for node/edge colors.
- No controls for zoom, layout reset, or export.

**Recommendations:**
- **Add a color legend** below or overlaid on the network graph showing host (teal) vs pathogen (red) node colors and edge source colors.
- **Add graph controls** — Zoom in/out buttons, fit-to-screen, toggle labels, export as PNG/SVG.
- **Make graph height responsive** — Use `calc(100vh - headerHeight - padding)` instead of a fixed 620px.
- **Collapse the detail panel** into a single card with tabs (Search | Selection | Table) instead of 3 separate cards.
- **Consider `Col lg={8}` / `Col lg={4}`** split to give more space to the visualization.

### 3.8 Footer — Outdated and Minimal

**File:** `src/features/layout/SiteFooter.jsx`

**Problem:** Copyright says "2023". The footer has a single centered line. This is an underutilized area.

**Recommendations:**
- **Update copyright to 2024-2026** (or dynamically generate with `new Date().getFullYear()`).
- **Add useful footer links:** GitHub repo, citation info, lab publications, data download links.
- **Add institutional logos** (moved from header) to the footer.
- **Consider a 2-3 column footer layout:** About | Resources | Contact.

### 3.9 Responsive Design — Mobile Needs Work

**File:** `src/styles/app.css:638-703`

**Problem:** While basic responsive rules exist, several issues remain:
- Tables become unreadable on mobile even with Bootstrap's `responsive` wrapper (horizontal scroll is clunky for 7-column tables).
- The Cytoscape network graph at 620px height + the 3-card sidebar stack create excessive page length on mobile.
- The species dropdown with 10 items with scientific names is difficult to navigate on mobile.
- The metric strip's 2-column collapse on mobile still has readability issues.

**Recommendations:**
- **Add a tablet breakpoint** (`@media (max-width: 1199px)`) to adjust the network page split earlier.
- **Card stack table columns on mobile** — Show only Host Protein, Pathogen Protein, and an expand-row button on narrow screens.
- **Network page mobile layout** — Stack graph + table vertically with a shorter graph height (400px) and make the table a collapsible accordion.
- **Test touch targets** — Ensure pill links, annotation links, and table rows meet the 44px minimum touch target size.

### 3.10 Whitespace & Spacing Inconsistencies

**Problem:** Spacing values are inconsistent across the codebase:
- Card padding: `1.2rem 1.25rem` (horizontal ≠ vertical)
- Grid gaps vary: `0.65rem`, `0.8rem`, `1rem`, `0.55rem`
- Margin-bottom on cards: `mb-3` (Bootstrap) and `mb-4` used interchangeably.

**Recommendations:**
- **Standardize a spacing scale** in CSS variables:
  ```css
  --hp-space-xs: 0.25rem;
  --hp-space-sm: 0.5rem;
  --hp-space-md: 1rem;
  --hp-space-lg: 1.5rem;
  --hp-space-xl: 2rem;
  ```
- **Use consistent card gaps.** Pick `1rem` as the standard gap between cards.
- **Equalize card padding.** Use `1.25rem` for both axes.

### 3.11 Accessibility Concerns

**Problem:**
- Color contrast ratios have not been verified for the muted text (`#566665` on `#f1ecdf` background).
- The header tags use a very small font size (`0.7rem` = ~11px), below the recommended 12px minimum.
- No skip-to-content link exists.
- Focus styles use `box-shadow` only, which may not be visible in forced-colors/high-contrast mode.

**Recommendations:**
- **Verify WCAG AA contrast ratios** for all text/background combinations, especially `--hp-muted` on `--hp-bg` and `--hp-paper`.
- **Add `<a href="#main-content" class="visually-hidden-focusable">Skip to content</a>`** at the top of `MainLayout`.
- **Increase minimum font sizes** — Ensure no text is below 12px (0.75rem).
- **Add `outline` alongside `box-shadow`** for focus styles to support high-contrast mode.

### 3.12 Animation & Performance

**File:** `src/styles/app.css:623-636`

**Problem:** The `hp-fade-up` animation runs on every page navigation via `className="hp-fade-up"` on every page section. While subtle, this adds perceived latency on fast navigations and may cause layout shifts.

**Recommendations:**
- **Respect `prefers-reduced-motion`** — Wrap the animation in `@media (prefers-reduced-motion: no-preference)`.
- **Consider removing the fade-up** on data-heavy pages (Results, Network) where speed is critical.
- **Add `will-change: transform, opacity`** to the animated element for GPU optimization.

---

## 4. Priority Matrix

| # | Issue | Impact | Effort | Priority |
|---|-------|--------|--------|----------|
| 3.1 | Header height reduction | High | Medium | **P1** |
| 3.3 | Breadcrumb/workflow indicator | High | Low | **P1** |
| 3.6 | Results page toolbar & filters | High | Medium | **P1** |
| 3.7 | Network page legend & controls | High | Medium | **P1** |
| 3.8 | Footer update (copyright year) | Low | Trivial | **P1** |
| 3.4 | Home page hero reduction | Medium | Low | **P2** |
| 3.5 | Card variant hierarchy | Medium | Low | **P2** |
| 3.10 | Spacing standardization | Medium | Low | **P2** |
| 3.2 | Navigation restructure | Medium | Medium | **P2** |
| 3.9 | Mobile responsive improvements | Medium | High | **P2** |
| 3.11 | Accessibility fixes | High | Medium | **P3** |
| 3.12 | Animation refinement | Low | Trivial | **P3** |

---

## 5. Suggested Implementation Phases

### Phase 1 — Quick Wins (1-2 days)
- Update footer copyright year (dynamic)
- Add `prefers-reduced-motion` media query
- Add skip-to-content link
- Standardize spacing variables in `theme.css`
- Add placeholder text to filter inputs
- Fix card padding symmetry

### Phase 2 — Header & Navigation Overhaul (2-3 days)
- Collapse header to single row
- Move logos to footer
- Left-align navigation
- Add breadcrumb component
- Add workflow step indicator to Plant → Interactome → Results → Network flow

### Phase 3 — Page-Level Improvements (3-5 days)
- Results page: sticky toolbar, top pagination, active filter chips, column sorting
- Network page: color legend, graph controls, responsive height, tabbed sidebar
- Home page: reduce hero height, elevate species selector
- Introduce card variants (elevated, flush, subtle)

### Phase 4 — Mobile & Accessibility Polish (2-3 days)
- Add tablet breakpoint
- Mobile-optimized table views
- Touch target verification
- WCAG contrast audit
- High-contrast mode focus styles

---

## 6. Files That Would Be Modified

| File | Changes |
|------|---------|
| `src/styles/theme.css` | Add spacing scale, adjust color tokens |
| `src/styles/app.css` | Card variants, header collapse, spacing fixes, media queries, animation |
| `src/features/layout/SiteHeader.jsx` | Single-row layout, left-align nav, remove tags |
| `src/features/layout/SiteFooter.jsx` | Dynamic year, multi-column layout, add logos |
| `src/features/layout/MainLayout.jsx` | Add skip link, breadcrumb slot |
| `src/shared/ui/PageHeader.jsx` | Add breadcrumb prop, step indicator |
| `src/shared/ui/Breadcrumb.jsx` | **New** — Reusable breadcrumb component |
| `src/shared/ui/StepIndicator.jsx` | **New** — Workflow progress indicator |
| `src/features/home/HomePage.jsx` | Reduce hero, compact species grid |
| `src/features/results/ResultsPage.jsx` | Sticky toolbar, filter chips, dual pagination |
| `src/features/network/NetworkPage.jsx` | Legend, controls, responsive height, tabbed sidebar |

---

*This report is intended as a starting point for layout improvements. Each recommendation should be validated against actual user behavior and the research team's priorities.*
