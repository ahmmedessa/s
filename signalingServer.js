// signalingServer.js

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3002 });

wss.on('connection', ws => {
  ws.on('message', message => {
    const data = JSON.parse(message);

    // هنا يمكننا معالجة رسائل WebRTC بين العملاء
    switch (data.type) {
      case 'offer':
      case 'answer':
      case 'candidate':
        // إعادة توجيه الرسائل إلى العميل الآخر
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
        break;
      default:
        break;
    }
  });
});

console.log('Signaling server running on port 3002');
