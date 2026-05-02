/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            "colors": {
                "primary-container": "#d6e3fc",
                "surface-container-lowest": "#ffffff",
                "primary-fixed-dim": "#c8d5ed",
                "primary-dim": "#465367",
                "surface-container-highest": "#e2e3d9",
                "outline": "#797c73",
                "outline-variant": "#b1b3a9",
                "surface-container-high": "#e8e9e0",
                "on-error": "#fff7f6",
                "on-error-container": "#752121",
                "on-secondary-fixed": "#264350",
                "secondary-dim": "#3a5764",
                "inverse-primary": "#d9e6ff",
                "primary": "#525f74",
                "tertiary-fixed": "#ddddfe",
                "secondary": "#466370",
                "on-primary-container": "#455266",
                "surface-tint": "#525f74",
                "on-primary-fixed": "#334053",
                "error-dim": "#4e0309",
                "surface-bright": "#fbf9f4",
                "inverse-on-surface": "#9e9d99",
                "error": "#9f403d",
                "on-tertiary": "#fbf8ff",
                "on-primary": "#f6f7ff",
                "on-secondary": "#f3faff",
                "inverse-surface": "#0e0e0c",
                "background": "#fbf9f4",
                "on-background": "#31332c",
                "secondary-fixed-dim": "#bbd9e9",
                "tertiary-container": "#ddddfe",
                "tertiary": "#5b5d78",
                "surface-container-low": "#f5f4ed",
                "surface-container": "#efeee6",
                "surface-variant": "#e2e3d9",
                "on-surface": "#31332c",
                "secondary-container": "#c9e7f7",
                "on-surface-variant": "#5e6058"
            },
            "borderRadius": {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem"
            },
            "fontFamily": {
                "headline": ["Manrope", "sans-serif"],
                "body": ["Inter", "sans-serif"],
                "label": ["Inter", "sans-serif"]
            }
        }
    },
    plugins: [],
}
