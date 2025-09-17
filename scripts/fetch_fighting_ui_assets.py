#!/usr/bin/env python3
import os
import re
import sys
import json
import time
import shutil
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional

try:
    import requests
    from bs4 import BeautifulSoup  # type: ignore
except Exception as exc:  # pragma: no cover
    print("Missing dependencies. Please run: pip install requests beautifulsoup4", file=sys.stderr)
    sys.exit(2)


BASE_DIR = "/workspace/assets/fighting_ui"
DOWNLOAD_DIRS = {
    "ui": os.path.join(BASE_DIR, "ui"),
    "icons": os.path.join(BASE_DIR, "icons"),
    "fx": os.path.join(BASE_DIR, "fx"),
    "backgrounds": os.path.join(BASE_DIR, "backgrounds"),
    "fonts": os.path.join(BASE_DIR, "fonts"),
    "attribution": os.path.join(BASE_DIR, "attribution"),
}


HEADERS = {
    "User-Agent": "AssetFetcher/1.0 (+https://example.local)"
}


@dataclass
class AssetRecord:
    title: str
    source_url: str
    download_url: str
    license: str
    author: Optional[str]
    file_path: str
    category: str


def ensure_dirs() -> None:
    for path in DOWNLOAD_DIRS.values():
        os.makedirs(path, exist_ok=True)


def sanitize_filename(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-")
    return cleaned or "asset"


def http_get(url: str) -> requests.Response:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp


def parse_oga_item(page_url: str) -> Dict[str, Optional[str]]:
    resp = http_get(page_url)
    soup = BeautifulSoup(resp.text, "html.parser")

    title_el = soup.find("h1")
    title = title_el.get_text(strip=True) if title_el else page_url

    # License text
    license_text = None
    for lic_el in soup.select(".field-name-field-art-licenses .field-item"):
        text = lic_el.get_text(" ", strip=True)
        if text:
            license_text = text
            break
    if not license_text:
        # Fallback older layout
        lic_block = soup.find(string=re.compile(r"License", re.I))
        license_text = lic_block.strip() if isinstance(lic_block, str) else ""

    # Author
    author = None
    author_link = soup.select_one(".submitted a[rel='author'], .username a")
    if author_link:
        author = author_link.get_text(strip=True)

    # Attachments (direct files hosted by OGA)
    attachments: List[str] = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/"):
            href = "https://opengameart.org" + href
        if re.search(r"/sites/default/files/", href) and re.search(r"\.(zip|7z|png|gif|svg|ttf|otf|wav|ogg)$", href, re.I):
            attachments.append(href)

    attachments = list(dict.fromkeys(attachments))  # dedupe preserve order

    return {
        "title": title,
        "license": license_text or "",
        "author": author,
        "attachments": attachments,
    }


def download_file(url: str, dest_path: str) -> None:
    with requests.get(url, headers=HEADERS, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(dest_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)


def choose_category_from_filename(filename: str) -> str:
    lower = filename.lower()
    if any(k in lower for k in ["icon", "icons", "glyph", "button"]):
        return "icons"
    if any(k in lower for k in ["spark", "hit", "impact", "fx", "explosion"]):
        return "fx"
    if any(k in lower for k in ["background", "bg", "backdrop"]):
        return "backgrounds"
    if any(k in lower for k in ["font", ".ttf", ".otf"]):
        return "fonts"
    return "ui"


def fetch_and_store(page_url: str, manifest: List[AssetRecord]) -> None:
    meta = parse_oga_item(page_url)
    title = meta["title"] or page_url
    license_text = meta["license"] or ""
    author = meta["author"]
    attachments: List[str] = meta.get("attachments", [])  # type: ignore

    # Only accept permissive licenses: CC0 or Public Domain
    lic_lower = license_text.lower()
    is_permissive = ("cc0" in lic_lower) or ("public domain" in lic_lower) or ("pd" in lic_lower)
    if not is_permissive:
        print(f"Skipping due to license (not CC0/PD): {title} -> {license_text}")
        return

    if not attachments:
        print(f"No attachments found on: {page_url}")
        return

    for idx, att_url in enumerate(attachments, start=1):
        filename = sanitize_filename(os.path.basename(att_url.split("?")[0]))
        category = choose_category_from_filename(filename)
        dest_dir = DOWNLOAD_DIRS.get(category, DOWNLOAD_DIRS["ui"])
        dest_path = os.path.join(dest_dir, filename)

        try:
            print(f"Downloading {title} [{idx}/{len(attachments)}]: {att_url}")
            download_file(att_url, dest_path)
        except Exception as exc:  # pragma: no cover
            print(f"Failed to download {att_url}: {exc}")
            continue

        rec = AssetRecord(
            title=title,
            source_url=page_url,
            download_url=att_url,
            license=license_text,
            author=author,
            file_path=dest_path,
            category=category,
        )
        manifest.append(rec)


def main() -> int:
    ensure_dirs()

    # Curated OpenGameArt pages likely relevant to fighting UI (CC0 preferred)
    pages = [
        # Kenney UI Pack mirror on OGA (license may be CC0 or similar)
        "https://opengameart.org/content/ui-pack",
        # Health bars / HUD items (various authors; filter later by license text)
        "https://opengameart.org/content/health-bars",
        "https://opengameart.org/content/rpg-gui-construction-kit",
        # Hit sparks / effects
        "https://opengameart.org/content/hit-sparks",
        "https://opengameart.org/content/effects-and-explosions",
        # Numbers / fonts for timers and scores
        "https://opengameart.org/content/kenney-fonts",
    ]

    manifest: List[AssetRecord] = []

    for page in pages:
        try:
            fetch_and_store(page, manifest)
            time.sleep(0.5)
        except Exception as exc:  # pragma: no cover
            print(f"Error processing {page}: {exc}")
            continue

    # Filter to likely free licenses (CC0, public domain). Keep others but mark.
    result: List[Dict] = []
    for rec in manifest:
        result.append(asdict(rec))

    os.makedirs(DOWNLOAD_DIRS["attribution"], exist_ok=True)
    manifest_path = os.path.join(DOWNLOAD_DIRS["attribution"], "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"Wrote manifest: {manifest_path} ({len(result)} items)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

