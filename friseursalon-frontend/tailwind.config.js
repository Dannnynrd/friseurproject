/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            // You can extend Tailwind's default theme here
            // For example, mapping your CSS variables:
            colors: {
                'light-bg': 'var(--light-bg)',
                'dark-text': 'var(--dark-text)',
                'medium-grey-text': 'var(--medium-grey-text)',
                'light-grey-text': 'var(--light-grey-text)',
                'border-color': 'var(--border-color)',
                'light-grey-bg': 'var(--light-grey-bg)',
                // Add other colors as needed
            },
            fontFamily: {
                serif: ['Playfair Display', 'serif'], // From your index.html
                sans: ['Manrope', 'sans-serif'],     // From your index.html
            },
        },
    },
    plugins: [],
}