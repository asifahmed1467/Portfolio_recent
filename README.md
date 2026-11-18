# Asif Ahmed: Portfolio

A portfolio that lives inside a 3D gaming room. Sit down at the desk, click the monitor and a
Windows-11-style desktop boots up: lock screen, sign-in, taskbar, Start menu, a working terminal,
file explorer, a photo gallery, a few small games and an AI lab.

Live site: https://asifahmed1467.github.io/Portfolio_recent/

## Run it

    npm install
    npm run build          # -> dist/index.html (+ dist/images)
    npx serve dist         # or open dist/index.html

`npm run build:pages` writes the same site to `docs/`, which is what GitHub Pages serves.
`npm run build:single` makes one self-contained HTML file with the images embedded.

## Make it yours

Everything about you lives in **`src/os/data.ts`**: name, bio, skills, projects, experience,
education, links, specs, photos.

Photos:
1. Put 3 to 5 photos in `public/images/` named `me-1.jpg` ... `me-5.jpg`.
2. List them in `data.photos` with a caption, alt text and an optional `focal` point (x/y in %)
   so faces are never cropped. Set `best: true` on the one used as your avatar.
3. Run `npm run build`. It creates the responsive WebP sizes and blur-up placeholders for you.

Other settings in `data.ts`: `formspree` (contact form endpoint), `browserUseIframe`
(embed live projects in the Browser app), `contactPage` (target of the BSOD QR code).

## Where things are

    src/main.js            3D room (three.js), camera moves, monitor overlay alignment
    src/app.js             boot screen, wires the scene to the desktop OS
    src/os/shell.ts        lock/sign-in, taskbar, Start menu, tray, wallpaper, shortcuts
    src/os/wm.ts           window manager (drag, resize, snap, minimize)
    src/os/apps/           terminal, explorer, photos, about, settings, task manager, mail, games...
    src/os/ui/             avatar slideshow, lightbox, memories, polaroids, ASCII art, blob hero
    src/os/img.ts          responsive image helper, avatar, initials fallback
    scripts/               image pipeline and HTML assembly

## Deploy

GitHub Pages: Settings > Pages > Deploy from a branch > `main` / `docs`.
Vercel or Netlify: build command `npm run build`, output directory `dist`.

## Notes

- Built with plain TypeScript and three.js, no React.
- Skill percentages, blog posts and project screenshots are placeholders. Replace them.
- Animations only move `transform` and `opacity` (the lightbox open uses a short clip-path morph)
  and every one falls back to a simple fade under `prefers-reduced-motion`.
- Alt+Tab is captured by browsers, so Alt+W also switches windows.
