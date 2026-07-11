# Texas Venom Redesign 2

A standalone, CMS-driven Texas Venom site contained entirely in `venom-redesign2/`.

## Public site

The site is a JSON-driven single-page application with routes for:

- Home
- Teams
- 12U roster
- Tournament hub
- Family portal
- Sponsors
- Contact

All editable content is stored in:

```text
venom-redesign2/content/site.json
```

## CMS

Open:

```text
/venom-redesign2/admin/
```

The CMS connects directly to the GitHub Contents API. It does not contain or store a repository credential.

Create a fine-grained GitHub personal access token restricted to `jeremiah9980/venom` with:

```text
Repository permissions → Contents → Read and write
```

Paste that token into the CMS. It is kept in `sessionStorage`, which means it remains only in the current browser tab/session and is not committed to GitHub.

Choose the target branch, edit content, enter a commit message, and select **Save and publish**. The CMS updates `content/site.json` through a normal GitHub commit.

## Security notes

- Never place a GitHub token in HTML, JavaScript, JSON, or repository secrets exposed to the browser.
- Use a fine-grained token restricted to this one repository.
- Give the token only `Contents: Read and write` permission.
- Set an expiration date and revoke it when it is no longer needed.
- For multi-user production use, replace token entry with a GitHub OAuth application and a server-side token exchange.

## Local preview

From the repository root:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080/venom-redesign2/
```

The CMS uses the GitHub API, so saving still requires a valid GitHub token and an existing branch.
