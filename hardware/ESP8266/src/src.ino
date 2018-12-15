#include <Arduino.h>

#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>

#include <SocketIoClient.h>

#define KEY_UP      0x01
#define KEY_DOWN    0x02
#define KEY_LEFT    0x04
#define KEY_RIGHT   0x08
#define KEY_CANCEL  0x10
#define KEY_OK      0x20

const char* ssid = "ThomasThong";
const char* password = "123456789@";

const char* ConnectSocket = "Gamepad_Connect";
const char* CommandSocket = "Gamepad_Command";
const char* GetIDSocket = "Gamepad_Ok";

// Server Ip
const char*  host = "18.136.212.75";
// Server port
int port = 80;

// Khởi tạo socket
SocketIoClient socket;

// Kết nối wifi
void setupNetwork() {
  //Serial.println("Connecting to wifi "); 
    WiFi.begin(ssid, password);
    uint8_t i = 0;
    while (WiFi.status() != WL_CONNECTED ) 
    {
      delay(500);
      //Serial.print("."); 
      ESP.wdtFeed();
    }

    // Hàm này là hàm in log ra serial
    //Serial.println("Wifi connected!");
}

void onVibrate(const char* payload, size_t length)
{
  //Serial.println("VIBRATE");
  
  Serial.write("h");
}
/*
void turnledon(const char* payload, size_t length){
  Serial.print("payload length: ");
  Serial.println(length);
  if (length != 1)
    return ;
  Serial.print("receive: ");
  Serial.println(payload);
}
*/

void setup() {
    // Bắt đầu kết nối serial với tốc độ baud là 115200.
    // Khi bạn bật serial monitor lên để xem log thì phải set đúng tốc độ baud này.
    Serial.begin(9600);
    //Serial.println ("test esp8266");
    setupNetwork();
    
    // Lắng nghe sự kiện led-change thì sẽ thực hiện hàm changeLedState
    //socket.on(GetIDSocket, turnledon);
    
    // Kết nối đến server
    socket.begin(host, port); 
    //Serial.println("connect to the server");
    String mac_str = "\"" + WiFi.macAddress() + "\"";
    char mac[20]; 
    mac_str.toCharArray(mac, 20);
    socket.emit(ConnectSocket, mac);
  
  while(Serial.available())
    Serial.read();
}

void loop() {
     // Luôn luôn giữ kết nối với server.
    socket.loop();

    socket.on("Server_SendVibra", onVibrate);
    if (Serial.available())
    {
      uint8_t input = Serial.read();
      if (input & KEY_UP)
        socket.emit(CommandSocket,"\"up\"");
      
      if (input & KEY_DOWN)
        socket.emit(CommandSocket,"\"down\"");
        
      if (input & KEY_LEFT)
        socket.emit(CommandSocket,"\"left\"");
        
      if (input & KEY_RIGHT)
        socket.emit(CommandSocket,"\"right\"");
        
      if (input & KEY_CANCEL)
        socket.emit(CommandSocket,"\"cancle\"");
        
      if (input & KEY_OK)
        socket.emit(CommandSocket,"\"ok\"");
    }
}