// friseursalon-frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            colors: {
                // Mapping auf unsere neuen, neutraleren CSS-Variablen
                'light-bg': 'var(--light-bg)',
                'dark-text': 'var(--dark-text)',
                'medium-grey-text': 'var(--medium-grey-text)',
                'light-grey-text': 'var(--light-grey-text)',
                'border-color': 'var(--border-color)',
                'border-color-light': 'var(--border-color-light)',
                'light-grey-bg': 'var(--light-grey-bg)',

                // Die primäre Akzentfarbe ist jetzt neutral, gesteuert durch --dark-text.
                // Statusfarben bleiben für ihre Signalwirkung erhalten.
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
                sans: ['Manrope', 'system-ui', 'sans-serif'],
                serif: ['Merriweather', 'Georgia', 'serif'],
            },
            height: {
                '16': '4rem',
                '20': '5rem',
            },
            screens: {
                'xs': '480px',
            },
            transitionTimingFunction: {
                'custom-ease': 'var(--transition-ease, ease-in-out)',
            },
            boxShadow: {
                'card': 'var(--card-shadow, 0 4px 12px rgba(0, 0, 0, 0.05))',
            },
            backdropBlur: {
                'xs': '2px',
                'sm': '4px',
                'md': '8px',
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}