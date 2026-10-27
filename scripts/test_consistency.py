import statistics
from concurrent.futures import ThreadPoolExecutor

from core.analyzer import analyze
from scripts.test_analyzer import SAMPLE_RESUME, JD

RUNS = 3

with ThreadPoolExecutor(max_workers=RUNS) as pool:
    results = list(pool.map(lambda _: analyze(SAMPLE_RESUME, JD), range(RUNS)))

scores = [r.overall_score for r in results]
print("Scores:", scores)
print("Std dev:", round(statistics.pstdev(scores), 1))
for i, r in enumerate(results, 1):
    print(f"Run {i} missing required:",
          [s.skill for s in r.missing_skills if s.importance == "required"])