# Quick Start Guide

## Prerequisites Check

1. **Python 3.8+** installed
   ```bash
   python --version
   ```

2. **Ollama** installed and running
   ```bash
   ollama --version
   ollama serve
   ```

3. **Llama 3.1 8B model** pulled
   ```bash
   ollama pull llama3.1:8b
   ```

## Setup (5 minutes)

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Create `.env` file**:
   ```bash
   cp env.example .env
   ```

3. **Edit `.env`** (optional - defaults work for local Ollama):
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.1:8b
   GITHUB_TOKEN=your_token_here  # Optional
   API_PORT=8000
   ```

4. **Start the server**:
   ```bash
   python run.py
   ```

5. **Open browser**:
   ```
   http://localhost:8000
   ```

## First Review

### Option 1: Test with a Diff
1. Select "Paste Diff" as source
2. Paste this sample diff:
```diff
diff --git a/example.py b/example.py
index 1234567..abcdefg 100644
--- a/example.py
+++ b/example.py
@@ -1,3 +1,5 @@
 def calculate_sum(a, b):
-    return a + b
+    result = a + b
+    return result
```

3. Click "Start Review"
4. Wait 30-60 seconds for review to generate
5. Review suggestions and provide feedback

### Option 2: GitHub PR
1. Select "GitHub PR" as source
2. Paste GitHub PR URL (requires GITHUB_TOKEN in .env)
3. Click "Start Review"

## Testing the Learning Loop

1. **First Review**: Submit a review and accept/reject suggestions
2. **Second Review**: Submit a similar code pattern
3. **Check Statistics**: View the Statistics tab to see learning patterns
4. **Verify Learning**: The system should adjust suggestions based on your feedback

## Troubleshooting

### "Connection refused" to Ollama
- Make sure Ollama is running: `ollama serve`
- Check `OLLAMA_BASE_URL` in `.env`

### "Model not found"
- Pull the model: `ollama pull llama3.1:8b`
- Check `OLLAMA_MODEL` in `.env`

### "GitHub token error"
- GitHub integration is optional
- Use "Paste Diff" mode if you don't have a token

### Import errors
- Make sure you're running from project root
- Try: `python run.py` instead of `cd backend && python main.py`

### ChromaDB errors
- Delete `chroma_db` folder to reset
- Check `CHROMA_DB_PATH` in `.env`

## Next Steps

- Review the README.md for detailed documentation
- Check API docs at http://localhost:8000/docs
- Experiment with different code patterns
- Provide feedback to train the system


