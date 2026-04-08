# Design System Document: The Editorial Tactile

## 1. Overview & Creative North Star: "The Digital Archivist"
This design system moves away from the sterile, "app-like" interfaces of the modern web to embrace the intellectual weight and tactile history of printed matter. Our Creative North Star is **The Digital Archivist**. 

We are not merely presenting data; we are curating a legacy. The experience should feel like handling high-quality, aged newsprint that has been digitally enhanced. We break the "standard template" look through intentional asymmetry—utilizing wide margins, off-center focal points, and oversized serif typography that demands attention. The layout is grounded by structural rules that mimic a printing press's precision, yet softened by a warm, organic color palette.

---

## 2. Colors: Tonal Depth & The Paper Stack
The palette is rooted in the "Newsprint," "Sepia," and "Archive" variations, creating a sense of physical age and intellectual authority.

### Core Palette (Material Design Mapping)
*   **Background (Newsprint):** `#faf9f3` — Our primary surface. A warm, off-white that reduces eye strain.
*   **Surface Container (Sepia):** `#efeee8` — Used for secondary sections or cards.
*   **Surface Dim (Archive):** `#dbdad4` — A saturated, aged tone for headers or deep footer backgrounds.
*   **Primary (Hyperlink Blue):** `#4b4bd4` — A modernized, high-contrast version of classic web blue.
*   **Secondary (Ink):** `#6a5d43` — A muted, brownish-grey for secondary text and structural rules.

### The "No-Line" Rule for Sectioning
While horizontal rules are permitted for editorial flair, you are **prohibited** from using 1px solid borders to define container boundaries. Boundaries must be defined through background shifts.
*   **Nesting:** Place a `surface-container-lowest` (#ffffff) card onto a `surface` (#faf9f3) background. 
*   **The Tonal Transition:** Use `surface-container-low` (#f5f4ee) to define a sidebar against the primary background. This creates a "stacked paper" effect rather than a "boxed-in" feel.

### Signature Textures & Glass
*   **The Ink Gradient:** Use a subtle gradient from `primary` (#4b4bd4) to `primary-container` (#babbff) for large CTAs to mimic the slight bleeding of ink on a page.
*   **Glassmorphism:** For floating navigation or "quick-view" overlays, use the `surface` color at 80% opacity with a `20px` backdrop-blur. This suggests a translucent vellum sheet resting atop the archive.

---

## 3. Typography: The Newsreader Authority
The typography is the soul of this system. We use **Newsreader** for all editorial content and **Public Sans** for functional, utility-based labels.

| Token | Font | Size | Intent |
| :--- | :--- | :--- | :--- |
| **Display-LG** | Newsreader | 3.5rem | Mastheads and "Front Page" features. |
| **Headline-MD** | Newsreader | 1.75rem | Section starts; bold and authoritative. |
| **Title-MD** | Newsreader | 1.125rem | Article headlines in a feed. |
| **Body-LG** | Newsreader | 1rem | The primary reading experience. High legibility. |
| **Label-MD** | Public Sans | 0.75rem | Metadata (Dates, Authors, Tags). |

**Editorial Rule:** Always use `1.6` line-height for Body-LG to ensure the "column" feel of a newspaper. All links (`primary` #4b4bd4) must be underlined with a `1.5px` offset to honor the original hypertext tradition.

---

## 4. Elevation & Depth: Tonal Layering
We do not use Material-style drop shadows. Depth is an optical illusion created through layering paper weights.

*   **The Layering Principle:** To elevate a component, move it "up" the surface scale. A card on a `surface-dim` background should be `surface-bright`.
*   **Ambient Shadows:** If an element must float (e.g., a modal), use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(106, 93, 67, 0.08)`. Notice the shadow is tinted with our `secondary` ink color, not black.
*   **The "Ghost Border" Fallback:** If a separator is required for accessibility, use the `outline-variant` (#cfc5b8) at 20% opacity. It should be felt, not seen.

---

## 5. Components: Editorial Primitives

### Buttons
*   **Primary:** Solid `primary` (#4b4bd4) with `on-primary` (#ffffff) text. **Radius: 0px.** Sharp corners only.
*   **Secondary:** Ghost style. `outline` (#7e766b) at 30% opacity with `primary` text.
*   **Interaction:** On hover, the button should shift to `primary-container` (#babbff).

### Cards & Feed Lists
*   **Rule:** Forbid the use of divider lines between items. 
*   **Separation:** Use `80px` of vertical white space (Spacing Scale) or a subtle shift from `surface` to `surface-container-low` to separate stories.
*   **Structure:** Use a `2px` horizontal rule (`secondary` color) only at the very top of a feed to signal the start of a new section.

### Input Fields
*   **Style:** Minimalist. A single bottom border using `outline` (#7e766b). 
*   **Focus:** The bottom border thickens to 2px and changes to `primary` (#4b4bd4). The background shifts slightly to `surface-container-highest` (#e3e3dd) to indicate activity.

### Additional Component: The "Rule-Column"
For desktop layouts, utilize a vertical 1px rule (at 10% opacity) to separate the main editorial content from the "Archive" sidebar. This mimics the column-rule of traditional broadsheets.

---

## 6. Do's and Don'ts

### Do
*   **Do** embrace asymmetry. Align a headline to the left but the sub-header to the right.
*   **Do** use `Newsreader` italic for blockquotes and pull-quotes to add "texture" to the page.
*   **Do** ensure all `primary` blue links pass WCAG AA contrast against all three paper tones.

### Don't
*   **Don't** use rounded corners (`0px` is the hard rule). Roundness breaks the archival aesthetic.
*   **Don't** use pure black (#000000). Use `on-surface` (#1b1c19) to maintain the "ink on paper" softness.
*   **Don't** use standard "cards" with heavy borders. Let the typography and background tones do the work.