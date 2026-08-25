#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ==========================================================
// IMS IoT Kiosk — ESP8266 + MFRC522 RFID Firmware
//
// Reads RFID cards via the MFRC522 reader and delivers the
// card UID to the kiosk system over a WebSocket connection
// to the kiosk-server (hardware/kiosk-server).
//
// Communication flow:
//   RFID Card → MFRC522 → ESP8266 → Wi-Fi → WebSocket →
//   kiosk-server → Kiosk Frontend → Backend API → Resident
// ==========================================================


// =========================
// Wi-Fi Settings
// =========================

const char* WIFI_SSID     = "GlobeMyBusiness_86692";
const char* WIFI_PASSWORD = "LN43056BD94";

// Wi-Fi reconnect timing
unsigned long lastWiFiCheck = 0;
const unsigned long WIFI_CHECK_INTERVAL = 10000; // 10 seconds


// =========================
// Kiosk Server Settings
// =========================
// The kiosk-server (hardware/kiosk-server/index.js) listens
// for WebSocket connections on this host:port at path /ws.
// The ESP8266 connects as an "arduino" type client.

const char* KIOSK_SERVER_HOST = "192.168.254.109";
const uint16_t KIOSK_SERVER_PORT = 3001;
const char* KIOSK_SERVER_PATH = "/ws?type=arduino";


// =========================
// RFID Pins (NodeMCU v2)
// =========================

#define SS_PIN  D8
#define RST_PIN D3


// =========================
// Buzzer and LED
// =========================

#define BUZZER_PIN D1
#define LED_PIN    D2


// =========================
// Timing Constants
// =========================

const unsigned long HEARTBEAT_INTERVAL = 15000;  // 15 seconds
const unsigned long RFID_COOLDOWN      = 1500;   // 1.5s between scans (debounce)


// =========================
// Global Objects
// =========================

MFRC522 rfid(SS_PIN, RST_PIN);
WebSocketsClient webSocket;

// State
bool wsConnected      = false;
unsigned long lastHeartbeat = 0;
unsigned long lastScanTime  = 0;
String lastScannedUid       = "";


// =========================
// Forward Declarations
// =========================

void setupWiFi();
void checkWiFi();
void setupWebSocket();
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length);
void sendRfidScan(const String& uid);
void sendHeartbeat();
void scanRFID();
void beep(int durationMs);
void blinkLED(int times, int intervalMs);
String readUid();


// =========================
// Setup
// =========================

void setup() {

    Serial.begin(115200);
    delay(100);

    // Pin Setup
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_PIN, LOW);

    // RFID Setup
    SPI.begin();
    rfid.PCD_Init();
    rfid.PCD_SetAntennaGain(MFRC522::RxGain_max); // Maximum antenna sensitivity (48dB)

    // Banner
    Serial.println();
    Serial.println(F("=================================="));
    Serial.println(F("IMS IoT Kiosk — ESP8266 RFID"));
    Serial.println(F("=================================="));
    Serial.print(F("MFRC522 Reader Status: "));
    rfid.PCD_DumpVersionToSerial();


    // Wi-Fi
    setupWiFi();

    // WebSocket — connects to kiosk-server
    setupWebSocket();

    // Startup blink
    blinkLED(2, 150);
}


// =========================
// Main Loop
// =========================

void loop() {

    // 1. Maintain Wi-Fi
    checkWiFi();

    // 2. Maintain WebSocket (handles reconnect internally)
    webSocket.loop();

    // 3. Periodic heartbeat
    if (wsConnected && (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL)) {
        sendHeartbeat();
        lastHeartbeat = millis();
    }

    // 4. Scan for RFID cards
    scanRFID();
}


// =========================
// Wi-Fi
// =========================

void setupWiFi() {
    Serial.println(F("Connecting to Wi-Fi..."));
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    // Block for initial connection (max 15s)
    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        Serial.print(F("Wi-Fi connected! IP: "));
        Serial.println(WiFi.localIP());
    } else {
        Serial.println(F("Wi-Fi connection failed — will retry in background."));
    }
}

void checkWiFi() {
    if (WiFi.status() == WL_CONNECTED) return;
    if (millis() - lastWiFiCheck < WIFI_CHECK_INTERVAL) return;

    lastWiFiCheck = millis();
    Serial.println(F("Wi-Fi disconnected. Reconnecting..."));
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}


// =========================
// WebSocket
// =========================

void setupWebSocket() {
    webSocket.begin(KIOSK_SERVER_HOST, KIOSK_SERVER_PORT, KIOSK_SERVER_PATH);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(2000); // Fast auto-reconnect (every 2s)
    webSocket.enableHeartbeat(3000, 2000, 2); // Ping every 3s, timeout 2s (detects server restarts within 3-5 seconds)
}

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {

        case WStype_CONNECTED:
            wsConnected = true;
            lastHeartbeat = millis();
            Serial.print(F("[WS] Connected to kiosk-server at "));
            Serial.print(KIOSK_SERVER_HOST);
            Serial.print(":");
            Serial.println(KIOSK_SERVER_PORT);

            // Announce ourselves
            {
                JsonDocument doc;
                doc["type"] = "identify";
                doc["device"] = "esp8266_rfid";
                doc["firmware"] = "1.0.0";
                String msg;
                serializeJson(doc, msg);
                webSocket.sendTXT(msg);
            }

            // Solid LED on when connected
            digitalWrite(LED_PIN, HIGH);
            break;

        case WStype_DISCONNECTED:
            wsConnected = false;
            Serial.println(F("[WS] Disconnected from kiosk-server"));
            digitalWrite(LED_PIN, LOW);
            break;

        case WStype_TEXT:
            Serial.print(F("[WS] Received: "));
            Serial.println((char*)payload);

            // Handle commands from kiosk-server (optional)
            {
                JsonDocument doc;
                DeserializationError err = deserializeJson(doc, payload, length);
                if (!err) {
                    const char* command = doc["command"];
                    if (command) {
                        if (strcmp(command, "BUZZ") == 0) {
                            int duration = doc["params"]["duration"] | 200;
                            beep(duration);
                        } else if (strcmp(command, "LED_BLINK") == 0) {
                            int times = doc["params"]["times"] | 3;
                            int interval = doc["params"]["interval"] | 200;
                            blinkLED(times, interval);
                        }
                    }
                }
            }
            break;

        case WStype_PING:
            // Library handles pong automatically
            break;

        case WStype_PONG:
            break;

        default:
            break;
    }
}


// =========================
// RFID Scanning & Watchdog
// =========================

unsigned long lastRfidHealthCheck = 0;

void checkRfidHealth() {
    if (millis() - lastRfidHealthCheck < 3000) return;
    lastRfidHealthCheck = millis();

    byte version = rfid.PCD_ReadRegister(MFRC522::VersionReg);
    // If version is 0x00 or 0xFF, SPI communication is uninitialized/stalled
    if (version == 0x00 || version == 0xFF) {
        Serial.println(F("[RFID] MFRC522 SPI uninitialized/stalled — reinitializing reader..."));
        SPI.begin();
        rfid.PCD_Init();
        rfid.PCD_SetAntennaGain(MFRC522::RxGain_max);
    }
}

void scanRFID() {
    // 1. Ensure RC522 SPI hardware is alive
    checkRfidHealth();

    // 2. Check for card presence (dual attempt for WUPA/REQA response)
    if (!rfid.PICC_IsNewCardPresent() && !rfid.PICC_IsNewCardPresent()) return;
    if (!rfid.PICC_ReadCardSerial())   return;

    String uid = readUid();
    if (uid.length() < 4) {
        rfid.PICC_HaltA();
        rfid.PCD_StopCrypto1();
        return;
    }

    // Debounce: ignore same card scanned within RFID_COOLDOWN period
    if (uid == lastScannedUid && (millis() - lastScanTime < RFID_COOLDOWN)) {
        rfid.PICC_HaltA();
        rfid.PCD_StopCrypto1();
        return;
    }

    lastScannedUid = uid;
    lastScanTime = millis();

    // Print to Serial (debugging)
    Serial.print(F("Card UID: "));
    Serial.println(uid);

    // Feedback: short beep + blink
    beep(100);
    blinkLED(1, 100);

    // Send to kiosk-server via WebSocket
    sendRfidScan(uid);

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
}

String readUid() {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
        if (rfid.uid.uidByte[i] < 0x10) uid += "0";
        uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    return uid;
}


// =========================
// WebSocket Messages
// =========================

void sendRfidScan(const String& uid) {
    if (!wsConnected) {
        Serial.println(F("[WS] Not connected — cannot send RFID scan"));
        // Long beep to indicate error
        beep(500);
        return;
    }

    JsonDocument doc;
    doc["type"] = "rfid_scan";
    doc["uid"]  = uid;
    doc["timestamp"] = millis();

    String msg;
    serializeJson(doc, msg);
    webSocket.sendTXT(msg);

    Serial.print(F("[WS] Sent RFID scan: "));
    Serial.println(uid);
}

void sendHeartbeat() {
    if (!wsConnected) return;

    JsonDocument doc;
    doc["type"] = "heartbeat";
    doc["uptime"] = millis() / 1000;

    String msg;
    serializeJson(doc, msg);
    webSocket.sendTXT(msg);
}


// =========================
// LED + Buzzer Helpers
// =========================

void beep(int durationMs) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(durationMs);
    digitalWrite(BUZZER_PIN, LOW);
}

void blinkLED(int times, int intervalMs) {
    for (int i = 0; i < times; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(intervalMs);
        digitalWrite(LED_PIN, LOW);
        delay(intervalMs);
    }
    // Restore LED to connected state indicator
    if (wsConnected) {
        digitalWrite(LED_PIN, HIGH);
    }
}