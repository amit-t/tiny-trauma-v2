# devin engine

Cognition's Devin CLI. Acts as a passthrough that delegates to whichever
image model it has access to. tt-visuals treats it as image-capable.

```yaml
name: devin
kind: image+video
image_cmd: 'devin run --task "generate image: $(cat {prompt})" --output {out}'
video_cmd: 'devin run --task "generate 3s video: $(cat {prompt})" --output {out}'
default_image_model: passthrough
default_video_model: passthrough
env_required: []
```

Devin auth is per-session; the CLI prompts on first use.
