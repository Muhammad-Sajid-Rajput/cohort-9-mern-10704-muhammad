import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary, #A90E02)",
        "primary-hover": "var(--color-primary-hover, #7F0A02)",
        "primary-tint": "var(--color-primary-tint, #FBEAE7)",
        "on-primary": "var(--color-on-semantic, #FFFFFF)",
        "accent-warm": "var(--color-accent-warm, #FFFBD4)",
        "text-primary": "var(--color-text-primary, #0F172A)",
        "text-secondary": "var(--color-text-secondary, #334155)",
        "text-muted": "var(--color-text-muted, #64748B)",
        border: "var(--color-border, #E2E8F0)",
        "border-subtle": "var(--color-border-subtle, #F1F5F9)",
        background: "var(--color-bg-page, #F8FAFC)",
        surface: "var(--color-bg-surface, #FFFFFF)",
        "surface-container": "var(--color-primary-tint, #FBEAE7)",
        "surface-container-high": "var(--color-primary-tint, #FBEAE7)",
        "surface-container-low": "var(--color-bg-page, #F8FAFC)",
        "on-surface": "var(--color-text-primary, #0F172A)",
        "on-surface-variant": "var(--color-text-secondary, #334155)",
        outline: "var(--color-border, #E2E8F0)",
        "outline-variant": "var(--color-border, #E2E8F0)",
        success: "var(--color-success, #15803D)",
        warning: "var(--color-warning, #B45309)",
        error: "var(--color-destructive, #E11D48)",
        "on-error": "var(--color-on-semantic, #FFFFFF)",
        "secondary-container": "var(--color-primary-tint, #FBEAE7)",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        "body-md": ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [forms, typography],
};
