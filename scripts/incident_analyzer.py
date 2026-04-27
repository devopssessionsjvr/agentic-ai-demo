
import json

# Mock analysis output
analysis = {
    "issues": [
        {"file": "demo.test.js", "error": "Test failed", "severity": "high"}
    ]
}

with open("analysis.json", "w") as f:
    json.dump(analysis, f, indent=2)

print("AI analysis generated")
