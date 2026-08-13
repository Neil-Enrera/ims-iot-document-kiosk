# Kiosk Deployment & Hardware Configuration Guide

> **Task:** TASK-DEPLOYMENT-006
> **Date:** July 31, 2026

---

## 1. Hardware Installation

### Touchscreen Kiosk Tablet
- Connect to the kiosk host / network
- Verify touch input works
- Set resolution to recommended
- Webcam is attached to the tablet (see Webcam below)

### ESP8266 (RFID controller)
- Connect the ESP8266 to the kiosk host via USB
- Flash the RFID firmware sketch (`hardware/arduino/kiosk_rfid.ino`)
- Verify COM port detected

### MFRC522 RFID Reader
- Connect to the ESP8266 over SPI (see the firmware sketch for the pin mapping)
- Connect 3.3V and GND
- Verify card reading

### USB Webcam
- Attached to and used by the kiosk tablet
- Verify camera detected
- Test in browser

### Queue Slip Printer
- Connect via USB
- Install printer drivers if needed
- Load paper
- Test print

---

## 2. ESP8266 RFID Firmware

Flash the RFID firmware sketch (`hardware/arduino/kiosk_rfid.ino`) using Arduino IDE with the ESP8266 board package:
1. Open Arduino IDE
2. Install the ESP8266 board package (Boards Manager)
3. Open `kiosk_rfid.ino`
4. Select board: ESP8266 (e.g. NodeMCU 1.0 (ESP-12E) / Generic ESP8266 Module)
5. Select correct COM port
6. Upload

> Note: the firmware sketch currently lives at `hardware/arduino/kiosk_rfid.ino`. The sketch is the ESP8266 RFID controller firmware — a future hardware task should retarget its pin definitions for the ESP8266 board and rename the folder accordingly.

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
- [ ] ESP8266 connected
- [ ] RFID reader reads cards
- [ ] Webcam captures photos
- [ ] Printer prints queue slips
- [ ] Kiosk browser launches
- [ ] Backend API reachable
- [ ] Request submission works

---

*Document created: July 31, 2026*
