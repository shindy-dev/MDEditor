import sys, os, urllib
import markdown
# markdown extensions (standard)
from markdown.extensions.extra import ExtraExtension
from markdown.extensions.toc import TocExtension
from markdown.extensions.nl2br import Nl2BrExtension
# markdown extensions (third-party)
from pymdownx.superfences import SuperFencesCodeExtension

"""
# パッケージング
npx electron-packager . MDEditor --platform=darwin --arch=x64 --overwrite

# electron 実行
npx electron .
"""

class Md2Html:
    temp = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" type="text/css" href="{css}" >
</head>
<body>
<div id="preview" class="container">
{content}
</div>
</body>
</html>
"""
    def __init__(self, html_path, css_path):
        self.exts=[
            ExtraExtension(), 
            TocExtension(slugify=lambda value, separator: urllib.parse.quote(value)),
            Nl2BrExtension(),
            SuperFencesCodeExtension()
        ]
        self.html_path = html_path
        self.css_path = css_path
    
    def convert(self, text: str, encoding: str='utf-8'):
        md = markdown.markdown(text, extensions=self.exts)
        with open(self.html_path, 'w', encoding=encoding) as f:
            f.write(Md2Html.temp.format(css=self.css_path, content=md))
        print(md)


if __name__ == '__main__':
    _, platform, html_path, css_path, source = sys.argv
    Md2Html(html_path, css_path).convert(source)