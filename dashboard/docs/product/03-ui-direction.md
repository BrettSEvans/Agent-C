# UI Direction — Agent-C Dashboard

> The product's look, feel, taste, and voice. Written by the UI agent from
> 02-ux-workflow.md. Read by the architect next. Product type: Web app (local-first, single-page). Date: 2026-06-27

## 1. Design concept & personality

**Industrial precision dashboard with a calm, focused aesthetic.**

The central concept is **cold brushed steel** — engineered, tactile, purposeful. Every pixel serves a function; nothing is decorative. The feel is **calm but alert** — like a control room where critical information is always visible and decisions are made quickly. The taste is **minimal, functional, precise** — no excess, no noise, no decoration. The dashboard feels like a tool you trust to be fast and clear.

---

## 2. Visual / presentational tone

**Dark mode with hand-buffed brushed steel texture.**

- **Color palette:** Variations of dark greys (#0a0a0a, #0f1817, #151515, #1a1a1a, transitioning to #1a1a1a at bottom) with steel-blue accents (#1f5f7f for badges, buttons)
- **Typography:** Space Grotesk (geometric sans-serif) at 13-14px for body, increased weights (600-700) for headings. Letter-spacing increased slightly for precision.
- **Transitions:** Smooth 0.15s ease on hover/interaction states. No jarring or instant changes.
- **Texture:** Both sidebar and main content area have an organic, hand-buffed brushed steel texture overlay:
  - Fine, overlapping brushstrokes at multiple angles (18°, -22°, 82°) using tight 0.5-1.2px patterns
  - Radial gradients scattered across the surface with varying grey tones (light, mid, dark) to simulate natural wear and buffing marks
  - Creates depth and tactility without being visually loud
- **No decoration:** No gradients (except the intentional grey progression), no glassmorphism, no animated blobs, no emoji, no cute icons

---

## 3. Key element styling

### Sidebar (left pane)
- **Background:** Brushed steel gradient (135°, #1a2a2f → #0f1817 → #1a2a2f) with hand-buffed texture overlay
- **Visual separation:** Distinct from main pane; acts as a visual anchor
- **Search box:** Subtle dark background (#0a0a0a) with thin border (#333), minimal styling
- **Project items:** 13px font, 12px vertical padding, hover state adds subtle background (#1a1a1a), active state has left border (2px #4a9eba)
- **Section labels:** 11px uppercase, letter-spaced, muted color (#666)
- **Timestamps:** 10px, secondary color (#666)
- **Badges:** 10px, steel-blue background (#1f5f7f), light text (#a0d8f0), rounded 2px

### Right pane (product detail)
- **Background:** Dark grey with organic grey-tone brushed texture, progressing from darker (#0a0a0a) at top to lighter (#1a1a1a) at bottom
- **Current stage (LARGE):** 
  - Steel-blue badge (#1f5f7f), 18px font, 600 weight, padding 12px 20px
  - Dominates visually at the top of the detail view
  - Below it: brief description of what the stage entails (warm, conversational copy)
- **Status & revisions:** Subtle cards (#1a1a1a background, 1px #333 border) with labels and values stacked vertically
- **Git state:** Simple rows (13px), left-aligned label, right-aligned value (monospace for commits/timestamps)
- **Features list:** Clickable cards (#1a1a1a, 1px #333 border), hover state adds slight background lift (#1f1f1f) and border brightening (#444)

### Buttons & actions
- **"Open in orchestrator":** Steel-blue background (#1f5f7f), light text (#a0d8f0), 1px border (#2a7fa0), 13px uppercase, 12-20px padding
- **Hover:** Darker blue (#2a7fa0) background with brighter border (#3a9fc0)
- **No rounded corners on buttons** — use 4px for subtle, not trendy

### States
- **Loading:** "⏳ Loading..." or "⏳ Computing git status..." in secondary text color (#999)
- **Fresh/cached git state:** Checkmark or status indicator, timestamp in small text
- **Approval needed:** Warning indicator, clear call-to-action ("Click to open orchestrator")
- **Error:** Red/orange text (if needed), clear explanation in warm tone

---

## 4. Voice & tone

**Warm, conversational, and precise.**

Copy is direct but human:
- ✓ "You have 3 uncommitted changes — ready to commit?"
- ✓ "Approved, ready for next stage"
- ✗ "3 uncommitted changes" (too bare)
- ✗ "You currently have 3 files that have not been staged for commit" (too wordy)

System messages are brief and guide without lecturing:
- ✓ "Computing git status..." (shows work in progress)
- ✓ "Project path not found — use orchestrator to repoint"
- ✗ "An error occurred" (too vague)

The tone reflects the industrial aesthetic (precise, professional) but with warmth (human, approachable). Developers feel guided, not ignored.

---

## 5. References & anti-references

**Emulate:** Figma
- Minimal, function-first aesthetic
- Clean dark greys, no warm colors or decoration
- Geometric precision in layout and typography
- Warm but direct language
- Every UI element earns its place

**Explicitly avoid:**
- Gradients (except the intentional brushed steel and grey progression)
- Glassmorphism, frosted glass effects
- Animated blobs, floating shapes, decorative SVGs
- Emoji bullets, cute icons, playful tone
- Generic AI defaults (untouched shadcn/ui, Inter by reflex, the three-card feature grid, bento boxes)
- Rainbow status indicators (use cool steel-blue and muted accents only)

**The "only this product" test:** The brushed steel sidebar and organic grey texture on the main pane make this dashboard unmistakably **Agent-C**. The combination of cold precision + warm guidance creates a memorable, distinctive feel that couldn't be lifted onto a competitor's product.

---

## 6. Accessibility & medium constraints

- **Contrast:** All text meets WCAG AA standards against dark backgrounds. Lighter greys (#e0e0e0) on dark (#0a0a0a–#1a1a1a) ensure readability without sacrificing the dark aesthetic.
- **Keyboard navigation:** Dashboard is fully keyboard-navigable (Tab, arrow keys, Enter). Interactive elements (project items, feature cards, buttons) respond to keyboard input.
- **Screen reader support:** Semantic HTML, proper ARIA labels, and descriptive text for status indicators so screen readers can announce stage, status, and approval state clearly.
- **Responsive:** Sidebar scrolls when project count exceeds viewport. Main pane content is readable on smaller screens (but v1 optimizes for desktop developers).
- **Motion:** Smooth transitions (0.15s ease) but no parallax or distracting animations that could trigger motion sensitivity.
- **Color accessibility:** Status information is not conveyed by color alone (badges include text, icons have labels).

---

## Mockups

**Location:** `docs/product/mockups/dashboard-ui-mockup.html`

The mockup shows:
- Full dashboard layout (sidebar + right pane)
- Brushed steel sidebar with organic texture
- Right pane with current stage LARGE at top, status/revisions below, git state, features, and action button
- Dark grey palette with organic grey-tone brushing
- Space Grotesk typography throughout
- Warm conversational copy (e.g., "Approved, ready for next stage")
- Steel-blue accents on badges and buttons
- WCAG AA contrast maintained

Open in a browser to see the aesthetic in action.

---

## Decisions (confirmed)

- **Design concept:** Industrial precision + calm focus (cold brushed steel)
- **Color palette:** Dark greys (#0a0a0a–#1a1a1a) with steel-blue accents (#1f5f7f), no warm colors
- **Brushed steel texture:** Hand-buffed organic pattern (not geometric), on both sidebar and main pane, with random grey tones for depth
- **Typography:** Space Grotesk (geometric sans-serif), increased letter-spacing for precision
- **Key element hierarchy:** Current stage LARGE at top of product detail, status/revisions/git state below
- **Voice:** Warm & conversational, precise but human
- **Accessibility:** WCAG AA contrast, full keyboard navigation, semantic HTML
- **Anti-patterns:** No gradients (except intentional), no glassmorphism, no emoji, no generic AI defaults, no bento boxes

---

## Assumptions

- Space Grotesk is available via Google Fonts or bundled in the build
- The brushed steel texture will be rendered via CSS gradients (no background images or SVG needed)
- Dark mode is the default; light mode is deferred to v2
- Screen readers are configured by the user (we provide semantic HTML)

---

## Open questions

- **Component library:** React/Vue/Svelte? (deferred to architect)
- **Build process:** Next.js, Vite, or static? (deferred to architect)
- **Electron vs. web app:** Browser-based or native desktop? (deferred to architect)
- **Notification/alerts:** Should dashboard proactively alert if approval is pending? (deferred to v2)

---

---

## Post-approval design evolution (engineer phase, 2026-06-28)

These decisions were made during engineering in collaboration with the user. They supersede or extend the corresponding sections above. Any future UI revision should treat this section as authoritative.

### Light model changed: horizontal brush → radial point source

The original direction specified "hand-buffed brushstrokes at overlapping angles (18°, -22°, 82°)." During engineering this was replaced with a **radial light source** — light radiates outward from a focal point, like a polished metal disc under a point light. The focal point is randomised per element per app reload, so no two buttons ever look identical.

CSS implementation:
```css
background: radial-gradient(
  ellipse 120% 100% at var(--rx, 50%) var(--ry, 30%),
  #ececec 0%, #d0d0d0 28%, #a8a8a8 55%, #787878 78%, #545454 100%
);
```
`--rx` / `--ry` are set randomly on mount by the `useMetalStyle()` React hook (`src/renderer/src/lib/metal.ts`).

### Buttons: steel plate with bevel rim

Original direction: "Steel-blue background, 4px radius, no rounded corners."
Actual: All action buttons are now **polished grey steel plates** — radial gradient surface, inset bevel box-shadow (bright top/left rim, dark bottom/right), 10px radius. On click they press down 1px. Hover brightens by 6%. "Open in orchestrator" copies the command and shows a 5-second inline toast ("Copied — paste into Claude Desktop").

### Stage badges in sidebar: metallic blue (not flat)

Original direction: "10px, steel-blue background (#1f5f7f), light text."
Actual: `.sidebar-item__stage` uses the same radial light model with a **steel-blue palette** (bright `#88d0f0` at focal point → deep navy `#0a2e52` at edges), inset bevel, and a dark border. Text is `#e8f6ff`. The blue family is preserved but rendered as a polished metal surface rather than a flat fill.

### Stage badge in project detail: polished grey steel

Original direction: "Steel-blue badge, 18px, dominates visually."
Actual: The main-pane stage badge uses the grey radial-steel treatment (not blue), with its own randomly seeded focal point. This distinguishes it visually from the sidebar's blue badges.

### Panel/card borders: inset bevel, not flat lines

Original direction: "Subtle cards (#1a1a1a background, 1px #333 border)."
Actual: The git state card, approval warning, and footer use `box-shadow` inset bevels instead of flat borders — a bright inner lip at the top and a dark inner edge at the bottom simulate a raised metal panel sitting on the dark surface. The approval warning uses a warm-tinted version of the same treatment.

### Sidebar right border: 13px brushed-metal strip

A visible structural element — a 13px-wide brushed grey metal strip on the right edge of the sidebar (`::after` pseudo-element). Width is ≈ 2/3 the height of the stage badge, making it prominent enough to show the metal texture as a design feature, not just a divider line.

### Space Grotesk: bundled, not CDN

Original assumption: "Space Grotesk available via Google Fonts or bundled."
Actual: Bundled via `@fontsource/space-grotesk` (400/500/600/700 weights imported in `main.tsx`). No CDN calls; offline-first. CSP has no external font origins.

### Uncommitted file list in git state panel

When a project has uncommitted changes, the git state card lists each file with a colour-coded status pill:
- `modified` → amber (`#c89632`)
- `added` → green (`#50a050`)
- `deleted` → red (`#be3c3c`)
- `renamed` → blue (`#5078c8`)
- `untracked` → muted grey

---

## Next handoff

**Architect** → reads `01-pm-brief.md`, `02-ux-workflow.md`, and `03-ui-direction.md` (this doc). Designs the technical architecture and system, writes `docs/product/04-architecture.md`.
