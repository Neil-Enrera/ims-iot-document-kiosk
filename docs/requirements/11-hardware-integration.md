# 11. Hardware Integration

## 1. Purpose

The Information Management System integrates hardware devices with the software application to automate resident identification and improve the efficiency of document request services. The hardware components communicate with the kiosk application, allowing residents to submit requests without manual data entry while assisting barangay personnel in processing requests accurately.

The integration of hardware devices supports the project's objective of reducing waiting time, minimizing encoding errors, and improving the overall service experience.

---

# 2. Hardware Overview

The system consists of the following hardware components:

| Hardware | Purpose |
|----------|---------|
| RFID Reader | Identifies registered residents by scanning their RFID card. |
| RFID Card | Contains the resident's unique identification number (UID). |
| Touchscreen Monitor | Provides a self-service interface for residents. |
| Webcam | Captures the resident's photo during document requests for verification. |
| Kiosk Computer | Runs the Angular frontend and communicates with the backend server. |
| Application Server | Hosts the Node.js API and MySQL database. |

---

# 3. Hardware Architecture

```text
+----------------------------+
|      Resident              |
+----------------------------+
              │
              ▼
      RFID Card Tap
              │
              ▼
+----------------------------+
|      RFID Reader           |
+----------------------------+
              │
              ▼
+----------------------------+
|     Kiosk Application      |
|       (Angular)            |
+----------------------------+
       │             │
       │             │
       ▼             ▼
 Webcam Capture   Touchscreen
       │
       ▼
+----------------------------+
|      Node.js REST API      |
+----------------------------+
              │
              ▼
+----------------------------+
|       MySQL Database       |
+----------------------------+
              │
              ▼
Barangay Personnel Dashboard
```

---

# 4. RFID Integration

The RFID subsystem is responsible for identifying registered residents.

### Workflow

1. Resident taps RFID card.
2. RFID Reader reads the UID.
3. UID is sent to the kiosk application.
4. Angular requests resident information from the Node.js API.
5. The system retrieves the resident profile from the database.
6. Resident information is displayed automatically.

### Benefits

- Faster resident identification
- Eliminates manual searching
- Reduces encoding errors
- Prevents duplicate resident records

---

# 5. Webcam Integration

The webcam captures the resident's image during document requests.

### Workflow

1. Resident confirms the request.
2. Webcam opens automatically.
3. Resident photo is captured.
4. Image is uploaded to the server.
5. Image is stored with the request record.

### Benefits

- Identity verification
- Request documentation
- Improved security

---

# 6. Touchscreen Integration

The touchscreen provides a user-friendly interface that allows residents to interact with the kiosk.

Residents can:

- Identify themselves
- View available services
- Submit document requests
- Review request details
- Confirm submission

---

# 7. Communication Flow

The hardware devices communicate with the software components as follows:

| Device | Communicates With | Purpose |
|---------|------------------|---------|
| RFID Reader | Angular Application | Sends RFID UID |
| Webcam | Angular Application | Captures resident photo |
| Angular Application | Node.js API | Sends and receives system data |
| Node.js API | MySQL Database | Stores and retrieves records |

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

The integration of RFID technology, a touchscreen interface, and a webcam enables the Information Management System to provide an efficient and user-friendly document request process. These hardware components support automated resident identification, improve operational efficiency, and strengthen the overall reliability of barangay services.