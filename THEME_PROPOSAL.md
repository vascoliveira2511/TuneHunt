# TuneHunt Theme Redesign - Aura/Palenight Inspired

## Current Issues
- Too "gamery" with bright purple (`139 92 246`) and cyan (`6 182 212`)
- Over-styled with excessive glow effects and gradients
- Lacks sophistication and professional appearance

## New Color Palette

### Light Mode
```css
--background: 250 251 252;        /* Soft white-gray */
--foreground: 41 47 60;           /* Dark blue-gray */
--card: 255 255 255;              /* Pure white */
--card-foreground: 41 47 60;      /* Dark blue-gray */
--primary: 255 154 68;            /* Soft orange (main accent) */
--primary-foreground: 255 255 255; /* White text on orange */
--secondary: 241 243 247;         /* Light gray */
--secondary-foreground: 75 85 99; /* Medium gray */
--muted: 248 250 252;             /* Very light gray */
--muted-foreground: 107 114 128;  /* Light gray text */
--accent: 129 140 248;            /* Soft indigo (secondary accent) */
--accent-foreground: 255 255 255; /* White text on indigo */
```

### Dark Mode
```css
--background: 30 32 48;           /* Deep blue-gray (Aura inspired) */
--foreground: 213 220 232;        /* Light gray text */
--card: 40 44 62;                 /* Slightly lighter than background */
--card-foreground: 213 220 232;   /* Light gray text */
--primary: 255 154 68;            /* Same soft orange */
--primary-foreground: 30 32 48;   /* Dark text on orange */
--secondary: 55 65 81;            /* Medium blue-gray */
--secondary-foreground: 156 163 175; /* Medium gray text */
--muted: 45 50 70;                /* Muted blue-gray */
--muted-foreground: 156 163 175;  /* Medium gray text */
--accent: 129 140 248;            /* Same soft indigo */
--accent-foreground: 255 255 255; /* White text on indigo */
```

## Design Philosophy

### Colors
- **Primary Orange**: `#FF9A44` - Warm, inviting, softer than pure orange
- **Secondary Indigo**: `#818CF8` - Calming, professional complement to orange
- **Backgrounds**: Deep blue-grays inspired by Aura theme
- **Text**: High contrast but not harsh black/white

### Visual Changes
- **Remove**: Excessive glow effects, "gaming" gradients, flashy animations
- **Reduce**: Over-use of gradients and shimmer effects
- **Add**: Subtle shadows, clean borders, refined spacing
- **Focus**: Readability, professionalism, modern aesthetics

### UI Elements
- **Cards**: Clean white/dark with subtle shadows instead of glows
- **Buttons**: Solid colors with subtle hover states
- **Inputs**: Clean borders, focus states without glow
- **Loading**: Simple, elegant animations without "gaming" feel

## Benefits
- More professional and sophisticated appearance
- Better for general audiences, not just gamers
- Easier on the eyes for longer sessions
- Modern, clean aesthetic that ages well
- Better accessibility with improved contrast ratios

## Implementation Priority
1. Update core color variables
2. Remove excessive glow and gradient classes
3. Simplify animations and micro-interactions
4. Test accessibility and contrast ratios
5. Update component styling to match new theme