import json
from pathlib import Path
detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
print(f'Files: {detect.get("total_files", 0)}')
print(f'Words: {detect.get("total_words", 0)}')
print(f'Code: {len(detect.get("files", {}).get("code", []))}')
print(f'Doc: {len(detect.get("files", {}).get("document", []))}')