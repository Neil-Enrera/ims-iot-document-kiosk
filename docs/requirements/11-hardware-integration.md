# 11. Hardware Integration

## 1. Purpose

The Information Management System integrates hardware devices with the software application to automate resident identification and improve the efficiency of document request services. The hardware components communicate with the kiosk application, allowing residents to submit requests without manual data entry while assisting barangay personnel in processing requests accurately.

The integration of hardware devices supports the project's objective of reducing waiting time, minimizing encoding errors, and improving the overall service experience.

---

# 2. Hardware Overview

The system consists of the following hardware components:

| Hardware | Purpose |
|----------|---------|
| RFID Card | Contains the resident's unique identification number (UID). |
| RFID Reader (MFRC522) | Reads the UID from the resident's RFID Barangay ID. |
| ESP8266 | Microcontroller that controls the RFID reader and transmits the scanned UID to the kiosk system over a USB serial connection. |
| Kiosk Tablet (touchscreen) | Provides the self-service kiosk interface for residents and hosts the Angular kiosk application. |
| Webcam | Connected to (and used by) the kiosk tablet to capture the resident's photo during document requests and Barangay ID applications. |
| Kiosk Host | Runs the hardware bridge services (serial-service / kiosk-server) that relay RFID events to the kiosk application. |
| Application Server | Hosts the Node.js API and MySQL database. |

---

# 3. Hardware Architecture

```text
+----------------------------------+
|           Resident               |
+----------------------------------+
        │                  │
        │                  │
        ▼                  ▼
 RFID Card Tap        Touchscreen
 (Barangay ID)         Kiosk Tablet
        │                  │
        │           (Angular kiosk app
        │            + webcam capture)
        ▼                  │
+------------------+       │
| RFID Reader      |       │
| (MFRC522)        |       │
+------------------+       │
        │                  │
        ▼                  │
+------------------+       │
| ESP8266          |       │
| (RFID controller)|       │
+------------------+       │
        │ USB serial        │
        ▼                   ▼
+----------------------------------+
|   Kiosk Host (hardware bridge:   |
|   serial-service / kiosk-server) |
+----------------------------------+
        │ WebSocket / REST
        ▼
+----------------------------------+
|   Kiosk Application (Angular)    |
+----------------------------------+
        │
        ▼
+----------------------------------+
|        Node.js REST API          |
+----------------------------------+
        │
        ▼
+----------------------------------+
|         MySQL Database           |
+----------------------------------+
        │
        ▼
 Barangay Personnel Dashboard
 (Admin Panel)
```

The ESP8266 is **not** the kiosk device. It is dedicated to RFID hardware communication only; the tablet is the actual kiosk interface, and the webcam is connected to the tablet, not the ESP8266.

---

# 4. RFID Integration

The RFID subsystem is responsible for identifying registered residents.

### Workflow

1. Resident taps their RFID Barangay ID.
2. RFID Reader (MFRC522) reads the UID.
3. ESP8266 transmits the UID to the kiosk host over a USB serial connection (JSON protocol).
4. The hardware bridge (serial-service / kiosk-server) relays the scan to the kiosk application over WebSocket.
5. The kiosk application requests resident information from the Node.js API.
6. The backend verifies the UID against the database.
7. The system retrieves the resident profile from the database.
8. Resident information is displayed automatically on the kiosk.

### Benefits

- Faster resident identification
- Eliminates manual searching
- Reduces encoding errors
- Prevents duplicate resident records

---

# 5. Webcam Integration

The webcam captures the resident's image during document requests.

### Workflow

1. Resident confirms the request on the kiosk tablet.
2. The kiosk application opens the webcam (attached to the tablet).
3. Resident photo is captured.
4. Image is uploaded to the server via the backend API.
5. Image is stored with the request/application record.

### Benefits

- Identity verification
- Request documentation
- Improved security

---

# 6. Touchscreen Integration

The touchscreen kiosk tablet provides a user-friendly interface that allows residents to interact with the kiosk.

Residents can:

- Identify themselves (RFID scan or manual search)
- View available services
- Submit document requests
- Review request details
- Confirm submission

---

# 7. Communication Flow

The hardware devices communicate with the software components as follows:

| Device | Communicates With | Purpose |
|---------|------------------|---------|
| RFID Reader (MFRC522) | ESP8266 (SPI) | Reads and forwards the RFID UID |
| ESP8266 | Kiosk Host (USB serial) | Transmits RFID scan events (JSON) |
| Kiosk Host (serial-service / kiosk-server) | Kiosk Application (WebSocket / REST) | Relays RFID events and hardware status |
| Webcam | Kiosk Application | Captures resident photo |
| Kiosk Application (Angular) | Node.js API | Sends and receives system data |
| Node.js API | MySQL Database | Stores and retrieves records |
| Admin Panel | Node.js API | Staff review, approval, document processing |

---

# 8. Error Handling

The system includes mechanisms to handle hardware-related errors.

| Scenario | System Response |
|----------|----------------|
| RFID card not detected | Prompt resident to tap again. |
| RFID card not registered | Display registration assistance message. |
| Webcam unavailable | Allow request submission while notifying staff. |
| Server connection lost | Display connection error and prevent submission until restored. |

---

# 9. Future Hardware Expansion

The proposed system is designed to support additional hardware in future versions, including:

- QR Code Scanner
- Fingerprint Scanner
- Receipt Printer
- Thermal Printer
- NFC Reader
- Barcode Scanner
- SMS Notification Module

The modular architecture allows these devices to be integrated with minimal changes to the existing system.

---

# 10. Summary

The integration of RFID technology (RFID reader + ESP8266), the touchscreen kiosk tablet, and a webcam enables the Information Management System to provide an efficient and user-friendly document request process. These hardware components support automated resident identification, improve operational efficiency, and strengthen the overall reliability of barangay services.