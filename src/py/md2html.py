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
npx electron-packager . MDEditor --platform=win32 --arch=x64 --overwrite

# electron 実行
npx electron .
"""

class Md2Html:
    def __init__(self):
        self.exts=[
            ExtraExtension(), 
            TocExtension(slugify=lambda value, separator: urllib.parse.quote(value)),
            Nl2BrExtension(),
            SuperFencesCodeExtension()
        ]
    def convert(self, text: str, encoding: str='utf-8'):
        print(markdown.markdown(text, extensions=self.exts, encoding=encoding))

if __name__ == '__main__':
    _, source = sys.argv
    Md2Html().convert(source)