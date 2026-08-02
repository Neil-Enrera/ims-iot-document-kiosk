/*
 * IMS IoT Kiosk - Arduino Uno Firmware
 * 
 * Hardware:
 * - Arduino Uno
 * - MFRC522 RFID Reader (SPI)
 * - Status LED (pin 7)
 * - Buzzer (pin 8)
 * 
 * Communication: Serial (9600 baud)
 * Protocol: JSON commands over Serial
 */

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9
#define LED_PIN 7
#define BUZZER_PIN 8

MFRC522 rfid(SS_PIN, RST_PIN);

String inputBuffer = "";
bool readerEnabled = true;

void setup() {
  Serial.begin(9600);
  while (!Serial) { ; }
  
  SPI.begin();
  rfid.PCD_Init();
  
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  
  Serial.println("{\"event\":\"ready\",\"message\":\"Arduino Kiosk Ready\"}");
}

void loop() {
  handleSerialCommands();
  
  if (readerEnabled) {
    scanRFID();
  }
  
  delay(100);
}

void handleSerialCommands() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      processCommand(inputBuffer);
      inputBuffer = "";
    } else {
      inputBuffer += c;
    }
  }
}

void processCommand(String cmd) {
  cmd.trim();
  
  if (cmd == "PING") {
    Serial.println("{\"event\":\"pong\",\"status\":\"ok\"}");
  }
  else if (cmd == "STATUS") {
    sendStatus();
  }
  else if (cmd == "ENABLE_READER") {
    readerEnabled = true;
    digitalWrite(LED_PIN, LOW);
    Serial.println("{\"event\":\"reader_enabled\"}");
  }
  else if (cmd == "DISABLE_READER") {
    readerEnabled = false;
    digitalWrite(LED_PIN, HIGH);
    Serial.println("{\"event\":\"reader_disabled\"}");
  }
  else if (cmd.startsWith("BUZZ:")) {
    int duration = cmd.substring(5).toInt();
    beep(duration);
    Serial.println("{\"event\":\"buzz\",\"duration\":" + String(duration) + "}");
  }
  else if (cmd.startsWith("LED:")) {
    String state = cmd.substring(4);
    if (state == "ON") digitalWrite(LED_PIN, HIGH);
    else if (state == "OFF") digitalWrite(LED_PIN, LOW);
    else if (state == "BLINK") blinkLED(3, 200);
    Serial.println("{\"event\":\"led\",\"state\":\"" + state + "\"}");
  }
  else {
    Serial.println("{\"event\":\"error\",\"message\":\"Unknown command: " + cmd + "\"}");
  }
}

void scanRFID() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }
  
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  
  beep(100);
  blinkLED(1, 100);
  
  Serial.println("{\"event\":\"rfid_scan\",\"uid\":\"" + uid + "\"}");
  
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void sendStatus() {
  String json = "{";
  json += "\"event\":\"status\",";
  json += "\"reader\":" + String(readerEnabled ? "true" : "false") + ",";
  json += "\"led\":" + String(digitalRead(LED_PIN) ? "true" : "false");
  json += "}";
  Serial.println(json);
}

void beep(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
}

void blinkLED(int times, int interval) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(interval);
    digitalWrite(LED_PIN, LOW);
    delay(interval);
  }
}
