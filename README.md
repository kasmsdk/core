# kasmsdk.github.io
KasmSDK Open Source community for web based musical instruments and tools

This is a shared space for projects built with the "Kasm SDK"

Kasm SDK is a paid product to support the Pyrmont Brewery in Sydney Australia
https://pyrmontbrewery.com/get_kasm


To get going/build contribute...

Fork this github repository and its submodules and clone it to your local machine.
[README.md](README.md)

git clone --recursive https://github.com/kasmsdk/core.git

Make things better, submit GitHub issues and PRs at
https://github.com/kasmsdk/core/issues


## Prerequisites

### Install Node.js and npm
- Download and install from [nodejs.org](https://nodejs.org/)
- On macOS, you can use Homebrew:
  ```sh
  brew install node
  ```

### Install Rust
- Install Rust using [rustup](https://rustup.rs/):
  ```sh
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```
- Follow the prompts to complete installation.

### Install wasm-pack
- After installing Rust, install wasm-pack via cargo:
  ```sh
  cargo install wasm-pack
  ```
- Or download from [wasm-pack official site](https://rustwasm.github.io/wasm-pack/).

## Build and Run

```sh
npm install
npm run dev
```

open http://localhost:5174


