🧪 [testing] Add validation tests for registerWithPseudo

🎯 **What:** The testing gap addressed
This pull request adds missing validation unit tests for `registerWithPseudo` in `lib/supabase.ts:32`. The original code validates the user's handle and PIN length without providing a comprehensive set of tests.

📊 **Coverage:** What scenarios are now tested
This commit adds a suite covering the core validation logic in `registerWithPseudo`:
- Returning an error if the handle is too short after trimming and stripping '@'.
- Returning an error if the handle is completely empty or whitespace.
- Returning an error if the PIN is too short.
- Returning an error if the PIN is missing or whitespace.

✨ **Result:** The improvement in test coverage
We now have full test coverage for the synchronous validation phase in user registration. If this code logic changes and breaks validation, these unit tests will instantly catch the regression.
