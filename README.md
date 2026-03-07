# Sumit Kumar Sharma — Personal Portfolio

A modern personal portfolio website featuring a **glassmorphism** design with light/dark themes, an integrated live weather widget, and an interactive PDF tool — all in a single-page static site.

🔗 **Live:** [coinrx.me](https://coinrx.me)

---

## ✨ Features

- **Glassmorphism UI** — frosted-glass panels, glowing background orbs, and smooth animations
- **Light / Dark Theme** — toggle with one click; preference saved in `localStorage`
- **3D Parallax Effects** — background orbs and hero elements respond to mouse movement
- **Live Weather Widget** — displays real-time weather in the navbar via the OpenWeatherMap API, with city search and geolocation support
- **Interactive PDF Tool** — upload a PDF to rotate, resize, and combine pages using [pdf-lib](https://pdf-lib.js.org/), entirely client-side
- **Responsive Design** — adapts to desktop, tablet, and mobile viewports

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox, `backdrop-filter`) |
| Scripting | Vanilla JavaScript (ES6+) |
| PDF Processing | [pdf-lib](https://pdf-lib.js.org/) (loaded from CDN) |
| Weather Data | [OpenWeatherMap API](https://openweathermap.org/api) |
| Hosting | GitHub Pages with custom domain |

## 📁 Project Structure

```
.
├── index.html          # Main HTML page
├── style.css           # All styles (light/dark themes, glassmorphism, responsive)
├── script.js           # Theme toggle, parallax, weather widget, PDF tool logic
├── images/             # Weather icons and UI assets
├── package.json        # Dependency metadata (pdf-lib)
├── CNAME               # Custom domain configuration (coinrx.me)
└── README.md
```

## 🚀 Getting Started

No build step is required — this is a static site.

1. **Clone the repository**

   ```bash
   git clone https://github.com/eoftisreal/eoftisreal.github.io.git
   cd eoftisreal.github.io
   ```

2. **Open in a browser**

   Open `index.html` directly, or serve it locally:

   ```bash
   npx serve .
   ```

3. **Deploy**

   Push to the `main` branch — GitHub Pages will publish the site automatically.

## 📄 License

This project is open source. Feel free to fork and adapt it for your own portfolio.