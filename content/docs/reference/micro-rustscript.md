# micro-rustscript

## Targets and images

micro-rustscript provides complete images for ESP32-C3 and an ESP32-S31 preview target. The ESP32-C3 runtime can load `/rustscript/main.vmbc` from SD, then from the dedicated VMBC flash partition, then through the serial VMBC REPL. The native Arduino target is used for host-side development and smoke coverage.

## Source layout

The project contains target-specific firmware, a bootloader, partition definitions, the platform runtime, `pd-vm-nostd`, the RSS framework host bridge, default VMBC content, and build tooling. Factory images package those components together.

## RSS framework API

RSS programs use framework namespaces for board and device services, including GPIO, I2C, MCU timing, serial, Wi-Fi, and Bluetooth where the selected target provides them. The framework API is a host-function contract; target support and hardware behavior remain explicit runtime concerns.

## VMBC updates and build limits

The VMBC partition can be replaced independently of a full image. The serial REPL provides an alternative program-loading route. The build documentation records ESP32-C3 image-size constraints and the supported build targets.
