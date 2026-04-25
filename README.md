# Horizon

A premium, Vim-inspired blog starter built with **Astro 6** and **Tailwind CSS 4**.

## 🚀 Features

- **Astro 6**: The latest version of the web framework for content-driven websites.
- **Tailwind CSS 4**: Modern styling with the `@tailwindcss/vite` plugin for lightning-fast builds.
- **Vim-Inspired Navigation**: Navigate the blog index using classic Vim keyboard shortcuts.
- **MDX Support**: Write your content in Markdown or MDX with ease.
- **Content Layer**: Uses the modern Astro Content Layer API for flexible data management.

## ⌨️ Keyboard Navigation (Blog Index)

- `j`: Move selection down
- `k`: Move selection up
- `g`: Jump to the first post
- `G`: Jump to the last post
- `Enter` or `l`: Open the selected blog post

## 🛠️ Project Structure

```text
/
├── src/
│   ├── content/          # Blog posts (Markdown/MDX)
│   ├── layouts/          # Base Layout components
│   ├── pages/            # Routes (Home, Blog, About, etc.)
│   └── styles/           # Global CSS and Tailwind configuration
├── public/               # Static assets
└── astro.config.mjs      # Astro configuration
```

## 🧞 Commands

All commands are run from the root of the project:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally                       |
| `npm run astro ...`       | Run CLI commands like `astro check`              |

## 👀 Learn More

Check out the [Astro Documentation](https://docs.astro.build) to learn more about customizing this site.
