#!/usr/bin/env python3
"""Create isolated UI proposal copies of a static site.

Example:
    python3 tools/proposal_preview.py create home-refresh --title "Home refresh"

The generated copy is written to proposals/<slug>/ and can be published by
GitHub Pages without changing the production site at the repository root.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROPOSALS = ROOT / "proposals"

EXCLUDED_TOP_LEVEL = {
    ".git",
    ".github",
    ".idea",
    ".vscode",
    "node_modules",
    "proposals",
    "tools",
}
EXCLUDED_NAMES = {".DS_Store", "Thumbs.db"}
TEXT_SUFFIXES = {".html", ".htm", ".css", ".js", ".json", ".xml", ".txt", ".md"}


def valid_slug(value: str) -> str:
    slug = value.strip().lower()
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,62}", slug):
        raise argparse.ArgumentTypeError(
            "Use 1-63 lowercase letters, numbers, or hyphens; start with a letter or number."
        )
    return slug


def should_skip(relative: Path) -> bool:
    return (
        not relative.parts
        or relative.parts[0] in EXCLUDED_TOP_LEVEL
        or any(part in EXCLUDED_NAMES for part in relative.parts)
        or any(part.startswith(".") and part not in {".well-known"} for part in relative.parts)
    )


def copy_site(destination: Path) -> int:
    copied = 0
    for source in ROOT.rglob("*"):
        relative = source.relative_to(ROOT)
        if should_skip(relative):
            continue
        target = destination / relative
        if source.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        copied += 1
    return copied


def inject_preview_banner(html: str, title: str, slug: str) -> str:
    marker = "data-proposal-preview-banner"
    if marker in html:
        return html

    banner = f"""
<div {marker} style="position:sticky;top:0;z-index:2147483647;padding:10px 16px;background:#111827;color:#fff;font:600 14px/1.35 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.28)">
  UI PROPOSAL: {title} &nbsp;·&nbsp; <code style="color:#fde68a">{slug}</code> &nbsp;·&nbsp; Not production
</div>
""".strip()

    noindex = '<meta name="robots" content="noindex,nofollow">'
    if "</head>" in html and "name=\"robots\"" not in html and "name='robots'" not in html:
        html = html.replace("</head>", f"  {noindex}\n</head>", 1)

    body_match = re.search(r"<body\b[^>]*>", html, flags=re.IGNORECASE)
    if body_match:
        position = body_match.end()
        return html[:position] + "\n" + banner + html[position:]
    return banner + "\n" + html


def rewrite_proposal_files(destination: Path, slug: str, title: str, repo_path: str) -> None:
    proposal_base = f"/{repo_path.strip('/')}/proposals/{slug}/"
    production_base = f"/{repo_path.strip('/')}/"

    for path in destination.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        # Keep copied pages inside the proposal when production-root URLs are used.
        content = content.replace(production_base, proposal_base)
        if path.suffix.lower() in {".html", ".htm"}:
            content = inject_preview_banner(content, title, slug)
        path.write_text(content, encoding="utf-8")


def create(args: argparse.Namespace) -> None:
    destination = PROPOSALS / args.slug
    if destination.exists():
        if not args.force:
            raise SystemExit(
                f"Proposal '{args.slug}' already exists. Use --force to replace it."
            )
        shutil.rmtree(destination)

    destination.mkdir(parents=True, exist_ok=True)
    copied = copy_site(destination)
    rewrite_proposal_files(destination, args.slug, args.title, args.repo_path)

    manifest = {
        "slug": args.slug,
        "title": args.title,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": "repository root",
        "copied_files": copied,
        "preview_path": f"/{args.repo_path.strip('/')}/proposals/{args.slug}/",
    }
    (destination / "proposal.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )

    print(f"Created proposal: {destination.relative_to(ROOT)}")
    print(f"Copied files: {copied}")
    print(
        "Preview after commit/push: "
        f"https://<github-user>.github.io/{args.repo_path.strip('/')}/proposals/{args.slug}/"
    )
    print(f"Edit files only inside: proposals/{args.slug}/")


def list_proposals(_: argparse.Namespace) -> None:
    if not PROPOSALS.exists():
        print("No proposals found.")
        return
    found = False
    for directory in sorted(path for path in PROPOSALS.iterdir() if path.is_dir()):
        found = True
        manifest_path = directory / "proposal.json"
        title = directory.name
        if manifest_path.exists():
            try:
                title = json.loads(manifest_path.read_text(encoding="utf-8")).get("title", title)
            except (json.JSONDecodeError, OSError):
                pass
        print(f"{directory.name:24} {title}")
    if not found:
        print("No proposals found.")


def delete(args: argparse.Namespace) -> None:
    destination = PROPOSALS / args.slug
    if not destination.exists():
        raise SystemExit(f"Proposal '{args.slug}' does not exist.")
    shutil.rmtree(destination)
    print(f"Deleted proposals/{args.slug}/")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    create_parser = subparsers.add_parser("create", help="Copy the current site into a proposal subsite")
    create_parser.add_argument("slug", type=valid_slug)
    create_parser.add_argument("--title", default="UI change proposal")
    create_parser.add_argument(
        "--repo-path",
        default=ROOT.name,
        help="GitHub Pages repository path (default: repository directory name)",
    )
    create_parser.add_argument("--force", action="store_true", help="Replace an existing proposal")
    create_parser.set_defaults(func=create)

    list_parser = subparsers.add_parser("list", help="List proposal subsites")
    list_parser.set_defaults(func=list_proposals)

    delete_parser = subparsers.add_parser("delete", help="Delete a proposal subsite")
    delete_parser.add_argument("slug", type=valid_slug)
    delete_parser.set_defaults(func=delete)
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        args.func(args)
        return 0
    except KeyboardInterrupt:
        print("Cancelled.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
