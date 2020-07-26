import sys, os
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
    html_format = """<!DOCTYPE html>
<html lang="ja">
<head>
    <title>Title</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" >
    <link rel="stylesheet" type="text/css" href="{}" >
</head>
<body>
<div id="preview_children" class="container">
    {}
</div>
</body>
</html>
"""
    def __init__(self, html_path, css_path):
        self.exts=[
            ExtraExtension(), 
            TocExtension(slugify=lambda value, separator: value),
            Nl2BrExtension(),
            SuperFencesCodeExtension()
        ]
        self.html_path = html_path
        self.css_path = css_path
    
    def convert(self, text: str, encoding: str='utf-8'):
        #md = Md2Html.html_format.format(markdown.markdown(text, extensions=self.exts))
        md = markdown.markdown(text, extensions=self.exts)
        with open(self.html_path, 'w', encoding=encoding) as f:
            f.write(Md2Html.html_format.format(self.css_path, md))
        print(md)


if __name__ == '__main__':
    _, platform, html_path, css_path, source = sys.argv
    Md2Html(html_path, css_path).convert(source)