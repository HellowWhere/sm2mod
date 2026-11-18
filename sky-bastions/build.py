#!/usr/bin/env python3
"""Собирает sky-bastions/index.html из файлов в sky-bastions/src/.

Запуск:  python3 sky-bastions/build.py
         python3 sky-bastions/build.py --fragment путь/к/файлу.html
--fragment дополнительно пишет версию без <html>/<head>/<body> для встраивания в другую страницу.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
TITLE = "Небесные Бастионы"
FONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Russo+One&family=Rubik:wght@500;700;800&display=swap">\n'
)


def read(path):
    return path.read_text(encoding="utf-8")


def build():
    css = read(SRC / "style.css")
    body = read(SRC / "body.html")
    js = "\n".join(read(p) for p in sorted((SRC / "js").glob("*.js")))
    script = "<script>\n(function(){\n'use strict';\n" + js + "\n})();\n</script>\n"
    style = "<style>\n" + css + "</style>\n"
    fragment = (
        f"<title>{TITLE}</title>\n"
        '<meta name="claude:viewport-fit-sides" content="cover">\n'
        + FONTS + style + "\n" + body + "\n" + script
    )
    page = (
        "<!doctype html>\n<html lang=\"ru\">\n<head>\n<meta charset=\"utf-8\">\n"
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n'
        '<meta name="theme-color" content="#3f95e6">\n'
        f"<title>{TITLE}</title>\n" + FONTS + style
        + "</head>\n<body>\n" + body + "\n" + script + "</body>\n</html>\n"
    )
    return page, fragment


def main(argv):
    page, fragment = build()
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    print("index.html:", len(page.encode("utf-8")), "байт")
    if "--fragment" in argv:
        out = pathlib.Path(argv[argv.index("--fragment") + 1])
        out.write_text(fragment, encoding="utf-8")
        print(out, len(fragment.encode("utf-8")), "байт")


if __name__ == "__main__":
    main(sys.argv[1:])
