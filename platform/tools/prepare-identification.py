"""Import the supplied teaching package without publishing restricted image originals."""
import argparse
import json
from pathlib import Path, PurePosixPath
from zipfile import ZipFile


def prepare(archive: Path) -> None:
    frontend = Path(__file__).resolve().parent.parent / "frontend"
    with ZipFile(archive) as package:
        entries = [name for name in package.namelist() if name.endswith('/content.json')]
        if len(entries) != 1:
            raise ValueError('Expected exactly one content.json')
        prefix = entries[0].removesuffix('content.json')
        data = json.loads(package.read(entries[0]).decode('utf-8-sig'))
        asset_ids = {a['asset_id'] for a in data['assets']}
        card_ids = {c['card_id'] for c in data['cards']}
        question_ids = {q['question_id'] for q in data['questions']}
        if not set(data['default_route']) <= question_ids:
            raise ValueError('Default route references a missing question')
        for question in data['questions']:
            if not set(question['asset_ids']) <= asset_ids or not set(question['card_ids']) <= card_ids:
                raise ValueError(f"Missing reference in {question['question_id']}")
        assets = []
        output = frontend / 'public/media/identification'
        output.mkdir(parents=True, exist_ok=True)
        for asset in data['assets']:
            path = PurePosixPath(asset['path'])
            if path.parts[0] != 'assets' or '..' in path.parts or path.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp'}:
                raise ValueError('Unexpected asset path')
            content = package.read(prefix + str(path))
            (output / path.name).write_bytes(content)
            fields = ['asset_id', 'caption', 'kind', 'creator', 'license', 'license_url', 'source_url', 'notes', 'changes']
            assets.append({**{k: asset.get(k, '') for k in fields}, 'path': '/media/identification/' + path.name})
        public_data = {k: data[k] for k in ['version', 'date', 'audience', 'scope', 'default_route', 'case_tabs', 'cards', 'questions', 'references']}
        public_data['assets'] = assets
        target = frontend / 'src/course/identification.json'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(public_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f"Prepared {len(assets)} images, {len(data['cards'])} cards and {len(data['questions'])} questions. Images remain Git-ignored.")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    prepare(parser.parse_args().archive)
