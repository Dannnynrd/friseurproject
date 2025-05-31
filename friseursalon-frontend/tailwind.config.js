/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}", // Scannt alle JS/JSX/TS/TSX-Dateien in deinem src-Ordner
        "./public/index.html"          // Scannt auch deine Haupt-HTML-Datei
    ],
    theme: {
        extend: {
            // Hier erweiterst du das Standard-Theme von Tailwind
            colors: {
                // Mapping deiner CSS-Variablen zu Tailwind-Farbnamen
                // Diese Namen kannst du dann in deinen Tailwind-Klassen verwenden (z.B. bg-light-bg, text-dark-text)
                'light-bg': 'var(--light-bg)',                 // #ffffff
                'dark-text': 'var(--dark-text)',               // #1f1f1f
                'medium-grey-text': 'var(--medium-grey-text)', // #5f5f5f
                'light-grey-text': 'var(--light-grey-text)',   // #8c8c8c
                'border-color': 'var(--border-color)',         // #e7e7e7
                'border-color-light': 'var(--border-color-light)', // #eeeeee
                'light-grey-bg': 'var(--light-grey-bg)',       // #f8f8f8

                // Du könntest hier auch deine Akzentfarben direkt definieren oder über CSS-Variablen mappen
                // Beispiel für direkte Definition (ersetze mit deinen Farbwerten):
                'primary': {
                    light: '#67e8f9', // z.B. ein helles Cyan
                    DEFAULT: '#06b6d4', // z.B. ein mittleres Cyan
                    dark: '#0e7490',  // z.B. ein dunkles Cyan
                },
                'accent': {
                    DEFAULT: 'var(--accent-color)', // Falls du eine --accent-color CSS Variable hast
                    // oder direkt:
                    // DEFAULT: '#818cf8', // z.B. Indigo-400
                },
                // Die Farben aus deinen :root Definitionen in App.css
                'danger-color': 'var(--danger-color)',
                'danger-color-dark': 'var(--danger-color-dark)',
                'danger-bg': 'var(--danger-bg)',
                'danger-bg-light': 'var(--danger-bg-light)',

                'success-color': 'var(--success-color)',
                'success-color-dark': 'var(--success-color-dark)',
                'success-bg': 'var(--success-bg)',
                'success-bg-light': 'var(--success-bg-light)',

                'info-color': 'var(--info-color)',
                'info-color-dark': 'var(--info-color-dark)',
                'info-bg': 'var(--info-bg)',
                'info-bg-light': 'var(--info-bg-light)',

                'warning-color': 'var(--warning-color)',
                'warning-color-dark': 'var(--warning-color-dark)',
                'warning-bg': 'var(--warning-bg)',
                'warning-bg-light': 'var(--warning-bg-light)',
            },
            fontFamily: {
                // Deine benutzerdefinierten Schriftfamilien
                // Die Namen 'sans' und 'serif' überschreiben die Standard-Tailwind-Schriftarten
                sans: ['Manrope', 'system-ui', 'sans-serif'],    // Manrope als primäre Sans-Serif
                serif: ['Merriweather', 'Georgia', 'serif'], // Merriweather als primäre Serif
                // Du könntest auch spezifische Namen vergeben:
                // 'manrope': ['Manrope', 'sans-serif'],
                // 'playfair': ['Playfair Display', 'serif'], // Playfair war in deinem Beispiel, Merriweather in App.css
            },
            // Hier könntest du weitere Theme-Erweiterungen hinzufügen:
            // spacing, borderRadius, boxShadow, keyframes für Animationen, etc.
            height: {
                '16': '4rem', // 64px, falls Header h-16 ist
                '20': '5rem', // 80px, falls Header md:h-20 ist
            },
            screens: {
                'xs': '480px', // Beispiel für einen kleineren Breakpoint
                // ...Standard-Breakpoints sm, md, lg, xl, 2xl bleiben erhalten, es sei denn, du überschreibst sie hier
            },
            transitionTimingFunction: {
                'custom-ease': 'var(--transition-ease, ease-in-out)', // Deine CSS-Variable verwenden
            },
            boxShadow: {
                'card': 'var(--card-shadow, 0 4px 12px rgba(0, 0, 0, 0.05))', // Schatten für Karten
                // Weitere benutzerdefinierte Schatten
            },
            backdropBlur: { // Um backdrop-blur- Utilities zu ermöglichen
                'xs': '2px',
                'sm': '4px',
                'md': '8px',
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'), // Das Forms-Plugin, das wir für bessere Formular-Styles hinzugefügt haben
        // require('@tailwindcss/typography'), // Nützlich für das Styling von Markdown-Inhalten (Prose-Klassen)
        // require('@tailwindcss/aspect-ratio'), // Falls du das Seitenverhältnis-Plugin benötigst
    ],
}
