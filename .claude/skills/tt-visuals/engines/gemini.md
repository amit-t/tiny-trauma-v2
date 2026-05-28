# gemini engine

Google's Gemini CLI. Used for both image (Imagen) and video (Veo)
generation. Reads `GEMINI_API_KEY` or falls back to `gcloud auth`.

```yaml
name: gemini
kind: image+video
image_cmd: 'gemini image generate --model {model} --prompt-file {prompt} --output {out} --aspect {aspect}'
video_cmd: 'gemini video generate --model {model} --prompt-file {prompt} --output {out} --duration 3 --aspect {aspect}'
default_image_model: imagen-4-ultra
default_video_model: veo-3
env_required: [GEMINI_API_KEY]
auth_fallback: 'gcloud auth print-access-token'
aspect_map:
  "16:9": "16:9"
  "4:3":  "4:3"
  "1:1":  "1:1"
  "4:5":  "4:5"
```

Vendor pricing reference (kept here, not embedded in code):
- Imagen 4 Ultra: see https://ai.google.dev/pricing
- Veo 3: see https://ai.google.dev/pricing
