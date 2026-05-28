# codex engine

OpenAI's Codex CLI. Used for both image (`gpt-image-1`) and video
(`sora-2`). Reads `OPENAI_API_KEY`.

```yaml
name: codex
kind: image+video
image_cmd: 'codex image generate --model {model} --prompt-file {prompt} --output {out} --size {size}'
video_cmd: 'codex video generate --model {model} --prompt-file {prompt} --output {out} --duration 3 --size {size}'
default_image_model: gpt-image-1
default_video_model: sora-2
env_required: [OPENAI_API_KEY]
size_map:
  "16:9": "1792x1024"
  "4:3":  "1408x1056"
  "1:1":  "1024x1024"
  "4:5":  "1024x1280"
```

Vendor pricing reference:
- gpt-image-1: see https://openai.com/api/pricing
- sora-2: see https://openai.com/api/pricing
