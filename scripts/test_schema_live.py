import json
import time

from core.llm import get_llm, as_text
from core.schemas import Analysis

RESUME = """Alex Sample. Backend developer, 3 years. Built REST APIs in Python and Flask
serving 50k users. Worked with PostgreSQL and Docker. Wrote unit tests with pytest."""

JD = """Backend Engineer. Required: Python, REST APIs, PostgreSQL, Kubernetes.
Preferred: AWS, CI/CD. 3+ years of experience."""

PROMPT = (
    "Compare this resume with the job description. Be concise: at most 5 matched skills, "
    "5 missing skills, 5 keywords and 3 bullet fixes. Use only facts from the resume.\n\n"
    f"RESUME:\n{RESUME}\n\nJD:\n{JD}"
)


def run(label, fn):
    print(f"\n--- {label}", flush=True)
    start = time.time()
    try:
        out = fn()
        print(f"OK in {time.time() - start:.1f}s", flush=True)
        if hasattr(out, "overall_score"):
            print("Overall score:", out.overall_score)
        return out
    except Exception as e:
        print(f"FAILED in {time.time() - start:.1f}s: {type(e).__name__}: {str(e)[:200]}", flush=True)


def structured(method=None, **llm_kwargs):
    llm = get_llm(timeout=60, **llm_kwargs)
    kw = {"method": method} if method else {}
    return llm.with_structured_output(Analysis, **kw).invoke(PROMPT)


def raw_json():
    llm = get_llm(timeout=60)
    schema = json.dumps(Analysis.model_json_schema())
    msg = llm.invoke(
        PROMPT + "\n\nReturn ONLY valid JSON matching this JSON schema, no markdown:\n" + schema
    )
    text = as_text(msg).strip()
    text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return Analysis.model_validate_json(text)


run("A: default + output cap", lambda: structured(max_output_tokens=3000))
run("B: json_schema method", lambda: structured("json_schema", max_output_tokens=3000))
run("C: function_calling method", lambda: structured("function_calling", max_output_tokens=3000))
run("D: thinking_budget=0", lambda: structured(max_output_tokens=3000, thinking_budget=0))
run("E: raw JSON + manual parse", raw_json)