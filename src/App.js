import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './index.css'; // تأكد من تضمين ملف CSS

const socket = io();

function App() {
  const [sessionId, setSessionId] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [message, setMessage] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(navigator.userAgent);

  useEffect(() => {
    socket.on('sessionCreated', (id) => {
      setSessionId(id);
      setIsHost(true);
      setMessage(`Session created with ID: ${id}`);
    });

    socket.on('joinSuccess', ({ sessionId, deviceInfo }) => {
      setMessage(`Joined session ${sessionId}. Device Info: ${deviceInfo}`);
    });

    socket.on('joinError', (error) => {
      setMessage(error);
    });

    socket.on('joinRequest', ({ sessionId, deviceInfo }) => {
      setMessage(`Device with info: ${deviceInfo} wants to join session ${sessionId}`);
    });
  }, []);

  const createSession = () => {
    socket.emit('createSession');
  };

  const joinSession = () => {
    socket.emit('joinSession', { sessionId: inputSessionId, deviceInfo });
  };

  const handleInputChange = (e) => {
    setInputSessionId(e.target.value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4 text-center">Screen Sharing App</h1>
        {isHost ? (
          <div className="mb-4">
            <p className="text-gray-700">Session ID: {sessionId}</p>
          </div>
        ) : (
          <div className="mb-4">
            <input
              type="text"
              value={inputSessionId}
              onChange={handleInputChange}
              placeholder="Enter Session ID"
              className="border p-2 rounded w-full mb-2"
            />
            <button onClick={joinSession} className="bg-blue-500 text-white p-2 rounded w-full">
              Join Session
            </button>
          </div>
        )}
        <button onClick={createSession} className="bg-green-500 text-white p-2 rounded w-full mb-2">
          Create Session
        </button>
        <p className="text-red-500 text-center">{message}</p>
      </div>
    </div>
  );
}

export default App;
