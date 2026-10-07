# Rajveer Megwanshi: Video Editor Portfolio

A fast, static portfolio website (plain HTML, CSS and JavaScript, no build step, no server).
The entry file is **`index.html`**. It is ready for **GitHub Pages**.

## Put it online with GitHub Pages (about 5 minutes)

> **The one thing that matters:** `index.html` and the folders `css`, `js`, `assets`, `data`, `uploads` must all sit **side by side at the top level of the repository**. If the folders are missing, the site shows plain unstyled text and counters stuck at 0.

1. Sign in at <https://github.com> and click **New repository**. Name it (for example `rajveer-portfolio`), keep it **Public**, click **Create repository**.
2. Unzip this package on your computer and open the unzipped **rajveer-portfolio** folder. You will see `index.html` and the folders `css`, `js`, `assets`, `data`, `uploads`.
3. On the new repository page click **uploading an existing file**. **Drag the contents of that folder** (select everything inside it, `Ctrl+A`) into the GitHub page. Drag them. Do **not** use "choose your files", because that button cannot upload folders.
   - Wait until GitHub lists every file, including the ones inside `css/`, `js/`, `assets/`, `data/` and `uploads/`, then click **Commit changes**.
   - Do not upload the outer `rajveer-portfolio` folder itself, only what is inside it.
4. Add the hidden file `.nojekyll`: click **Add file → Create new file**, type `.nojekyll` as the name, and commit (leave it empty). It is also inside the zip, but hidden files are sometimes skipped when dragging.
5. Open **Settings → Pages**. Under **Build and deployment** set **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, and click **Save**.
6. Wait one to two minutes, then open your address, for example `https://YOUR-USERNAME.github.io/rajveer-portfolio/`.

**Check it worked:** add `/css/style.css` to the end of your address. You should see lines of code, not "404". If you see 404, the `css` folder is not at the top level of the repository (open the repository's file list and compare it with step 2).

Want your own domain? In **Settings → Pages → Custom domain** enter it and follow GitHub's DNS instructions. Nothing in the site needs changing.

### If the live site looks like plain unstyled text
* A red bar at the bottom of the page names the missing file. It means that folder was not uploaded to the top level of the repository. Upload the missing folder (drag it into the repository page via **Add file → Upload files**) and commit.
* Hard-refresh with `Ctrl+Shift+R` after fixing, because browsers and GitHub cache files for a few minutes.

## Files

| Path | What it is |
|---|---|
| `index.html` | Home page (entry file) |
| `portfolio.html`, `services.html`, `about.html`, `awards.html`, `contact.html` | The other pages |
| `404.html` | Friendly "page not found" page (GitHub Pages uses it automatically) |
| `admin.html` | Your private Admin Panel (see below) |
| `css/`, `js/`, `assets/` | Design, code, favicon and placeholder photo |
| `data/site-data.js` | **All your editable content.** The Admin Panel produces a new version of this file |
| `uploads/` | Your pictures and `uploads/videos/` for your project videos |
| `.nojekyll`, `robots.txt` | GitHub Pages and search-engine settings |

## Editing your website (no code)

GitHub Pages cannot run server code, so the Admin Panel works in **test mode** and you publish with one zip:

1. Open **`admin.html`** (from the unzipped folder on your computer, in Chrome or Edge, or from your live site).
2. Sign in with **`admin`** / **`Admin@123`**, then immediately change them under **Settings & Security**.
3. Edit anything: text, services and prices, awards, projects, images, videos, contact details, colour theme. Click **Save changes**. Your pages in that browser update instantly.
4. To show the changes to everyone: **Settings & Security → Download publish bundle**. Unzip it.
5. In your GitHub repository choose **Add file → Upload files**, drag in the `data` folder (and the `uploads` folder if present), click **Commit changes**.
6. Reload your live site after a minute or two (GitHub caches files for about ten minutes, so use a hard refresh: Ctrl+Shift+R).

### Pictures and videos

* Upload pictures in the Admin Panel. The publish bundle turns them into normal image files in `uploads/`.
* A project video can be added with **Upload Project Video**. It is included in the bundle as `uploads/videos/...`.
* **GitHub limits:** files uploaded through the website must be under **25 MB** each, and any file over **100 MB** is refused. For long or large videos, upload them to a video or storage service (YouTube-unlisted is *not* supported, but Cloudinary, Bunny, S3 or similar are) and paste the direct `https://...mp4` link in the project's *"Or link a video that is already online"* box. Videos only load when a visitor presses play, so pages stay fast.
* Best video format for visitors: **MP4 (H.264)**, 1080p or lower.

### About the Admin Panel's password on GitHub Pages

On a static site the password only protects the screen in *your own browser*. Anyone who opens `admin.html` can only change their own private copy, never your live website, because the live site only reads the files in your repository. Even so, the cleanest setup is to **keep `admin.html`, `js/admin.js` and `css/admin.css` out of the repository** and run the Admin Panel from the folder on your computer. Then publish the bundle as above.

## Local preview

Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit <http://localhost:8000>.

## Credits

Fonts: Sora and Inter via Google Fonts. No other third-party code.
