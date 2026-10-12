/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease both',
        'slide-up': 'slideUp 0.55s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up-delay': 'slideUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.12s both',
        'tick': 'tick 0.38s ease',
        'float': 'floatSlow 3.5s ease-in-out infinite',
        'spin-slow': 'spin 0.8s linear infinite',
        'pulse-dot': 'pulseDot 1.4s ease-in-out infinite',
        'pop-in': 'popIn 0.28s cubic-bezier(0.16,1,0.3,1) both',
        'skeleton-shimmer': 'skeletonShimmer 1.6s ease-in-out infinite',
        'shimmer': 'shimmer 1.2s ease',
        'glow-pulse': 'glowPulse 2.8s ease-in-out infinite',
        'drift': 'drift 24s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};
