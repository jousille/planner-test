# Manual QA — Planner TEST

Use https://jousille.github.io/planner-test/ only after enabling Pages.

1. Red TEST label visible and app opens without a real token.
2. Demo task +3 and -5, two habits +3 and +5.
3. Mark habit: day, week and month totals increase by exactly the habit weight.
4. Unmark it and ensure totals return to baseline.
5. Habit wheel uses correct dates and excludes future days.
6. Profile → Import accepts a downloaded production backup. Import copies data into sandbox; never uploads JSON to GitHub.
7. Archived habits retain historical energy; new habits start denominator from creation date.
8. Old weekly marks survive import and can be toggled.
9. Refresh and verify persistence; install PWA and refresh after deployment.
10. Production site /inamora/planner/ remains unchanged.
