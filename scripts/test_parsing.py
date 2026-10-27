import sys
from pathlib import Path

from core.parsing import extract_text, ParseError


def main(folder: str = "data/samples"):
    for path in sorted(Path(folder).iterdir()):
        if path.name.startswith("."):
            continue
        print("=" * 70)
        print(path.name)
        try:
            text = extract_text(path.read_bytes(), path.name)
            print(f"OK: {len(text)} chars")
            print(text[:400])
        except ParseError as e:
            print(f"ParseError: {e}")


if __name__ == "__main__":
    main(*sys.argv[1:])