export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ─── Obsidian Pulse: Liquid State ─────────────────────────────────────────
      colors: {
        // Core surfaces
        background:                '#131315',
        surface:                   '#131315',
        'surface-dim':             '#131315',
        'surface-bright':          '#39393b',
        'surface-container-lowest':'#0e0e10',
        'surface-container-low':   '#1c1b1d',
        'surface-container':       '#201f22',
        'surface-container-high':  '#2a2a2c',
        'surface-container-highest':'#353437',
        'surface-variant':         '#353437',
        'surface-tint':            '#d2bbff',

        // Text
        'on-surface':              '#e5e1e4',
        'on-surface-variant':      '#ccc3d8',
        'on-background':           '#e5e1e4',
        'inverse-surface':         '#e5e1e4',
        'inverse-on-surface':      '#313032',

        // Borders
        outline:                   '#958da1',
        'outline-variant':         '#4a4455',

        // Primary — deep violet
        primary:                   '#d2bbff',
        'primary-container':       '#7c3aed',
        'on-primary':              '#3f008e',
        'on-primary-container':    '#ede0ff',
        'primary-fixed':           '#eaddff',
        'primary-fixed-dim':       '#d2bbff',
        'on-primary-fixed':        '#25005a',
        'on-primary-fixed-variant':'#5a00c6',
        'inverse-primary':         '#732ee4',

        // Secondary — muted coral
        secondary:                 '#ffb3b0',
        'secondary-container':     '#881d24',
        'on-secondary':            '#670211',
        'on-secondary-container':  '#ff9996',
        'secondary-fixed':         '#ffdad8',
        'secondary-fixed-dim':     '#ffb3b0',
        'on-secondary-fixed':      '#410006',
        'on-secondary-fixed-variant':'#881d24',

        // Tertiary — lavender
        tertiary:                  '#c4c1fb',
        'tertiary-container':      '#646195',
        'on-tertiary':             '#2d2a5b',
        'on-tertiary-container':   '#e7e3ff',
        'tertiary-fixed':          '#e3dfff',
        'tertiary-fixed-dim':      '#c4c1fb',
        'on-tertiary-fixed':       '#181445',
        'on-tertiary-fixed-variant':'#444173',

        // Error
        error:                     '#ffb4ab',
        'error-container':         '#93000a',
        'on-error':                '#690005',
        'on-error-container':      '#ffdad6',

        // ─── Legacy aliases (keep for backward compat) ──────────────────────────
        bg:         '#0e0e10',
        surface1:   '#1c1b1d',
        surface2:   '#201f22',
        surface3:   '#2a2a2c',
        ink:        '#0e0e10',
        panel:      '#1c1b1d',
        panel2:     '#201f22',
        text:       '#e5e1e4',
        text2:      'rgba(229,225,228,0.60)',
        text3:      'rgba(229,225,228,0.35)',
        accent:     '#7c3aed',
        warm:       '#d2bbff',
        warmWhite:  '#e5e1e4',
        muted:      'rgba(229,225,228,0.35)',
        live: {
          DEFAULT: '#c4c1fb',
          glow: 'rgba(196,193,251,0.26)',
        },
        gold:       '#ffb3b0',
        purpleGlow: '#7c3aed',
        cyanGlow:   '#c4c1fb',
        orangeGlow: '#d2bbff',
        greenGlow:  '#34D399',
        violet: {
          DEFAULT: '#7c3aed',
          glow:    '#d2bbff',
          muted:   'rgba(124,58,237,0.12)',
        },
      },

      // ─── Typography ───────────────────────────────────────────────────────────
      fontFamily: {
        'headline-xl':        ['Geist', 'sans-serif'],
        'headline-lg':        ['Geist', 'sans-serif'],
        'headline-lg-mobile': ['Geist', 'sans-serif'],
        'body-md':            ['Inter', 'ui-sans-serif', 'system-ui'],
        'label-sm':           ['JetBrains Mono', 'monospace'],
        // Legacy
        display: ['Geist', 'sans-serif'],
        sans:    ['Inter', 'ui-sans-serif', 'system-ui'],
        mono:    ['JetBrains Mono', 'monospace'],
      },

      fontSize: {
        'headline-xl':        ['48px', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '700' }],
        'headline-lg':        ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-lg-mobile': ['24px', { lineHeight: '1.2', fontWeight: '600' }],
        'body-md':            ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'label-sm':           ['12px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '500' }],
      },

      // ─── Spacing tokens ───────────────────────────────────────────────────────
      spacing: {
        'liquid_gap':     '12px',
        'gutter':         '24px',
        'margin-mobile':  '16px',
        'margin-desktop': '64px',
        'unit':           '4px',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top':    'env(safe-area-inset-top)',
      },

      // ─── Border radius ────────────────────────────────────────────────────────
      borderRadius: {
        DEFAULT: '0.25rem',
        sm:      '0.25rem',
        md:      '0.5rem',
        lg:      '0.75rem',
        xl:      '1.5rem',
        full:    '9999px',
      },

      // ─── Transition ───────────────────────────────────────────────────────────
      transitionTimingFunction: {
        liquid: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'liquid-soft': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },

      // ─── Box shadow ───────────────────────────────────────────────────────────
      boxShadow: {
        'glass':      'inset 1px 1px 0px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)',
        'primary-glow': '0 0 24px rgba(124,58,237,0.3)',
        'primary-glow-lg': '0 0 40px rgba(124,58,237,0.45)',
        'tertiary-glow': '0 0 20px rgba(196,193,251,0.26)',
        // Legacy
        'glow-accent': '0 0 24px rgba(124,58,237,0.22)',
        'glow-live':   '0 0 20px rgba(196,193,251,0.26)',
        'glow-gold':   '0 0 24px rgba(255,179,176,0.20)',
        'violet-glow': '0 0 24px rgba(124,58,237,0.22)',
        'violet-glow-lg': '0 0 40px rgba(124,58,237,0.35)',
        'live-glow':   '0 0 20px rgba(196,193,251,0.26)',
        glow:          '0 0 24px rgba(124,58,237,0.22)',
        cyan:          '0 0 28px rgba(196,193,251,.14)',
        orange:        '0 0 28px rgba(210,187,255,.16)',
      },

      // ─── Keyframes & Animations ───────────────────────────────────────────────
      keyframes: {
        'liquid-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':       { opacity: '0.5', transform: 'scale(1.05)' },
        },
        flow: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        flowIn: {
          from: { width: '0', opacity: '0' },
          to:   { width: '100%', opacity: '1' },
        },
        ambientFloat: {
          '0%':   { transform: 'translate(0,0) scale(1)' },
          '100%': { transform: 'translate(15%, 10%) scale(1.1)' },
        },
        ambientFloatReverse: {
          '0%':   { transform: 'translate(0,0) scale(1.05)' },
          '100%': { transform: 'translate(-10%, -15%) scale(0.9)' },
        },
        tubeSweep: {
          '0%':   { left: '-100%' },
          '100%': { left: '100%' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%':       { opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'liquid-pulse':          'liquid-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'flow':                  'flow 3s ease-in-out infinite alternate',
        'ambient-float':         'ambientFloat 25s ease-in-out infinite alternate',
        'ambient-float-reverse': 'ambientFloatReverse 30s ease-in-out infinite alternate',
        'tube-sweep':            'tubeSweep 0.8s cubic-bezier(0.25,1,0.5,1) forwards',
        'pulse-soft':            'pulse-soft 2s ease-in-out infinite',
        'fade-in':               'fade-in 200ms ease-out',
        'pulse-ring':            'pulse-ring 1.4s cubic-bezier(0.4,0,0.6,1) infinite',
        marquee:                 'marquee var(--marquee-duration, 30s) linear infinite',
      },
    },
  },
  plugins: [],
};
