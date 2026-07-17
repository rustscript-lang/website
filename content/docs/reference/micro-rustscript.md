# micro-rustscript

[![rustscript-embedded on crates.io](https://img.shields.io/crates/v/rustscript-embedded.svg)](https://crates.io/crates/rustscript-embedded)

A portable RustScript VMBC runtime with release targets for ESP32-C3, ESP32-S31 preview hardware,
and a native Arduino API simulator. Each ESP factory image contains its bootloader, partition table,
platform runtime, `pd-vm-nostd`, framework host bridge, and a default VMBC program.

## Flash complete images

### ESP32-C3

Download `micro-rustscript-esp32-c3.factory.bin` from the latest GitHub Release and flash it at
offset zero:

```bash
python -m esptool --chip esp32c3 erase_flash
python -m esptool --chip esp32c3 write_flash 0x0 micro-rustscript-esp32-c3.factory.bin
```

The ESP32-C3 boot order is fixed:

1. `/rustscript/main.vmbc` on an SD card connected with CS on GPIO 7.
2. The dedicated 64 KiB `rustscript` flash partition at `0x110000`.
3. The serial VMBC REPL at 115200 baud.

An absent, unreadable, or missing SD script automatically falls through to the flash partition.
The release factory image already contains `esp32-blinky.vmbc` in that partition.
`RUSTSCRIPT_SD_CS` and `RUSTSCRIPT_SD_PATH` can be overridden with PlatformIO build flags.

### ESP32-S31 preview

Download `micro-rustscript-esp32-s31.factory.bin` and flash the merged image at offset zero:

```bash
python -m esptool --chip esp32s31 write_flash 0x0 micro-rustscript-esp32-s31.factory.bin
```

The S31 preview image currently embeds the default VMBC program into the application at build time.
Its runtime does not yet implement the C3 SD-card lookup, replaceable flash VMBC partition, or serial
VMBC REPL. The release also includes the S31 ELF for debugging.

## Targets and source layout

| PlatformIO environment | Purpose | Platform integration | Main source |
|---|---|---|---|
| `esp32-c3-devkitm-1` | Flashable ESP32-C3 firmware | Official PlatformIO board plus Arduino-ESP32 and selected ESP-IDF APIs | shared `firmware/` sources |
| `esp32s31` | Flashable ESP32-S31 preview firmware | Pinned ESP-IDF master preview toolchain | `esp32s31/` CMake project |
| `arduino` | Native host simulation of a small Arduino API subset | PlatformIO `native` plus `firmware/simulator/` | `firmware/arduino/main.cpp` |

Only ESP32-S31 has a top-level target directory because current PlatformIO releases do not provide
an ESP32-S31 board definition or framework package. Its directory supplies the ESP-IDF project
files that PlatformIO cannot generate: `CMakeLists.txt`, `sdkconfig.defaults`, partition layout, and
the pure ESP-IDF application entry point. ESP32-C3 can use PlatformIO's standard
`esp32-c3-devkitm-1` board and therefore shares the normal `firmware/` project. The `arduino` target
is a native simulator rather than separate hardware; its target-specific source already lives under
`firmware/arduino/` and reuses the simulator compatibility layer.

All three are still first-class PlatformIO and release targets. The directory shape reflects their
different build systems, not a difference in release status.
