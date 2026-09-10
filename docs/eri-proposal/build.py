#!/usr/bin/env python3
"""Build PDF + DOCX from the ERI markdown drafts. macOS-native (Chrome + textutil)."""
import os
import base64
import subprocess
import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "dfc-logo.png")
with open(LOGO, "rb") as _f:
    LOGO_B64 = base64.b64encode(_f.read()).decode("ascii")
DOCS = [
    "00-DFC-ERI-Proposal-v0.1.md",
    "01-DFC-ERI-Costing-Model-v0.1.md",
]

CSS = """
@page { size: A4; margin: 20mm 18mm; }
* { box-sizing: border-box; }
body {
  font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
  font-size: 11pt; line-height: 1.5; color: #1a1a1a; max-width: 100%;
}
h1 { font-size: 21pt; color: #0b3d2e; border-bottom: 3px solid #0b3d2e; padding-bottom: 8px; margin-top: 0; }
h2 { font-size: 15pt; color: #0b3d2e; margin-top: 26px; border-bottom: 1px solid #d4d4d4; padding-bottom: 4px; }
h3 { font-size: 12.5pt; color: #155041; margin-top: 18px; }
p, li { font-size: 11pt; }
strong { color: #111; }
em { color: #333; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9.5pt; }
th, td { border: 1px solid #c8c8c8; padding: 6px 9px; text-align: left; vertical-align: top; }
th { background: #0b3d2e; color: #fff; font-weight: 600; }
tr:nth-child(even) td { background: #f4f7f5; }
blockquote {
  border-left: 4px solid #c79a3a; background: #fbf6ea; margin: 14px 0;
  padding: 10px 16px; color: #4a3c18; border-radius: 3px;
}
code { background: #eef2ef; padding: 1px 5px; border-radius: 3px; font-size: 9pt; }
hr { border: none; border-top: 1px solid #ddd; margin: 22px 0; }
a { color: #155041; text-decoration: none; }
.dfc-logo { height: 58px; margin: 0 0 18px 0; display: block; }
"""

HTML_TMPL = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>{css}</style></head>
<body><img class="dfc-logo" src="dfc-logo.png" alt="Doctors Foundation for Care"/>{body}</body></html>"""

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

for md_name in DOCS:
    base = md_name[:-3]
    md_path = os.path.join(HERE, md_name)
    html_path = os.path.join(HERE, base + ".html")
    pdf_path = os.path.join(HERE, base + ".pdf")
    docx_path = os.path.join(HERE, base + ".docx")

    with open(md_path, encoding="utf-8") as f:
        text = f.read()

    body = markdown.markdown(
        text, extensions=["tables", "fenced_code", "attr_list", "sane_lists"]
    )
    html = HTML_TMPL.format(css=CSS, body=body, logo=LOGO_B64)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    # PDF via Chrome headless
    subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
         f"--print-to-pdf={pdf_path}", "file://" + html_path],
        check=True, capture_output=True,
    )
    # DOCX via pandoc (embeds logo + tables). Prepend a centered logo to a temp
    # markdown so the source .md files stay clean.
    tmp_md = os.path.join(HERE, "_tmp_" + md_name)
    with open(tmp_md, "w", encoding="utf-8") as f:
        f.write(f'![Doctors Foundation for Care](dfc-logo.png){{width=2.4in}}\n\n')
        f.write(text)
    subprocess.run(
        ["pandoc", tmp_md, "-o", docx_path, "--resource-path", HERE],
        check=True, capture_output=True, cwd=HERE,
    )
    os.remove(tmp_md)
    print(f"OK  {base}: PDF + DOCX")

print("done")
