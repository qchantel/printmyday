# PrintMyDay

Electron app to print your daily tasks on a receipt printer.

## Demo
https://github.com/user-attachments/assets/b3facded-ba17-4514-85d2-d704bd09002e

## Development

```bash
npm install
npm start
```

## Build (will automatically build for your distro)

Will only work on Unix-like systems (Linux, macOS) that support the `lpr` command (CUPS printing system). Windows users will need to adapt the printing functionality in `main.js` to use Windows-specific printing commands.

```bash
npm install
npm run make
```

Builds will be in `out/make/` directory.
