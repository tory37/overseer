import asyncio
import websockets
import json
import sys

async def test_ws():
    uri = "ws://localhost:8000/ws/terminal?sessionId=test-voice&cwd=/home/toryhebert/src/agent-manager&command=/bin/bash"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket")
            
            # Send an echo command with a voice tag
            await websocket.send(json.dumps({"type": "input", "data": "echo '<voice>Hello from Overseer!</voice>'\r"}))
            
            # Wait for output
            try:
                while True:
                    message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    print(f"Raw received: {repr(message)}")
                    msg = json.loads(message)
                    print(f"Received {msg['type']}: {repr(msg['data'])}")
            except asyncio.TimeoutError:
                print("No more data received")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
