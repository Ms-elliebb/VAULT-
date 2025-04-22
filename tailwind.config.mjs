/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-montserrat)', 'sans-serif'],
        // Monospace için Tailwind varsayılanı kullanılacak
      },
      // Burada özel renkler, boşluklar vb. tanımlanabilir
      colors: {
        // globals.css'deki HSL değişkenlerini kullan
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        // Yeni eklenen CSS değişkenleri
        destructive: {
           DEFAULT: 'hsl(var(--destructive))',
           // foreground: 'hsl(var(--destructive-foreground))', // Gerekirse eklenebilir
        },
         success: {
           DEFAULT: 'hsl(var(--success))',
           // foreground: 'hsl(var(--success-foreground))',
        },
         warning: {
           DEFAULT: 'hsl(var(--warning))',
           // foreground: 'hsl(var(--warning-foreground))',
        },
        // Kaldırılan eski hardcoded renkler
      }
    },
  },
  plugins: [],
};

export default config; 