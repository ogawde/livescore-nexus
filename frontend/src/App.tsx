import { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Wifi, WifiOff } from 'lucide-react';

// Define the structure of our data
interface ScoreData {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}

function App() {
  
  // State to hold the live score data
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);

  // The WebSocket server URL. Make sure the port matches your docker-compose.yml.
  const socketUrl = 'ws://localhost:8080';

  const { lastMessage, readyState } = useWebSocket(socketUrl);

  // This effect runs every time a new message is received from the WebSocket
  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      setScoreData(data);
    }
  }, [lastMessage]);

  // Map the readyState to a connection status string and icon
  const connectionStatus = {
    [ReadyState.CONNECTING]: { text: 'Connecting...', icon: <WifiOff className="text-yellow-500" /> },
    [ReadyState.OPEN]: { text: 'Connected', icon: <Wifi className="text-green-500" /> },
    [ReadyState.CLOSING]: { text: 'Closing...', icon: <WifiOff className="text-orange-500" /> },
    [ReadyState.CLOSED]: { text: 'Disconnected', icon: <WifiOff className="text-red-500" /> },
    [ReadyState.UNINSTANTIATED]: { text: 'Uninstantiated', icon: <WifiOff className="text-gray-500" /> },
  }[readyState];

  return (
    <main className="bg-gray-900 min-h-screen text-white flex flex-col items-center p-8 font-sans">
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6 p-4 border-b border-gray-700">
          <h1 className="text-4xl font-bold text-cyan-400">LiveScore Nexus</h1>
          <div className="flex items-center space-x-2 text-lg">
            {connectionStatus.icon}
            <span>{connectionStatus.text}</span>
          </div>
        </header>

        {/* Scoreboard */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-300">Live Match Data (Placeholder)</h2>
          
          {scoreData ? (
            <div className="space-y-4 text-lg">
              <div className="flex justify-between p-3 bg-gray-700 rounded-md">
                <span className="font-medium text-gray-400">Match ID:</span>
                <span className="font-mono text-cyan-300">{scoreData.id}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-700 rounded-md">
                <span className="font-medium text-gray-400">User ID:</span>
                <span className="font-mono text-cyan-300">{scoreData.userId}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-700 rounded-md">
                <span className="font-medium text-gray-400">Title:</span>
                <span className="font-mono text-cyan-300">{scoreData.title}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-700 rounded-md">
                <span className="font-medium text-gray-400">Completed:</span>
                <span className={`font-mono px-2 py-1 rounded ${scoreData.completed ? 'bg-green-500 text-green-900' : 'bg-red-500 text-red-900'}`}>
                  {String(scoreData.completed)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Waiting for live data...</p>
          )}
        </div>

      </div>
    </main>
  );
}

export default App;