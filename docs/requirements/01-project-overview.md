# Project Overview

## 1. Project Information

### Project Title

**Information Management System with IoT-Assisted Document Request Services Kiosk for Barangay San Manuel**

### Project Type

IoT-Assisted Information Management System and Self-Service Document Request Kiosk

### Project Location

Barangay San Manuel, San Jose del Monte, Bulacan

---

## 2. Project Background

Barangay San Manuel is a local government unit serving an estimated population of approximately 12,000 residents. The barangay provides various public services, including the issuance of barangay clearances and certificates, community health and social welfare services, peace and order initiatives, disaster risk management activities, and other community assistance services.

The current document-request process relies heavily on traditional manual workflows. Residents are required to visit the barangay hall, wait in physical lines, manually write their personal information in paper logbooks, and wait for staff to process their requests.

This workflow creates operational inefficiencies, particularly during periods of high demand. Handwritten entries may be difficult to read or incomplete, while barangay staff must manually re-enter resident information into computer-based document templates. Physical logbooks also make it difficult to search transaction records and obtain operational information such as request volumes and processing times. :contentReference[oaicite:1]{index=1}

---

## 3. Project Purpose

The purpose of the project is to modernize the document request intake process of Barangay San Manuel by replacing manual paper-based registration with a self-service, digitally managed workflow.

The kiosk allows registered residents to initiate document requests without initially interacting with barangay staff. A registered Barangay RFID ID is used to identify the resident and retrieve their pre-registered profile information.

The system also integrates a touchscreen interface and webcam. The touchscreen provides the resident-facing kiosk interface, while the webcam can capture a resident photograph when required by the selected service, such as a Barangay ID application.

After submission, the request is made available to authorized barangay staff through a web-based review panel. Staff can inspect the submitted information and captured photo, approve or reject the request, and manually print the official document after approval. :contentReference[oaicite:2]{index=2}

---

## 4. Problem Context

The existing manual document-request process presents the following operational problems.

### 4.1 Manual Registration Bottlenecks

Residents must manually write their personal information into physical paper logbooks. This can slow down the intake process and create unorganized data entries, particularly during peak operational hours.

### 4.2 Repetitive Data Entry

Barangay personnel must re-enter handwritten resident information into digital document templates. This increases administrative workload and creates opportunities for spelling and data-entry errors.

### 4.3 Data Inaccuracy and Loss

Physical paper records can be affected by illegible handwriting, incomplete information, damaged pages, or misplaced entries, making records more difficult to retrieve and maintain.

### 4.4 Inconvenient Photo Capture

Services that require resident photographs, such as Barangay ID applications, currently require separate or manual photo-capture processes.

### 4.5 Lack of Operational Data

Paper-based logbooks do not provide automated mechanisms for monitoring request volumes, processing times, or transaction histories. :contentReference[oaicite:3]{index=3}

---

## 5. Proposed Solution

The proposed solution is an **IoT-Assisted Document Request Services Kiosk** integrated with an **Information Management System**.

The system provides a self-service intake point where registered residents can:

1. Tap their registered Barangay RFID ID.
2. Have their identity verified by the system.
3. Retrieve their registered resident profile.
4. Select the required barangay document or service.
5. Review their automatically populated information.
6. Provide or capture additional information when required.
7. Use the integrated webcam when the selected service requires a photograph.
8. Submit the document request.
9. Receive a request/reference identifier for tracking purposes.

The submitted request is stored in the system and made available to authorized barangay staff through a web-based review panel.

Staff can:

1. View incoming requests.
2. Review resident information.
3. Inspect captured photographs when applicable.
4. Verify request information and requirements.
5. Approve or reject requests.
6. Manually print the official document after approval. :contentReference[oaicite:4]{index=4}

---

## 6. Core System Concept

The system follows a self-service document-request intake model:

```text
Resident
   |
   v
RFID Barangay ID
   |
   v
Resident Verification
   |
   v
Resident Profile Retrieval
   |
   v
Document / Service Selection
   |
   v
Review Information
   |
   +------ Photo Required? ------+
   |                             |
  YES                            NO
   |                             |
   v                             |
Webcam Photo Capture             |
   |                             |
   +-------------+---------------+
                 |
                 v
          Submit Request
                 |
                 v
           System Database
                 |
                 v
        Staff Review Panel
                 |
          +------+------+
          |             |
       APPROVE        REJECT
          |             |
          v             v
   Manual Document   Request
      Printing       Rejected