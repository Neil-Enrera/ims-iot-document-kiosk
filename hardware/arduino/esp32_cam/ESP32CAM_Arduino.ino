#include "esp_camera.h"
#include <WiFi.h>
#include "esp_http_server.h"

// ========================================
// Wi-Fi Configuration
// ========================================

const char* ssid = "HUAWEI-2.4G-N3w7;
const char* password = "GarateBulacan2020";

// Wi-Fi reconnection settings
const unsigned long WIFI_RECONNECT_INTERVAL = 5000; // 5 seconds
unsigned long lastWiFiReconnectAttempt = 0;
bool wasWiFiConnected = false;

// ========================================
// AI Thinker ESP32-CAM Pin Definitions
// ========================================

#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5

#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Flash LED pin (GPIO 4)
#define FLASH_LED_PIN      4

// ========================================
// Web Server & Stream Constants
// ========================================

httpd_handle_t stream_httpd = NULL;
httpd_handle_t camera_httpd = NULL;

#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

// ========================================
// MJPEG Stream Handler (Ultra Low-Latency)
// ========================================

static esp_err_t stream_handler(httpd_req_t *req)
{
    camera_fb_t *fb = NULL;
    esp_err_t res = ESP_OK;
    size_t _jpg_buf_len = 0;
    uint8_t *_jpg_buf = NULL;
    char part_buf[128];

    // Set CORS and Stream Headers
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "GET, OPTIONS");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Headers", "*");
    httpd_resp_set_hdr(req, "Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    httpd_resp_set_hdr(req, "Pragma", "no-cache");
    httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);

    while (true)
    {
        fb = esp_camera_fb_get();
        if (!fb)
        {
            Serial.println("[ESP32-CAM] Frame buffer acquire failed!");
            res = ESP_FAIL;
            break;
        }

        _jpg_buf = fb->buf;
        _jpg_buf_len = fb->len;

        if (res == ESP_OK)
        {
            res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
        }
        if (res == ESP_OK)
        {
            size_t hlen = snprintf(part_buf, sizeof(part_buf), _STREAM_PART, _jpg_buf_len);
            res = httpd_resp_send_chunk(req, part_buf, hlen);
        }
        if (res == ESP_OK)
        {
            res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
        }

        esp_camera_fb_return(fb);
        fb = NULL;
        _jpg_buf = NULL;

        if (res != ESP_OK)
        {
            break;
        }
    }

    return res;
}

// ========================================
// Instant High-Quality Photo Capture Handler
// ========================================

static esp_err_t capture_handler(httpd_req_t *req)
{
    camera_fb_t *fb = NULL;
    esp_err_t res = ESP_OK;

    // Set CORS headers
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "GET, OPTIONS");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Headers", "*");
    httpd_resp_set_hdr(req, "Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    httpd_resp_set_type(req, "image/jpeg");

    // Flush any stale DMA buffer so we get a fresh, properly-exposed frame
    fb = esp_camera_fb_get();
    if (fb)
    {
        esp_camera_fb_return(fb);
        fb = NULL;
    }

    // Acquire current frame
    fb = esp_camera_fb_get();
    if (!fb)
    {
        Serial.println("[ESP32-CAM] Capture failed: Camera FB get failed");
        httpd_resp_send_500(req);
        return ESP_FAIL;
    }

    res = httpd_resp_send(req, (const char *)fb->buf, fb->len);
    esp_camera_fb_return(fb);

    if (res == ESP_OK)
    {
        Serial.println("[ESP32-CAM] Photo captured and transmitted successfully.");
    }
    return res;
}


// ========================================
// Camera Status Handler (JSON)
// ========================================

static esp_err_t status_handler(httpd_req_t *req)
{
    char json_response[256];
    sensor_t *s = esp_camera_sensor_get();
    
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_set_hdr(req, "Content-Type", "application/json");

    snprintf(json_response, sizeof(json_response),
        "{\"status\":\"ready\",\"device\":\"esp32_cam\",\"ip\":\"%s\",\"framesize\":%d,\"quality\":%d,\"psram\":%s,\"free_psram\":%u}",
        WiFi.localIP().toString().c_str(),
        s ? s->status.framesize : 0,
        s ? s->status.quality : 0,
        psramFound() ? "true" : "false",
        psramFound() ? ESP.getFreePsram() : 0
    );

    return httpd_resp_send(req, json_response, strlen(json_response));
}

// ========================================
// Standalone Web Test Page
// ========================================

static esp_err_t index_handler(httpd_req_t *req)
{
    const char* html = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barangay Kiosk — ESP32-CAM Live Stream</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; }
        body { background: #0F172A; color: #F8FAFC; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        .card { background: #1E293B; border: 1px solid #334155; border-radius: 20px; padding: 24px; max-width: 680px; width: 100%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { font-size: 24px; font-weight: 700; color: #F97316; margin-bottom: 8px; }
        p { color: #94A3B8; font-size: 14px; margin-bottom: 20px; }
        .stream-container { position: relative; width: 100%; aspect-ratio: 4/3; background: #000; border-radius: 14px; overflow: hidden; border: 2px solid #F97316; }
        .stream-container img { width: 100%; height: 100%; object-fit: cover; }
        .badge { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: #10B981; display: flex; align-items: center; gap: 6px; }
        .badge .dot { width: 8px; height: 8px; border-radius: 50%; background: #10B981; }
        .controls { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }
        button { background: #F97316; color: #FFF; border: none; padding: 12px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        button:hover { background: #EA580C; transform: translateY(-1px); }
        #snapshot-preview { margin-top: 20px; display: none; width: 100%; max-width: 320px; border-radius: 12px; border: 2px solid #10B981; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Barangay Kiosk — Live Camera Stream</h1>
        <p>Ultra low-latency MJPEG streaming for Barangay ID photo capture</p>
        <div class="stream-container">
            <div class="badge"><span class="dot"></span> LIVE 25 FPS</div>
            <img src="/stream" alt="Live ESP32-CAM Stream">
        </div>
        <div class="controls">
            <button onclick="takeSnapshot()">Capture Snapshot</button>
            <button onclick="location.reload()" style="background:#334155;">Refresh Stream</button>
        </div>
        <img id="snapshot-preview" alt="Snapshot Preview">
    </div>
    <script>
        function takeSnapshot() {
            const img = document.getElementById('snapshot-preview');
            img.src = '/capture?t=' + Date.now();
            img.style.display = 'block';
        }
    </script>
</body>
</html>
)rawliteral";

    httpd_resp_set_type(req, "text/html");
    return httpd_resp_send(req, html, strlen(html));
}

// ========================================
// Start Web Server with Low-Latency Stream
// ========================================

void startCameraServer()
{
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.server_port = 80;
    config.ctrl_port = 32768;
    config.max_uri_handlers = 8;
    config.stack_size = 4096;

    // Stream URI
    httpd_uri_t stream_uri = {
        .uri = "/stream",
        .method = HTTP_GET,
        .handler = stream_handler,
        .user_ctx = NULL
    };

    // Capture URI
    httpd_uri_t capture_uri = {
        .uri = "/capture",
        .method = HTTP_GET,
        .handler = capture_handler,
        .user_ctx = NULL
    };

    // Status URI
    httpd_uri_t status_uri = {
        .uri = "/status",
        .method = HTTP_GET,
        .handler = status_handler,
        .user_ctx = NULL
    };

    // Index / Home URI
    httpd_uri_t index_uri = {
        .uri = "/",
        .method = HTTP_GET,
        .handler = index_handler,
        .user_ctx = NULL
    };

    Serial.printf("[ESP32-CAM] Starting web server on port: '%d'\n", config.server_port);
    if (httpd_start(&camera_httpd, &config) == ESP_OK)
    {
        httpd_register_uri_handler(camera_httpd, &stream_uri);
        httpd_register_uri_handler(camera_httpd, &capture_uri);
        httpd_register_uri_handler(camera_httpd, &status_uri);
        httpd_register_uri_handler(camera_httpd, &index_uri);
        Serial.println("[ESP32-CAM] Web server and MJPEG stream started successfully!");
    }
    else
    {
        Serial.println("[ESP32-CAM] Error starting web server!");
    }
}

// ========================================
// Wi-Fi Connection Handler
// ========================================

void handleWiFiConnection()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        if (!wasWiFiConnected)
        {
            Serial.println();
            Serial.println("[Wi-Fi] Connection established!");
            Serial.print("[Wi-Fi] IP Address: ");
            Serial.println(WiFi.localIP());
            wasWiFiConnected = true;
        }
        return;
    }

    if (wasWiFiConnected)
    {
        Serial.println();
        Serial.println("[Wi-Fi] Connection lost! Reconnecting...");
        wasWiFiConnected = false;
    }

    if (millis() - lastWiFiReconnectAttempt >= WIFI_RECONNECT_INTERVAL)
    {
        lastWiFiReconnectAttempt = millis();
        Serial.println("[Wi-Fi] Attempting reconnection...");
        WiFi.begin(ssid, password);
    }
}

// ========================================
// Setup
// ========================================

void setup()
{
    Serial.begin(115200);
    Serial.setDebugOutput(false);
    Serial.println("\n==============================================");
    Serial.println("Barangay Kiosk — ESP32-CAM Stream Initializing");
    Serial.println("==============================================");

    // Test PSRAM
    if (psramFound())
    {
        Serial.printf("[PSRAM] Found! Total: %u bytes, Free: %u bytes\n", ESP.getPsramSize(), ESP.getFreePsram());
    }
    else
    {
        Serial.println("[PSRAM] WARNING: PSRAM not found!");
    }

    // Camera Configuration
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sccb_sda = SIOD_GPIO_NUM;
    config.pin_sccb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;

    // Quality & Buffering (Double buffer in PSRAM for maximum smoothness)
    if (psramFound())
    {
        config.frame_size = FRAMESIZE_VGA;   // 640x480 crisp ID photo aspect ratio
        config.jpeg_quality = 12;            // Sharp quality (10-15 optimal)
        config.fb_count = 2;                 // Double buffer ping-pong DMA
        config.fb_location = CAMERA_FB_IN_PSRAM;
        config.grab_mode = CAMERA_GRAB_LATEST; // Always stream the freshest frame
    }
    else
    {
        config.frame_size = FRAMESIZE_CIF;   // Fallback for non-PSRAM
        config.jpeg_quality = 14;
        config.fb_count = 1;
        config.fb_location = CAMERA_FB_IN_DRAM;
    }

    // Camera Init
    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK)
    {
        Serial.printf("[ESP32-CAM] Camera init failed with error 0x%x\n", err);
        return;
    }
    Serial.println("[ESP32-CAM] Camera initialized successfully!");

    // Sensor Quality Tuning
    sensor_t *s = esp_camera_sensor_get();
    if (s != NULL)
    {
        s->set_brightness(s, 1);     // -2 to 2
        s->set_contrast(s, 1);       // -2 to 2
        s->set_saturation(s, 0);     // -2 to 2
        s->set_special_effect(s, 0); // No effect
        s->set_whitebal(s, 1);       // Enable Auto White Balance
        s->set_awb_gain(s, 1);       // Enable Auto White Balance Gain
        s->set_wb_mode(s, 0);        // Auto White Balance mode
        s->set_exposure_ctrl(s, 1);  // Enable Auto Exposure
        s->set_aec2(s, 0);           // Disable AEC DSP
        s->set_gain_ctrl(s, 1);      // Enable AGC
        s->set_agc_gain(s, 0);       // AGC Gain 0-30
        s->set_gainceiling(s, (gainceiling_t)2);
        s->set_bpc(s, 0);
        s->set_wpc(s, 1);
        s->set_raw_gma(s, 1);
        s->set_lenc(s, 1);           // Lens correction
        s->set_hmirror(s, 0);        // Mirroring
        s->set_vflip(s, 0);          // Vertical flip
    }

    // Connect to Wi-Fi
    Serial.printf("[Wi-Fi] Connecting to %s", ssid);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\n[Wi-Fi] Connected!");
    Serial.print("[Wi-Fi] IP Address: ");
    Serial.println(WiFi.localIP());

    // Disable Wi-Fi sleep for ultra-low latency packet transmission
    WiFi.setSleep(false);

    wasWiFiConnected = true;

    // Start HTTP MJPEG Stream Server
    startCameraServer();

    Serial.println("==============================================");
    Serial.printf("ESP32-CAM READY! Live Stream: http://%s/stream\n", WiFi.localIP().toString().c_str());
    Serial.println("==============================================\n");
}

// ========================================
// Main Loop
// ========================================

void loop()
{
    handleWiFiConnection();
    delay(10);
}