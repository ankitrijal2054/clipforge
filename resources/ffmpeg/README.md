# FFmpeg Binaries Setup

This directory contains the FFmpeg binaries for different platforms. The application will automatically detect the platform and use the appropriate binary.

## Required Binaries

### macOS

- `ffmpeg-mac-arm64` - For Apple Silicon (M1/M2) Macs
- `ffmpeg-mac-x64` - For Intel Macs
- `ffprobe-mac-arm64` - FFprobe for Apple Silicon
- `ffprobe-mac-x64` - FFprobe for Intel Macs

### Windows

- `ffmpeg-win.exe` - FFmpeg for Windows
- `ffprobe-win.exe` - FFprobe for Windows

### Linux

- `ffmpeg-linux` - FFmpeg for Linux
- `ffprobe-linux` - FFprobe for Linux

## Download Instructions

### macOS (Apple Silicon)

```bash
wget https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip -O ffmpeg-mac-arm64.zip
unzip ffmpeg-mac-arm64.zip
mv ffmpeg ffmpeg-mac-arm64
chmod +x ffmpeg-mac-arm64

wget https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip -O ffprobe-mac-arm64.zip
unzip ffprobe-mac-arm64.zip
mv ffprobe ffprobe-mac-arm64
chmod +x ffprobe-mac-arm64
```

### macOS (Intel)

```bash
wget https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip -O ffmpeg-mac-x64.zip
unzip ffmpeg-mac-x64.zip
mv ffmpeg ffmpeg-mac-x64
chmod +x ffmpeg-mac-x64

wget https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip -O ffprobe-mac-x64.zip
unzip ffprobe-mac-x64.zip
mv ffprobe ffprobe-mac-x64
chmod +x ffprobe-mac-x64
```

### Windows

1. Download from: https://www.gyan.dev/ffmpeg/builds/
2. Extract `ffmpeg.exe` and rename to `ffmpeg-win.exe`
3. Extract `ffprobe.exe` and rename to `ffprobe-win.exe`

### Linux

```bash
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz
cp ffmpeg-*-amd64-static/ffmpeg ffmpeg-linux
cp ffmpeg-*-amd64-static/ffprobe ffprobe-linux
chmod +x ffmpeg-linux ffprobe-linux
rm -rf ffmpeg-*-amd64-static*
```

## Verification

After placing the binaries, you can verify they work by running:

```bash
# Test FFmpeg
./ffmpeg-[platform] -version

# Test FFprobe
./ffprobe-[platform] -version
```

## File Structure

```
resources/ffmpeg/
├── README.md
├── ffmpeg-mac-arm64
├── ffprobe-mac-arm64
├── ffmpeg-mac-x64
├── ffprobe-mac-x64
├── ffmpeg-win.exe
├── ffprobe-win.exe
├── ffmpeg-linux
└── ffprobe-linux
```

## Notes

- All binaries must be executable (chmod +x on Unix systems)
- The application will automatically detect the platform and use the correct binary
- If a binary is missing, the application will show an appropriate error message
- These binaries are not included in version control (see .gitignore)
