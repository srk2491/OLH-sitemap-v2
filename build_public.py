"""Create a public deployment folder; keep official tools out of that folder."""
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parent
FILES = ['index.html', 'style.css', 'upbeat.css', 'design.css', 'search-refine.css', 'language-parity.css', 'viewport-tuning.css', 'script.js', 'icons.js', 'core.js', 'locations.js', 'voice-search.js', 'accessibility.js', 'media.js', 'media-config.js', 'media-cloud.js', 'media-admin.html', 'media-admin.js', 'media-admin.css', 'site-board.html', 'ashraya_master_report.json']
DIRECTORIES = ['data', 'vendor', 'assets', 'media']


def build(destination=None):
    destination = Path(destination) if destination else ROOT / 'publish'
    if destination.exists():
        raise FileExistsError(f'{destination} already exists. Rename or back up that generated folder before rebuilding.')
    destination.mkdir(parents=True)
    for name in FILES:
        source = (ROOT / name).read_bytes()
        if name == 'script.js':
            source = source.decode('utf-8')
            if "preview=params.get('preview')==='1'" not in source and "preview=false" not in source:
                raise ValueError("Unknown preview setting; review before publishing.")
            source = source.replace("preview=params.get('preview')==='1'", 'preview=false').encode('utf-8')
        (destination / name).write_bytes(source)
    for directory in DIRECTORIES:
        for file in sorted((ROOT / directory).rglob('*')):
            if file.is_file() and file.name not in ('jszip.min.js', 'JSZIP-LICENSE.md'):
                target = destination / file.relative_to(ROOT)
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(file, target)
    print(destination)
    return destination


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else None)
