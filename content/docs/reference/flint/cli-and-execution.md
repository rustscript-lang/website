<!-- docs-title: CLI and execution -->


## CLI

The `flint` binary has explicit modes:

```text
flint --llm --device cuda:0 --script scripts/lfm2.rss --model <weights> --tokenizer <tokenizer.json> --system-prompt <system> --prompt <text> [--n-predict 128] [--ignore-eos]
flint --llm --device cuda:0 --script scripts/lfm2_5.rss --model <weights> --tokenizer <tokenizer.json> --system-prompt <system> --prompt <text> [--n-predict 128] [--model-kind 0|1] [--image <image>]
flint --llama --script scripts/llama_quantized.rss --model <model.gguf> --prompt <text> [llama options]
flint --llm --script scripts/xlm_roberta_ner_japanese.rss --model <weights> --tokenizer <tokenizer.json> --text <text> [--ctx-size 128] [--labels <csv>]
flint --llm --script scripts/flux_klein_encode_prompt.rss --model <qwen3.safetensors> --tokenizer <tokenizer.json> --prompt <text> --output <prompt.safetensors>
flint --lama --weights model.safetensors --image input.png --mask mask.png --output output.png [--device cuda:0]
flint --sd --script scripts/flux_klein.rss --diffusion-model <model> --vae <vae> --llm <llm> --prompt <text> --output <output.png> [SD options]
flint --sd --script scripts/ggml_devices.rss [--backend cpu|cuda|vulkan]
flint --sd --script scripts/ggml_devices_from_path.rss --path <runtime-directory>
```

`--llm` runs Torch-based RustScript model programs. `--llama` runs llama.cpp
programs, and `--sd` runs stable-diffusion.cpp or GGML programs through the
native runner. `--lama` is the dedicated LAMA image inpainting command and is
unrelated to llama.cpp.

For `--llm` and `--lama`, omitting `--device` selects `cuda:0` when CUDA is
available and otherwise falls back to CPU. Passing `--device` accepts `cpu`,
`cuda`, `cuda:N`, `mps`, or `vulkan`. Model-specific arguments after `--script`
are registered by the RSS program and parsed by `flint::cli` host functions.

### RSS command-line arguments

CLI-facing programs use the host-backed `flint::cli` API, modeled after Rust's
`argparse` crate. A program creates an argument parser, attaches typed
references with `refer<T>`, registers `Store`, `StoreOption`, `StoreTrue`, or
`StoreFalse` actions, and calls `parse_args` once. Named options accept
`--name value`, `--name=value`, and aliases. Required values, positional
arguments, generated help, integers, floats, strings, and boolean flags are
handled by the host parser.

The embedded `stdlib::rss::cli` module supplies generic `option<T>`,
`required_option<T>`, and `get<T>` helpers while leaving registration and
parsing in the host. Scripts therefore retain RustScript type information
without duplicating parsing logic.

Flint embeds the complete RustScript RSS standard library at compile time and
registers it as module source overrides. `compile_script_file` applies the same
module setup for library users, so RSS programs may import modules such as
`stdlib::rss::parse` without a RustScript source checkout at runtime.

`--llama` runs native llama.cpp RSS programs without loading LibTorch. The
`scripts/llama_quantized.rss` program loads GGUF quantized weights directly,
builds the prompt with the model chat template, runs batched prompt decode,
and performs the token generation loop in RustScript. Its `--backend` argument
accepts `auto`, `cpu`, `cuda`, `vulkan`, or a compatible llama.cpp runtime
directory.

| Option | Alias | Default | Meaning |
|---|---|---:|---|
| `--model` | `-m` | required | GGUF model path |
| `--prompt` | `-p` | required | User prompt |
| `--system-prompt` | `-sys` | helpful assistant | System prompt |
| `--n-predict`, `--predict` | `-n` | `128` | Maximum generated tokens |
| `--ctx-size` | `-c` | `2048` | Context size |
| `--batch-size` | `-b` | `2048` | Logical batch size |
| `--ubatch-size` | `-ub` | `512` | Physical batch size |
| `--gpu-layers`, `--n-gpu-layers` | `-ngl` | `999` | Layers assigned to GPU |
| `--main-gpu` | `-mg` | `0` | Main GPU index |
| `--threads` | `-t` | `8` | Generation threads |
| `--threads-batch` | `-tb` | `8` | Prompt batch threads |
| `--temp` | | `0.7` | Sampling temperature |
| `--top-k` | | `40` | Top-k sampling |
| `--top-p` | | `0.95` | Top-p sampling |
| `--min-p` | | `0.0` | Min-p sampling |
| `--seed` | `-s` | `42` | Sampling seed |
| `--backend` | | `auto` | Package name or runtime directory |
| `--mmap`, `--no-mmap` | | mmap enabled | Control memory mapping |
| `--mlock` | | off | Lock model pages in memory |
| `--ignore-eos` | | off | Continue after end-of-generation tokens |
| `--chat-template` | | model default | Override the model chat template |

At koharu commit `3a832b5`, the bundled llama.cpp `b9938` context layout is
newer than the header used by `koharu-llama-sys`. Until those upstream pieces
are aligned, pass a compatible runtime directory such as `b8665` as the
`backend` argument.

`scripts/flux_klein.rss` builds a FLUX.2 Klein text-to-image run from the
low-level `flint::diffusion::*` API backed by `koharu-diffusion`. The native
stable-diffusion.cpp runtime is packaged by `koharu-runtime`; pass the FLUX.2
Klein diffusion model, VAE, and Qwen3 text encoder paths explicitly.

`scripts/flux_klein_encode_prompt.rss` runs a Qwen3 text encoder with
RustScript torch operations and writes a koharu-ml-compatible prompt embedding
file. The safetensors file contains one tensor named `prompt_embeds`; for
Qwen3-4B FLUX.2 Klein this is expected to be `[1, 512, 7680]`. Torch scripts
can reload that tensor with `flint::tensor::load_safetensors`; the current
`flux_klein.rss` SD path still supplies `llm_path` to stable-diffusion.cpp.

`scripts/xlm_roberta_ner_japanese.rss` is a token classification example for
`tsmatz/xlm-roberta-ner-japanese`. It implements the XLM-RoBERTa encoder and
classifier from torch host functions in RustScript; the host only provides
generic tensor, tokenizer, and formatting helpers.

`scripts/lfm2.rss` implements LFM2-350M text generation and translation from
Torch host functions. `scripts/lfm2_5.rss` supports both LFM2.5-230M text
generation and LFM2.5-VL-450M image input; `--model-kind 0` selects text and
`--model-kind 1 --image <path>` selects VL.
