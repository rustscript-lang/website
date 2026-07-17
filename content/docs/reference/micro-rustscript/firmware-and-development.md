<!-- docs-title: Firmware and development -->


## Framework API from RSS

Hardware functions are exposed through built-in RSS modules, keeping the C host ABI private. Import
only the capabilities a script uses:

```rust
use gpio;
use i2c;
use mcu;
use serial;
use wifi;
use bluetooth;

let ok: bool = gpio::configure(8, 1);
let written: bool = gpio::digital_write(8, true);
let level: bool = gpio::digital_read(8);

let bus_ready: bool = i2c::open(8, 9, 400000);
let status: int = i2c::transmit_register(0x3c, 0, b"hello");
let reply: bytes = i2c::receive_register(0x3c, 0, 8);
i2c::close();

mcu::delay_ms(100);
let free_heap: int = mcu::free_heap();
serial::write_line("ready");

let started: bool = wifi::connect("ssid", "password");
let address: string = wifi::local_ip();
let ble_ready: bool = bluetooth::enable();
```

API coverage is target-dependent. ESP32-C3 provides GPIO, ADC, PWM, I2C, MCU, serial, Wi-Fi, and BLE
controller functions. ESP32-S31 currently provides digital GPIO, core MCU timing/status, serial
output, Wi-Fi, and BLE controller functions. The Arduino host target provides a small GPIO,
`delay_ms`, and serial-output simulation subset.

See **[Framework API reference](docs/framework-api.md)** for the complete support matrix, RSS
signatures, argument limits, return behavior, asynchronous Wi-Fi semantics, BLE scope, and C host
callback contract.

## Replace only the VMBC partition

The application image remains intact when only the script partition is flashed. The helper accepts
an RSS source file or an already compiled VMBC file, derives the offset and capacity from
`partitions.csv`, adds a versioned length/CRC header, and calls esptool:

```bash
python scripts/flash_vmbc.py programs/my-app.rss --port /dev/ttyACM0
python scripts/flash_vmbc.py app.vmbc --port /dev/ttyACM0
```

Create a partition image without connecting a board:

```bash
python scripts/flash_vmbc.py app.vmbc --output app.partition.bin
```

RSS input compilation uses `rustscript-compile-vmbc` from `PATH`, or the compiler binary in this
checkout through Cargo. A raw `.vmbc` file can be copied directly to the SD path; SD files do not
use the flash-partition header.

## Serial REPL

When neither startup source exists, the firmware accepts both the legacy VMBC commands and an
interactive source REPL. Build and start the source REPL on the development machine:

```bash
cargo build --release --bin rustscript-serial-repl
./target/release/rustscript-serial-repl /dev/ttyACM0 115200
```

The prompt follows `pd-vm-run`: enter one expression or statement at a time and expression results
are printed immediately. Bindings, mutations, type metadata, and moved-value state carry across
entries. Delimiter-based multiline input uses the `...>` prompt; `.cancel` clears pending input,
`.clear` clears session locals, and `.quit` exits.

```text
rss> let mut x = 40;
rss> x = x + 2;
rss> x
=> 42
```

Source compilation stays on the development machine. Each entry is sent as VMBC plus its current
local values using fixed-length binary frames; the firmware contains only the decoder and
interpreter.

The existing `load`, `install`, `run`, `info`, and `help` commands remain available. To send a
precompiled payload directly:

```bash
python -m pip install pyserial
python scripts/repl_vmbc.py app.vmbc --port /dev/ttyACM0
python scripts/repl_vmbc.py app.vmbc --port /dev/ttyACM0 --install
```

## Build

The repository root is a complete PlatformIO project:

```bash
export UV_TOOL_DIR=/mnt/TEMP/platformio/tools
export UV_TOOL_BIN_DIR=/mnt/TEMP/platformio/bin
export UV_CACHE_DIR=/mnt/TEMP/platformio/uv-cache
export PLATFORMIO_CORE_DIR=/mnt/TEMP/platformio/core
uv tool install platformio==6.1.19
export PATH=/mnt/TEMP/platformio/bin:$PATH

pio run -e esp32-c3-devkitm-1
pio run -e arduino
ci/install-esp-idf-s31.sh
pio run -e esp32s31
.pio/build/arduino/program
```

Outputs:

```text
.pio/build/esp32-c3-devkitm-1/firmware.elf
.pio/build/esp32-c3-devkitm-1/firmware.bin
.pio/build/arduino/program
.pio/build/esp32s31/program
.pio/generated/esp32-blinky.vmbc
.pio/generated/rustscript.partition.bin
dist/micro-rustscript-esp32-c3.factory.bin
dist/micro-rustscript-esp32-s31.factory.bin
/mnt/TEMP/micro-rustscript-esp32s31/build/micro_rustscript_esp32s31.elf
```

Each ESP factory image merges its bootloader, partition table, and application. The C3 factory image
also includes the packed default script partition. The release includes both factory images, both
ELFs, the Arduino host executable, VMBC assets and helpers for C3, and SHA-256 checksums.

The `esp32s31` target uses pinned ESP-IDF master preview support. ESP-IDF source, Python environment,
toolchains, caches, Rust target artifacts, generated files, and build output are all kept under
`/mnt/TEMP`; only source and build configuration live in the repository.

The `arduino` environment links `pd-vm-nostd` through an Arduino-compatible GPIO, delay, serial,
and allocator bridge. It runs the bridge and compiled VMBC program on the host before a board is
connected. A successful simulation ends with `rss:status=0`.

## ESP32-C3 image size

The ESP32-C3 partition table uses a 1 MiB factory application slot and a 64 KiB VMBC slot. OTA data
and SPIFFS partitions are omitted because this image is flashed directly and script updates use the
dedicated VMBC partition. With `wifi` and `bluetooth` enabled, the measured factory image is
1,115,607 bytes, down from 2,164,183 bytes (48.45%), while retaining SD boot, the flash script,
and the serial VMBC REPL.
