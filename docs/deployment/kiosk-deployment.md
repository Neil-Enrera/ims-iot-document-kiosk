# Kiosk Deployment & Hardware Configuration Guide

> **Task:** TASK-DEPLOYMENT-006
> **Date:** July 31, 2026

---

## 1. Hardware Installation

### Touchscreen Monitor
- Connect to kiosk computer
- Verify touch input works
- Set resolution to recommended

### Arduino Uno
- Connect via USB
- Upload firmware from `hardware/arduino/kiosk_rfid.ino`
- Verify COM port detected

### MFRC522 RFID Reader
- Connect to Arduino (SPI: SDA→D10, SCK→D13, MOSI→D11, MISO→D12, RST→D9)
- Connect 3.3V and GND
- Verify card reading

### USB Webcam
- Connect via USB
- Verify camera detected in Windows
- Test in browser

### Queue Slip Printer
- Connect via USB
- Install printer drivers if needed
- Load paper
- Test print

---

## 2. Arduino Firmware

Upload `hardware/arduino/kiosk_rfid.ino` using Arduino IDE:
1. Open Arduino IDE
2. Open `kiosk_rfid.ino`
3. Select board: Arduino Uno
4. Select correct COM port
5. Upload

---

## 3. Kiosk WebSocket Server

```bash
cd hardware/kiosk-server
npm install
npm start
```

Runs on port 3001.

---

## 4. Browser Configuration

### Chrome Kiosk Mode
```
chrome.exe --kiosk http://localhost:4200/kiosk
```

### Disable Sleep
- Windows Settings → Power → Never sleep
- Disable screensaver

### Auto-Start
Create shortcut in Windows Startup folder:
```
shell:startup
```

---

## 5. Resident Workflow Verification

1. **Idle Screen:** Kiosk displays welcome/search
2. **Search:** Type resident name → results shown
3. **Select:** Click resident → welcome screen
4. **Service:** Select document type
5. **Photo:** Capture via webcam
6. **Review:** Confirm details
7. **Submit:** Request created
8. **Receipt:** Queue slip printed
9. **Return:** Back to idle

---

## 6. Hardware Validation Checklist

- [ ] Touchscreen responsive
- [ ] Arduino connected
- [ ] RFID reader reads cards
- [ ] Webcam captures photos
- [ ] Printer prints queue slips
- [ ] Kiosk browser launches
- [ ] Backend API reachable
- [ ] Request submission works

---

*Document created: July 31, 2026*
