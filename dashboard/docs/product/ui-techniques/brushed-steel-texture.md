# UI Technique: Brushed Steel Texture

A reusable CSS technique for creating organic, hand-buffed metal textures. Use this for any UI element that needs industrial precision + tactile depth.

---

## Overview

Creates an organic brushed metal appearance by layering:
1. **Fine brushstroke patterns** — repeating linear gradients at multiple angles
2. **Random grey variation** — radial gradients with varying sizes, positions, and tones
3. **Texture overlay** — subtle vertical striations for micro-detail

Result: Looks like hand-buffed steel with natural wear, light spots, and depth.

---

## Core CSS structure

```css
.element {
    /* Base color/gradient */
    background: linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 100%);
    position: relative;
}

/* Texture overlay pseudo-element */
.element::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
        /* Brushstrokes layer 1 */
        repeating-linear-gradient(18deg, ...),
        /* Brushstrokes layer 2 */
        repeating-linear-gradient(-22deg, ...),
        /* Brushstrokes layer 3 */
        repeating-linear-gradient(82deg, ...),
        /* Random grey variation 1 */
        radial-gradient(...),
        /* Random grey variation 2 */
        radial-gradient(...),
        /* ... more radial gradients ... */;
    pointer-events: none;
    z-index: 0;
}

/* Content must be relative + z-index to appear above texture */
.element > * {
    position: relative;
    z-index: 1;
}
```

---

## Adjustable parameters

### 1. Brushstroke angles

The three repeating-linear-gradients create overlapping brushstrokes at different angles:

```css
repeating-linear-gradient(
    18deg,      /* ← ANGLE: change to vary stroke direction */
    transparent 0px,
    rgba(255,255,255,0.012) 0.5px,
    transparent 1px,
    transparent 1.2px
)
```

**Default angles:** 18°, -22°, 82° (creates organic non-parallel pattern)

**To adjust:**
- **More uniform:** Use angles like 20°, 60°, 100° (evenly spaced)
- **More organic:** Use angles like 17°, -23°, 84° (slightly random)
- **Different look:** Try 30°, -45°, 90° for a distinct pattern

---

### 2. Brushstroke opacity & width

Controls how visible the stroke patterns are:

```css
repeating-linear-gradient(
    18deg,
    transparent 0px,
    rgba(255,255,255,0.012),  /* ← OPACITY: 0.012 = subtle white strokes */
    transparent 1px,
    transparent 1.2px          /* ← WIDTH: 1-1.2px = fine lines */
)
```

**Current settings:**
- Light strokes: `rgba(255,255,255,0.012)` (white at 1.2% opacity)
- Dark strokes: `rgba(0,0,0,0.02)` (black at 2% opacity)
- Width: 0.5-1.2px (tight, fine lines)

**To adjust:**
- **More visible texture:** Increase opacity to 0.025–0.04
- **Subtler texture:** Decrease to 0.005–0.008
- **Thicker strokes:** Increase width to 1.5–2px
- **Thinner strokes:** Decrease to 0.3–0.5px

---

### 3. Grey tone variation (radial gradients)

Multiple radial gradients create random light/dark patches. Each has:

```css
radial-gradient(
    ellipse 182px 234px at 15% 20%,           /* Size & position */
    rgba(100,110,115,0.08) 0%,                /* ← COLOR & OPACITY */
    transparent 60%
)
```

**Current grey tones used:**
- `rgba(80,90,95,0.06)` — dark grey
- `rgba(100,110,115,0.08)` — dark-mid grey
- `rgba(120,130,135,0.07)` — mid grey
- `rgba(140,150,155,0.09)` — mid-light grey
- `rgba(160,170,175,0.085)` — light grey
- `rgba(180,190,195,0.1)` — very light grey
- `rgba(255,255,255,0.02–0.025)` — bright highlights

**To adjust:**
- **Darker overall:** Use greys like rgba(60,70,75,0.08)
- **Lighter overall:** Use greys like rgba(200,210,215,0.1)
- **More contrast:** Mix very dark (40,50,60) with very light (220,230,240)
- **More subtle:** Lower all opacities (0.04–0.06)
- **More dramatic:** Raise opacities (0.1–0.15)

---

### 4. Grey patch size & position

Controls how large and where the brushed patches appear:

```css
radial-gradient(
    ellipse 182px 234px at 15% 20%,  /* ← SIZE (px) & POSITION (%) */
    rgba(100,110,115,0.08) 0%,
    transparent 60%
)
```

**Current setup:** 9 radial gradients, sizes range 110–182px horizontally, 145–234px vertically

**To adjust:**
- **Larger patches (30% bigger):** Multiply all sizes by 1.3 (e.g., 140px → 182px)
- **Smaller patches:** Multiply by 0.7 (e.g., 140px → 98px)
- **More patches:** Add more `radial-gradient(...)` entries at new positions
- **Fewer patches:** Remove some `radial-gradient(...)` entries
- **Reposition:** Change the `at X% Y%` values (0–100% range)

---

### 5. Base colour gradient

The foundation colour beneath the texture:

```css
background: linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 100%);
```

**Current:** Dark to slightly lighter (top to bottom)

**To adjust:**
- **Lighter overall:** Change to `#1a1a1a` → `#2a2a2a`
- **Warmer tones:** Change to `#1a1512` → `#2a1f15` (brownish)
- **Cooler tones:** Change to `#0f1820` → `#1a2a30` (blueish)
- **Flat colour (no gradient):** Change to `background: #0a0a0a;`
- **Inverted:** Change to `linear-gradient(to top, ...)`

---

## Quick presets

### Preset 1: Subtle (very light texture)

- Reduce all brushstroke opacities to 0.005–0.008
- Reduce all radial gradient opacities to 0.03–0.05
- Keep sizes and positions the same
- Result: Very fine, barely visible texture

### Preset 2: Bold (heavy texture)

- Increase all brushstroke opacities to 0.03–0.05
- Increase all radial gradient opacities to 0.12–0.15
- Keep sizes the same
- Result: Heavy, obvious brushed metal look

### Preset 3: Small patches (tight, detailed)

- Reduce all radial gradient sizes by 30% (multiply by 0.7)
- Keep opacities the same
- Result: Finer, tighter brushed pattern

### Preset 4: Large patches (bold, industrial)

- Increase all radial gradient sizes by 30% (multiply by 1.3)
- Keep opacities the same
- Result: Bigger, more prominent patches (current Agent-C Dashboard setting)

---

## Examples: How to apply to different elements

### Sidebar with brushed steel

```css
.sidebar {
    background: linear-gradient(135deg, #1a2a2f 0%, #0f1817 50%, #1a2a2f 100%);
    position: relative;
}

.sidebar::before {
    /* Same brushstroke + radial gradient setup as above */
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: /* ... */;
    pointer-events: none;
}
```

### Main content pane (dark to light)

```css
.main-content {
    background: linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 100%);
    position: relative;
}

.main-content::before {
    /* Same texture, but with 30% larger patches (Agent-C Dashboard) */
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: /* ... ellipse 182px 234px, etc ... */;
    pointer-events: none;
}
```

### Button or card background

```css
.btn {
    background: linear-gradient(135deg, #1f5f7f 0%, #1a4a5f 100%);
    position: relative;
}

.btn::before {
    /* Same technique, but with smaller patches (multiply by 0.5) */
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: /* ellipse 70px 90px, etc */;
    pointer-events: none;
}

.btn > * {
    position: relative;
    z-index: 1;
}
```

---

## Tips for tweaking

1. **Always test in the actual product** — texture appearance varies by screen brightness and monitor calibration
2. **Start with opacity:** Adjusting opacity is usually the fastest way to make the texture more/less visible
3. **Patch size matters most:** Larger patches (>150px) feel bold and industrial; smaller patches (<80px) feel refined and detailed
4. **Angle variety:** Using very different angles (e.g., 10°, 45°, 85°) creates more organic look; similar angles (e.g., 20°, 25°, 30°) feel more structured
5. **Grey tone distribution:** Mix dark, mid, and light greys for depth; all the same tone feels flat
6. **Test with content:** Make sure texture doesn't interfere with text readability — use semi-transparent overlays or position patches away from text areas

---

## For future projects

To use this technique in another project:

1. Copy the CSS from the `dashboard-ui-mockup.html` file (`.sidebar::before` and `.main-content::before`)
2. Adjust the parameters above based on your needs
3. Update the `background` colour to match your design palette
4. Test on actual content elements to ensure readability
5. Document any custom variations you create here for future reference

---

## Parameters quick reference

| Parameter | Where | Current value | To make subtler | To make bolder |
|-----------|-------|---|---|---|
| Brushstroke opacity | repeating-linear-gradient | 0.012 / 0.02 | 0.005 | 0.04 |
| Brushstroke width | repeating-linear-gradient | 0.5–1.2px | 0.3px | 2px |
| Patch size | radial-gradient ellipse | 110–182px | ×0.7 | ×1.3 |
| Patch opacity | radial-gradient rgba | 0.06–0.1 | 0.03–0.05 | 0.12–0.15 |
| Base colour | background | #0a0a0a–#1a1a1a | Lighter | Darker |
| Angles | repeating-linear-gradient | 18°, -22°, 82° | Similar angles | Very different angles |
