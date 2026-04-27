
import json

# Mock AI fix
fix = {
    "branch_name": "ai-fix-demo",
    "commit_message": "🤖 Auto-fix for demo failure",
    "confidence": 0.95,
    "file_changes": [
        {
            "file": "backend/tests/demo.test.js",
            "content": "// Fixed by AI: mark as passing test\nconsole.log('Test auto-fixed');"
        }
    ]
}

with open("fix.json", "w") as f:
    json.dump(fix, f, indent=2)

print("AI fix generated")
