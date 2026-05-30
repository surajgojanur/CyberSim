export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          ink: "#050712",
          panel: "#08111f",
          cyan: "#67e8f9",
          violet: "#a78bfa",
          success: "#6ee7b7",
          warning: "#fcd34d"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(34, 211, 238, 0.16)",
        panel: "0 24px 90px rgba(0, 0, 0, 0.38)"
      }
    }
  },
  plugins: []
};
