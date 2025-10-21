/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        // Override Tailwind's LAB color model with pure HEX values
        colors: {
          background: "#0a0a0a",
          surface: "#1e1e1e",
          primary: "#2563EB",
          secondary: "#3B82F6",
          accent: "#22C55E",
          white: "#ffffff",
          black: "#000000",
          gray: {
            50: "#f9fafb",
            100: "#f3f4f6",
            200: "#e5e7eb",
            300: "#d1d5db",
            400: "#9ca3af",
            500: "#6b7280",
            600: "#4b5563",
            700: "#374151",
            800: "#1f2937",
            900: "#111827",
          },
        },
      },
    },
    plugins: [],
  };
  