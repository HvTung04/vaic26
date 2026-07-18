"""Quick smoke test of the full pipeline on docs/test.pdf."""
import os, sys
from pathlib import Path

# Load .env
env_path = Path(__file__).resolve().parents[2] / ".env"
for line in env_path.read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        os.environ[k.strip()] = v.strip()

# Ensure backend package importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ingestion.pipeline import intake_file

test_pdf = Path(__file__).resolve().parents[2] / "docs" / "test.pdf"
print(f"model: {os.environ.get('GAPLENS_LLM_MODEL', 'gpt-4o')}")
print(f"key present: {bool(os.environ.get('OPENAI_API_KEY'))}")
print(f"input: {test_pdf} ({test_pdf.stat().st_size // 1024} KB)")
print()

try:
    drafts = intake_file(str(test_pdf))
    print(f"--- {len(drafts)} questions drafted ---")
    print()
    for d in drafts:
        print(f"[{d.index}] {d.text[:150]}")
        parts = []
        parts.append(f"node={d.knowledge_node}")
        parts.append(f"diff={d.difficulty}")
        parts.append(f"conf={d.confidence:.2f}")
        print(f"    {', '.join(parts)}")
        if d.options:
            print(f"    opts: {' | '.join(o.key + '=' + o.text[:30] for o in d.options)}")
        print()
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    import traceback; traceback.print_exc()
