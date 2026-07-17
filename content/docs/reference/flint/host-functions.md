<!-- docs-title: Host functions and configuration -->


## Host functions

All functions are registered under the `flint` namespace.

### CLI

Host-backed command-line parsing modeled after `argparse::ArgumentParser` and
its typed references:

```text
flint::cli::argument_parser
flint::cli::set_description
flint::cli::refer
flint::cli::add_option
flint::cli::add_argument
flint::cli::required
flint::cli::metavar
flint::cli::parse_args
flint::cli::get
```

`refer` and `get` preserve the reference value type through the generic
`stdlib::rss::cli` facade. `add_option` accepts an array of aliases and one of
the argparse action names `Store`, `StoreOption`, `StoreTrue`, or `StoreFalse`.

### Runtime

Runtime arguments, host inputs, outputs, and tensor lifetime control:

```text
flint::runtime::args
flint::runtime::arg
flint::runtime::arg_or
flint::runtime::arg_int
flint::runtime::arg_int_or
flint::runtime::arg_float_or
flint::runtime::input
flint::runtime::set_output
flint::runtime::set_text_output
flint::runtime::start_timer
flint::runtime::start_decode_timer
flint::runtime::set_token_count
flint::runtime::set_decode_token_count
flint::runtime::compact2
```

`args` returns all script arguments as a string array. Individual arguments can
also be addressed by zero-based index. `set_output` publishes a tensor handle,
while `set_text_output` publishes generated text. Timer and token-count
functions populate the timing and count fields returned by `ScriptTextOutput`;
the CLI uses them to print throughput. The compact helper keeps long-running
scripts from retaining unused temporary tensors.

### GGML

GGML backend discovery helpers:

```text
flint::ggml::load_backends
flint::ggml::list_devices
flint::ggml::stable_diffusion_package_dir
flint::ggml::load_stable_diffusion_backends
flint::ggml::list_stable_diffusion_devices
```

`load_backends` and `list_devices` accept a directory containing `ggml.dll` or
`libggml.so`, or a file inside that directory. The stable-diffusion helpers
select the packaged ggml runtime with the same backend strings accepted by the
SD host functions.

### Diffusion

Low-level stable-diffusion.cpp host functions:

```text
flint::diffusion::ctx_params_init
flint::diffusion::ctx_params_set_paths
flint::diffusion::ctx_params_set_backend
flint::diffusion::ctx_params_set_wtype
flint::diffusion::ctx_params_set_vae_format
flint::diffusion::ctx_params_set_flags
flint::diffusion::new_sd_ctx
flint::diffusion::free_sd_ctx
flint::diffusion::img_gen_params_init
flint::diffusion::img_gen_params_set_prompt
flint::diffusion::img_gen_params_set_size
flint::diffusion::img_gen_params_set_sample
flint::diffusion::img_gen_params_set_sampler
flint::diffusion::str_to_sample_method
flint::diffusion::str_to_scheduler
flint::diffusion::sample_method_name
flint::diffusion::scheduler_name
flint::diffusion::get_default_sample_method
flint::diffusion::get_default_scheduler
flint::diffusion::generate_image
flint::diffusion::images_save
flint::diffusion::free_sd_images
```

The `flint::diffusion::*` functions expose C API-shaped resource handles backed by
the owning context, parameter, and image types from `koharu-diffusion`.
Optional backend strings follow sd.cpp names such as `cpu`, `cuda0`, or
assignment specs like `te=cpu,vae=cpu,diffusion=cuda0`. Passing `cpu`, `cuda*`,
or `vulkan*` also selects the matching packaged stable-diffusion.cpp runtime;
`auto` keeps koharu-runtime's automatic choice.

`scripts/flux_klein.rss` accepts `--sampling-method` and `--scheduler`. Use
`auto` to keep stable-diffusion.cpp defaults, or pass upstream names such as
`euler`, `euler_a`, `dpm++2m`,
`dpm++2m_sde`, `flux2`, `simple`, `karras`, or `beta`.

### Llama

`flint::llama::*` exposes the `koharu-llama` inference objects as independent
handles. GGUF quantization is retained by llama.cpp during model loading and
execution.

```text
flint::llama::backend_init
flint::llama::backend_supports_gpu_offload
flint::llama::backend_list_devices
flint::llama::backend_free
flint::llama::model_params_init
flint::llama::model_params_set_gpu_layers
flint::llama::model_params_set_main_gpu
flint::llama::model_params_set_memory
flint::llama::model_load
flint::llama::model_free
flint::llama::model_n_ctx_train
flint::llama::model_n_vocab
flint::llama::model_tokenize
flint::llama::model_is_eog
flint::llama::chat_template
flint::llama::chat_messages_init
flint::llama::chat_messages_add
flint::llama::apply_chat_template
flint::llama::chat_free
flint::llama::tokens_len
flint::llama::tokens_get
flint::llama::tokens_free
flint::llama::context_params_init
flint::llama::context_params_set_sizes
flint::llama::context_params_set_threads
flint::llama::context_new
flint::llama::context_n_ctx
flint::llama::context_decode
flint::llama::context_free
flint::llama::batch_init
flint::llama::batch_add
flint::llama::batch_add_sequence
flint::llama::batch_clear
flint::llama::batch_free
flint::llama::sampler_chain_init
flint::llama::sampler_add_top_k
flint::llama::sampler_add_top_p
flint::llama::sampler_add_min_p
flint::llama::sampler_add_temp
flint::llama::sampler_add_dist
flint::llama::sampler_add_greedy
flint::llama::sampler_chain_build
flint::llama::sampler_sample
flint::llama::sampler_accept
flint::llama::sampler_free
flint::llama::decoder_init
flint::llama::decoder_push
flint::llama::decoder_free
```

### Cache

Named tensor storage for state shared across steps within one execution:

```text
flint::cache::clear
flint::cache::has
flint::cache::get
flint::cache::set
```

### Tokenizer

Tokenizer loading, chat encoding, incremental token collection, decoding, and
end-of-sequence checks:

```text
flint::tokenizer::load
flint::tokenizer::encode_chat
flint::tokenizer::encode_vl_chat
flint::tokenizer::encode_padded
flint::tokenizer::format_token_labels
flint::tokenizer::decode_generated
flint::tokenizer::append_token
flint::tokenizer::append_token_tensor
flint::tokenizer::clear_generated_tokens
flint::tokenizer::push_generated_token_tensor
flint::tokenizer::decode_generated_tokens
flint::tokenizer::single_token
flint::tokenizer::is_eos
```

Load a tokenizer before encoding or decoding. Token tensors remain native
tensors and are passed through the VM as handles. `encode_padded` returns a
pair: local is padded input ids and global is the attention mask.

### Weights

Safetensors loading and lookup:

```text
flint::weights::load
flint::weights::get
flint::weights::get_indexed
flint::weights::get_or
flint::weights::get_optional
```

`load` reads a safetensors file, or every `.safetensors` file in a directory,
onto the runner device. `get` resolves a tensor by key, `get_indexed` formats
layer names from prefix/index/suffix, and `get_or` supports alternative keys for
model formats that use different parameter names. `get_optional` returns handle
`0` when a key is absent.

### Pairs

Two-handle return values used by fused operations and local/global branches:

```text
flint::pair::new
flint::pair::local
flint::pair::global
```

### Tensor operations

Shape inspection, casting, construction, arithmetic, indexing, activation,
layout, complex tensors, FFT, and pooling:

```text
flint::tensor::size
flint::tensor::shape
flint::tensor::save_safetensors
flint::tensor::load_safetensors
flint::tensor::to_float
flint::tensor::to_bfloat16
flint::tensor::ones_like
flint::tensor::zeros_like
flint::tensor::zeros_like_int
flint::tensor::arange
flint::tensor::arange_start
flint::tensor::causal_mask
flint::tensor::causal_padding_mask
flint::tensor::padding_mask
flint::tensor::rope_cos
flint::tensor::rope_sin
flint::tensor::rope_cos_at
flint::tensor::rope_sin_at
flint::tensor::add
flint::tensor::sub
flint::tensor::mul
flint::tensor::add_scalar
flint::tensor::mul_scalar
flint::tensor::div_scalar
flint::tensor::pow_scalar
flint::tensor::mean_dim
flint::tensor::rsqrt
flint::tensor::neg
flint::tensor::cos
flint::tensor::sin
flint::tensor::matmul
flint::tensor::softmax
flint::tensor::masked_fill
flint::tensor::cat2
flint::tensor::stack2
flint::tensor::chunk
flint::tensor::narrow
flint::tensor::tail
flint::tensor::transpose
flint::tensor::unsqueeze
flint::tensor::repeat_interleave
flint::tensor::argmax
flint::tensor::argmax_int
flint::tensor::argmax_token
flint::tensor::pad_reflect2d
flint::tensor::relu
flint::tensor::sigmoid
flint::tensor::silu
flint::tensor::gelu
flint::tensor::swiglu
flint::tensor::contiguous
flint::tensor::permute3
flint::tensor::permute4
flint::tensor::permute5
flint::tensor::view2
flint::tensor::view3
flint::tensor::view4
flint::tensor::view5
flint::tensor::select
flint::tensor::real
flint::tensor::imag
flint::tensor::complex
flint::tensor::fft_rfftn2
flint::tensor::fft_irfftn2
flint::tensor::avg_pool2d_2
```

Tensor operations accept opaque tensor handles and return a new handle unless
the function name indicates a scalar result, such as `size` or `argmax_int`.
Rank-specific functions such as `view3` and `permute4` take that number of
dimensions explicitly. The safetensors helpers read and write one named tensor;
use the name `prompt_embeds` for FLUX prompt embedding files.

### Neural network operations

Common model layers and fused inference operations:

```text
flint::nn::embedding
flint::nn::linear
flint::nn::layer_norm
flint::nn::swiglu_linear
flint::nn::rms_norm
flint::nn::add_rms_norm
flint::nn::apply_rope
flint::nn::apply_rope_pair
flint::nn::scaled_dot_product_attention
flint::nn::scaled_dot_product_attention_masked
flint::nn::conv1d
flint::nn::conv1d_step
flint::nn::conv2d
flint::nn::conv_transpose2d
flint::nn::batch_norm2d
```

Fused functions may return a pair handle. Use `flint::pair::local` and
`flint::pair::global` to access each tensor result. For optional tensor
arguments such as a linear bias, handle `0` represents no tensor.

### Vision operations

Image preprocessing and multimodal tensor layout helpers used by LFM2.5-VL:

```text
flint::image::lfm2_vl_patches
flint::vl::siglip2_position_embedding
flint::vl::pixel_unshuffle2
flint::vl::scatter_image_embeddings
```

The image helper reads an image path and returns model-ready patches. The VL
helpers keep the SigLIP2 position, pixel layout, and image-token scatter logic
inside generic tensor operations rather than a model-sized host function.

## Configuration

- `KOHARU_TORCH_WEIGHT_KIND` selects the floating-point kind used while loading
  weights: `native`, `half`, `bf16`, or `float`. The default is `float`; use
  `native` to preserve the source tensor kind.
- `KOHARU_TORCH_LINEAR_MV=0` disables the single-token matrix-vector fast path,
  which is enabled by default.
- `KOHARU_TORCH_PROFILE_OPS=1` prints aggregate Torch host-operation timings
  after execution.

## Links

- [Flint repository](https://github.com/rustscript-lang/flint)
- [Examples](https://github.com/rustscript-lang/flint/tree/main/examples)
- [RustScript model programs](https://github.com/rustscript-lang/flint/tree/main/scripts)
- [RustScript](https://github.com/rustscript-lang/rustscript)
- [Koharu](https://github.com/mayocream/koharu)
