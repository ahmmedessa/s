import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import platform from 'platform';

const SERVER_URL = 'http://192.168.1.8:4000'; // استبدل بـ IP المحلي للحاسب
const socket = io(SERVER_URL);

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const videoRef = useRef();
  const peerRef = useRef();

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    socket.on('joinRequest', ({ id, sessionId, deviceInfo }) => {
      if (isHost) {
        const accept = window.confirm(`Device ${deviceInfo} wants to share your screen. Do you accept?`);
        socket.emit('shareResponse', { sessionId, response: accept, id });
        if (accept) {
          setIsConnected(true);
        }
      }
    });

    socket.on('shareResponse', (response) => {
      if (response) {
        startSharing();
      } else {
        alert('Sharing request was denied.');
      }
    });

    socket.on('receiveSignal', (signal) => {
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    });
  }, [isHost]);

  const createSession = () => {
    socket.emit('createSession');
    socket.on('sessionCreated', (id) => {
      setSessionId(id);
      setIsHost(true);
    });
  };

  const joinSession = () => {
    const deviceInfo = `${platform.name} ${platform.version} (${platform.os.family})`;
    socket.emit('joinSession', { sessionId: inputSessionId, deviceInfo });
    setIsConnected(true);
  };

  const startSharing = () => {
    const displayMediaOptions = {
      video: {
        cursor: "always"
      },
      audio: false
    };
  
    const handleStream = (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      const peer = new Peer({
        initiator: isHost,
        trickle: false,
        stream: stream
      });
      peerRef.current = peer;
  
      peer.on('signal', (signal) => {
        socket.emit('sendSignal', { sessionId: sessionId || inputSessionId, signal });
      });
  
      peer.on('stream', (remoteStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
        }
      });
    };
  
    console.log('navigator:', navigator);
    console.log('navigator.mediaDevices:', navigator.mediaDevices);
  
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
      console.log('Using navigator.mediaDevices.getDisplayMedia');
      navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
        .then((stream) => {
          handleStream(stream);
        }).catch((error) => {
          console.error('Error accessing display media:', error);
          alert('Permission denied for screen sharing. Please allow screen sharing permission and try again.');
        });
    } else if (navigator.getDisplayMedia) {
      console.log('Using navigator.getDisplayMedia');
      navigator.getDisplayMedia(displayMediaOptions)
        .then((stream) => {
          handleStream(stream);
        }).catch((error) => {
          console.error('Error accessing display media:', error);
          alert('Permission denied for screen sharing. Please allow screen sharing permission and try again.');
        });
    } else {
      console.log('Screen sharing is not supported in this browser.');
      alert('Screen sharing is not supported in this browser.');
    }
  };
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Remote Control</h1>
      <div className="mb-4">
        <button
          onClick={createSession}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Create Session
        </button>
        {sessionId && <p className="mt-2 text-lg">Session ID: {sessionId}</p>}
      </div>
      <div className="mb-4 flex">
        <input
          type="text"
          value={inputSessionId}
          onChange={(e) => setInputSessionId(e.target.value)}
          placeholder="Enter Session ID"
          className="border-2 border-gray-300 p-2 rounded mr-2"
        />
        
        <button
          onClick={joinSession}
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Join Session
        </button>
      </div>
      <video
        ref={videoRef}
        autoPlay
        className="border-2 border-gray-300 rounded w-full max-w-md mt-4"
      ></video>
    </div>
  );
};

export default App;
