# UI Proposal Preview Tool

This repository can publish complete, isolated copies of the site beneath:

```text
https://jeremiah9980.github.io/venom/proposals/<proposal-name>/
```

The live site at the repository root is not changed when you edit a proposal copy.

## Create a proposal

From the repository root:

```bash
python3 tools/proposal_preview.py create homepage-redesign --title "Homepage redesign"
```

This copies the current static site into:

```text
proposals/homepage-redesign/
```

Every copied HTML page receives a visible **UI PROPOSAL — Not production** banner and a `noindex,nofollow` robots tag. URLs that explicitly reference `/venom/` are rewritten to remain inside the proposal subsite.

## Work on the proposed design

Edit only the generated proposal directory:

```text
proposals/homepage-redesign/index.html
proposals/homepage-redesign/assets/css/style.css
proposals/homepage-redesign/assets/js/...
```

Preview it locally:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080/proposals/homepage-redesign/
```

Commit and push the proposal directory to publish the review URL without replacing the production root site.

## Commands

```bash
# List proposal copies
python3 tools/proposal_preview.py list

# Rebuild an existing proposal from the current production site
python3 tools/proposal_preview.py create homepage-redesign --title "Homepage redesign" --force

# Remove a proposal copy
python3 tools/proposal_preview.py delete homepage-redesign
```

## Approval workflow

1. Create the proposal copy.
2. Make all UI changes inside `proposals/<name>/`.
3. Push and share the proposal URL for review.
4. After approval, apply the approved edits to the production files at the repository root in a separate branch or pull request.
5. Delete the proposal directory after production deployment.

The tool intentionally does not auto-promote proposal files. Keeping promotion manual prevents proposal banners, preview metadata, or unfinished assets from being copied into production accidentally.
