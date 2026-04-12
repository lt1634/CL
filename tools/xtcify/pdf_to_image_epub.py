#!/usr/bin/env python3
"""
Rasterize each PDF page to PNG (pdftoppm) and pack a minimal EPUB3 for x4converter / xtcify.
Usage:
  python3 pdf_to_image_epub.py --pdf /path/book.pdf [--out /path/out.epub] [--scale-to 1200]
  python3 pdf_to_image_epub.py --pdf book.pdf --one-document
    (single XHTML + page-breaks — 部分 WASM 轉檔站對「一書一檔」較穩)
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import tempfile
import uuid
import zipfile
from pathlib import Path


def run_pdftoppm(
    pdf: Path, img_dir: Path, scale_to: int, *, fmt: str, jpeg_quality: int
) -> tuple[list[Path], str]:
    """Return (image paths sorted, image media suffix without dot, e.g. png or jpeg)."""
    img_dir.mkdir(parents=True, exist_ok=True)
    prefix = str(img_dir / "page")
    if fmt == "jpeg":
        cmd = [
            "pdftoppm",
            "-jpeg",
            "-jpegopt",
            f"quality={jpeg_quality}",
            "-scale-to",
            str(scale_to),
            str(pdf),
            prefix,
        ]
        glob_pat = "page-*.jpg"
        ext = "jpeg"
        media = "image/jpeg"
    else:
        cmd = ["pdftoppm", "-png", "-scale-to", str(scale_to), str(pdf), prefix]
        glob_pat = "page-*.png"
        ext = "png"
        media = "image/png"
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"pdftoppm failed: {r.stderr or r.stdout}")
    paths = sorted(img_dir.glob(glob_pat))
    if not paths:
        raise RuntimeError(f"pdftoppm produced no {glob_pat}")
    return paths, ext


def build_epub(
    page_images: list[Path],
    title: str,
    epub_out: Path,
    *,
    img_ext: str,
    img_media_type: str,
    one_document: bool,
) -> None:
    work = Path(tempfile.mkdtemp(prefix="epubimg_"))
    try:
        oebps = work / "OEBPS"
        img_dir = oebps / "images"
        img_dir.mkdir(parents=True)
        meta = work / "META-INF"
        meta.mkdir(parents=True)
        n = len(page_images)

        for i, src in enumerate(page_images):
            dest = img_dir / f"page{i+1:04d}.{img_ext}"
            shutil.copy2(src, dest)

        uid = f"urn:uuid:{uuid.uuid4()}"
        nav_items = []
        manifest_items = [
            '    <item id="css" href="style.css" media-type="text/css"/>',
            '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
        ]
        spine_refs = []

        if one_document:
            # One spine entry; page breaks between images for paginated engines.
            css = (
                "body{margin:0;padding:0;text-align:center;}\n"
                "img{max-width:100%;height:auto;display:block;page-break-after:always;break-after:page;}\n"
                "img.last{page-break-after:auto;break-after:auto;}\n"
            )
            (oebps / "style.css").write_text(css, encoding="utf-8")
            imgs_html = []
            for i in range(1, n + 1):
                cls = "last" if i == n else ""
                imgs_html.append(
                    f'  <img src="images/page{i:04d}.{img_ext}" alt="Page {i}" class="{cls}"/>'
                )
                manifest_items.append(
                    f'    <item id="img{i:04d}" href="images/page{i:04d}.{img_ext}" media-type="{img_media_type}"/>'
                )
                nav_items.append(f'    <li><a href="content.xhtml#page{i}">Page {i}</a></li>')
            (oebps / "content.xhtml").write_text(
                f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="zh-Hant">
<head>
  <meta charset="UTF-8"/>
  <title>{title}</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body epub:type="bodymatter">
{chr(10).join(imgs_html)}
</body>
</html>
""",
                encoding="utf-8",
            )
            manifest_items.append(
                '    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>'
            )
            spine_refs.append('    <itemref idref="content"/>')
        else:
            css = "body{margin:0;padding:0;text-align:center;} img{max-width:100%;height:auto;}\n"
            (oebps / "style.css").write_text(css, encoding="utf-8")
            for i in range(1, n + 1):
                pid = f"p{i:04d}"
                iid = f"img{i:04d}"
                fname = f"page{i:04d}.xhtml"
                manifest_items.append(
                    f'    <item id="{pid}" href="{fname}" media-type="application/xhtml+xml"/>'
                )
                manifest_items.append(
                    f'    <item id="{iid}" href="images/page{i:04d}.{img_ext}" media-type="{img_media_type}"/>'
                )
                spine_refs.append(f'    <itemref idref="{pid}"/>')
                (oebps / fname).write_text(
                    f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="zh-Hant">
<head>
  <meta charset="UTF-8"/>
  <title>Page {i}</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body epub:type="bodymatter">
  <img src="images/page{i:04d}.{img_ext}" alt="Page {i}"/>
</body>
</html>
""",
                    encoding="utf-8",
                )
                nav_items.append(f'    <li><a href="{fname}">Page {i}</a></li>')

        (oebps / "nav.xhtml").write_text(
            f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="zh-Hant">
<head>
  <meta charset="UTF-8"/>
  <title>目錄</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>目錄</h1>
    <ol>
{chr(10).join(nav_items)}
    </ol>
  </nav>
</body>
</html>
""",
            encoding="utf-8",
        )

        opf = f"""<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>{title}</dc:title>
    <dc:language>zh-Hant</dc:language>
    <dc:identifier id="bookid">{uid}</dc:identifier>
  </metadata>
  <manifest>
{chr(10).join(manifest_items)}
  </manifest>
  <spine>
{chr(10).join(spine_refs)}
  </spine>
</package>
"""
        (oebps / "content.opf").write_text(opf, encoding="utf-8")

        (meta / "container.xml").write_text(
            """<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
""",
            encoding="utf-8",
        )

        epub_out.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(epub_out, "w") as z:
            z.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)
            z.write(meta / "container.xml", "META-INF/container.xml")
            z.write(oebps / "content.opf", "OEBPS/content.opf")
            z.write(oebps / "nav.xhtml", "OEBPS/nav.xhtml")
            z.write(oebps / "style.css", "OEBPS/style.css")
            if one_document:
                z.write(oebps / "content.xhtml", "OEBPS/content.xhtml")
            else:
                for i in range(1, n + 1):
                    z.write(oebps / f"page{i:04d}.xhtml", f"OEBPS/page{i:04d}.xhtml")
            for i in range(1, n + 1):
                z.write(
                    img_dir / f"page{i:04d}.{img_ext}",
                    f"OEBPS/images/page{i:04d}.{img_ext}",
                )
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main() -> None:
    ap = argparse.ArgumentParser(description="PDF pages → image EPUB for xtcify")
    ap.add_argument("--pdf", required=True, type=Path)
    ap.add_argument("--out", type=Path, help="Output .epub path (default: same stem as PDF)")
    ap.add_argument("--scale-to", type=int, default=1200, help="Long edge px for raster (default 1200)")
    ap.add_argument(
        "--format",
        choices=("jpeg", "png"),
        default="jpeg",
        help="Raster format (default jpeg — smaller, better for x4converter WASM)",
    )
    ap.add_argument("--jpeg-quality", type=int, default=80, help="With --format jpeg (default 80)")
    ap.add_argument("--title", default="", help="EPUB title (default: PDF stem)")
    ap.add_argument(
        "--one-document",
        action="store_true",
        help="Single content.xhtml + CSS page-breaks (建議給 x4converter / 圖片為主 PDF)",
    )
    args = ap.parse_args()
    pdf = args.pdf.resolve()
    if not pdf.is_file():
        raise SystemExit(f"PDF not found: {pdf}")
    out = args.out.resolve() if args.out else pdf.with_suffix(".epub")
    title = args.title or pdf.stem

    tmp = Path(tempfile.mkdtemp(prefix="pdfppm_"))
    try:
        paths, img_ext = run_pdftoppm(
            pdf,
            tmp,
            args.scale_to,
            fmt=args.format,
            jpeg_quality=args.jpeg_quality,
        )
        media = "image/jpeg" if img_ext == "jpeg" else "image/png"
        build_epub(
            paths,
            title,
            out,
            img_ext=img_ext,
            img_media_type=media,
            one_document=args.one_document,
        )
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    print(out)


if __name__ == "__main__":
    main()
