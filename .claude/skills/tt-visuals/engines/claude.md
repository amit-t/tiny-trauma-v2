# claude engine

Anthropic's Claude CLI. **No native image generation.** Used by tt-visuals
exclusively for prompt drafting (`--draft-engine claude`, the default) and
the future vision QA step. Passing `--engine claude` to `tt-visuals` is a
usage error.

```yaml
name: claude
kind: text-only
image_cmd: null
video_cmd: null
default_text_model: claude-opus-4-7
env_required: [ANTHROPIC_API_KEY]
```
