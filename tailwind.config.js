/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class', '[data-theme="dark"]'],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                orbitron: ['Orbitron', 'sans-serif'],
                sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
            },
            colors: {
                // Map CSS variables to Tailwind - hybrid approach
                bg: {
                    primary: 'var(--bg-primary)',
                    secondary: 'var(--bg-secondary)',
                    tertiary: 'var(--bg-tertiary)',
                    card: 'var(--bg-card)',
                    'card-hover': 'var(--bg-card-hover)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                },
                border: 'var(--border-color)',
                accent: {
                    blue: 'var(--accent-blue)',
                    'blue-bg': 'var(--accent-blue-bg)',
                    purple: 'var(--accent-purple)',
                    'purple-bg': 'var(--accent-purple-bg)',
                    green: 'var(--accent-green)',
                    'green-bg': 'var(--accent-green-bg)',
                    yellow: 'var(--accent-yellow)',
                    orange: 'var(--accent-orange)',
                    pink: 'var(--accent-pink)',
                    red: 'var(--accent-red)',
                    'red-bg': 'var(--accent-red-bg)',
                },
            },
            borderRadius: {
                sm: 'var(--radius-sm)',
                md: 'var(--radius-md)',
                lg: 'var(--radius-lg)',
                xl: 'var(--radius-xl)',
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
            },
            transitionDuration: {
                fast: '150ms',
                normal: '200ms',
            },
            // Semantic spacing values - eliminates magic pixels
            spacing: {
                'sidebar': '220px',      // Sidebar expanded width
                'sidebar-collapsed': '56px', // Sidebar collapsed width (w-14)
                'card-min': '180px',     // Minimum card height
                'card-compact': '140px', // Compact card height
            },
            // Semantic z-index - prevents stacking wars
            zIndex: {
                'header': '100',
                'sidebar': '200',
                'overlay': '199',
                'modal': '300',
                'tooltip': '400',
                'dropdown': '150',
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
            animation: {
                shimmer: 'shimmer 1.5s infinite',
                fadeIn: 'fadeIn 0.15s ease',
            },
        },
    },
    plugins: [],
}
