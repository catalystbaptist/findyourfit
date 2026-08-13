# Catalyst Find Your Fit

A static, embeddable volunteer opportunity discovery tool built from the Catalyst volunteer taxonomy workbook.

## Preview locally

Serve this folder with any static web server, then open `index.html` through that server. Loading the file directly will not load `data/roles.json` in most browsers.

## Publish with GitHub Pages

1. Create a public GitHub repository named `volunteer-find-your-fit`.
2. Upload the contents of this `site` folder to the repository root.
3. In **Settings → Pages**, set **Source** to **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.

## Embed in Tithe.ly

Replace `YOUR-GITHUB-USERNAME` in the snippet below and add it through the Tithe.ly page source editor:

```html
<iframe
  id="catalyst-find-your-fit"
  src="https://YOUR-GITHUB-USERNAME.github.io/volunteer-find-your-fit/"
  title="Find Your Fit — Catalyst volunteer opportunities"
  width="100%"
  height="1800"
  style="border:0; width:100%; display:block;"
  loading="lazy"
></iframe>
<script>
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'catalyst-find-your-fit:resize') {
      document.getElementById('catalyst-find-your-fit').style.height = event.data.height + 'px';
    }
  });
</script>
```

## Updating roles

Keep the OneDrive workbook as the source of truth. Re-export `roles.json` after taxonomy changes, then replace that file in GitHub.
