--uart.setup(0,9600,8,0,1,1)
--wifi.setmode(wifi.STATION, true)
ws = websocket.createClient()

function startup()
    --print("statup")
    
    uart.on("data", 1,
      function(data)
        local command = "Gamepad_Command"
        --print ('data uart receive: ', data)
        if data==1 then
            ws:send("42[\""..command"\",\"up\"]")
        elseif data == 2 then
            ws:send("42[\""..command"\",\"down\"]")
        elseif data == 4 then
            ws:send("42[\""..command"\",\"left\"]")
        elseif data == 8 then
            ws:send("42[\""..command"\",\"right\"]")
        elseif data == 16 then
            ws:send("42[\""..command"\",\"cancle\"]")
        elseif data == 32 then
            ws:send("42[\""..command"\",\"ok\"]")
        end
    end, 0)
    ws:connect('ws://18.136.212.75/socket.io/?EIO=3&transport=websocket')
end

wifi_connect_event = function(T) 
  --print("Connection to AP("..T.SSID..") established!")
  --print("Waiting for IP address...")
  if disconnect_ct ~= nil then disconnect_ct = nil end  
end

wifi_got_ip_event = function(T)  
  --print("Wifi connection is ready! IP address is: "..T.IP)
  --print("Startup will resume momentarily, you have 3 seconds to abort.")
  --print("Waiting...") 
  tmr.create():alarm(3000, tmr.ALARM_SINGLE, startup)
end

wifi_disconnect_event = function(T)
  if T.reason == wifi.eventmon.reason.ASSOC_LEAVE then 
    --the station has disassociated from a previously connected AP
    return 
  end
  -- total_tries: how many times the station will attempt to connect to the AP. Should consider AP reboot duration.
  local total_tries = 75
  --print("\nWiFi connection to AP("..T.SSID..") has failed!")

  --There are many possible disconnect reasons, the following iterates through 
  --the list and returns the string corresponding to the disconnect reason.
  for key,val in pairs(wifi.eventmon.reason) do
    if val == T.reason then
      --print("Disconnect reason: "..val.."("..key..")")
      break
    end
  end

  if disconnect_ct == nil then 
    disconnect_ct = 1 
  else
    disconnect_ct = disconnect_ct + 1 
  end
  if disconnect_ct < total_tries then 
    ---print("Retrying connection...(attempt "..(disconnect_ct+1).." of "..total_tries..")")
  else
    wifi.sta.disconnect()
    --print("Aborting connection to AP!")
    disconnect_ct = nil  
  end
end

wifi.eventmon.register(wifi.eventmon.STA_CONNECTED, wifi_connect_event)
wifi.eventmon.register(wifi.eventmon.STA_GOT_IP, wifi_got_ip_event)
wifi.eventmon.register(wifi.eventmon.STA_DISCONNECTED, wifi_disconnect_event)

--Connect to wifi

wifi.setmode(wifi.STATION)
wifi.sta.config({ssid="ThomasThong", pwd="123456789@"})

--Websocket and uart + timer
mytimer = tmr.create()
mytimer2 = tmr.create()
--uart.write(0, "Hello, world\n")

function heartbeat()
    --print("heart beat")
    ws:send("2")
end

function timeout()
    ws:connect('ws://18.136.212.75/socket.io/?EIO=3&transport=websocket')
end

ws:on("connection", function(ws)
  --print('got ws connection')
  if not mytimer2:alarm(3000, tmr.ALARM_AUTO, heartbeat)
    then
        print("whoopsie")
    end
  ws:send("42[\"Gamepad_Connect\",\""..wifi.ap.getmac().. "\"]")
  mytimer:register(7000, tmr.ALARM_AUTO, timeout)
end)

ws:on("receive", function(_, msg, opcode)
  --print('got message:', msg) -- opcode is 1 for text message, 2 for binary
  if msg == "42[\"Server_SendVibra\"]" then
    uart.write(0, 'h')
  end
  if msg == "3" then
    --print("ms==3 ")
    mytimer:interval(7000) 
    mytimer:start()
  end
end)

ws:on("close", function(_, status)
  --print('connection closed', status)
  mytimer:stop()
  mytimer2:stop()
  ws:connect('ws://18.136.212.75/socket.io/?EIO=3&transport=websocket')
end)
