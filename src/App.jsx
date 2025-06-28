import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';

import io from 'socket.io-client';

// ✅ Use env variable from Vercel
const socket = io(import.meta.env.VITE_SOCKET_URL);


// const socket = io('http://localhost:3000');

function App() {
  const [symbol, setSymbol] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [joiningMode, setJoiningMode] = useState(null); // 'create' or 'join'
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.on('init', ({ symbol, board, currentPlayer }) => {
      setSymbol(symbol);
      setBoard(board);
      setCurrentPlayer(currentPlayer);
      setWinner(null);
      setMessage(`You are ${symbol}`);
    });

    socket.on('updateBoard', ({ board, currentPlayer }) => {
      setBoard(board);
      setCurrentPlayer(currentPlayer);

      const win = checkWinner(board);
      if (win) {
        setWinner(win);
        setMessage(`${win} wins!`);
        confetti();
      } else if (board.every(cell => cell !== null)) {
        setWinner('Draw');
        setMessage("It's a draw!");
      } else {
        setMessage(`You are ${symbol}`);
      }
    });

    socket.on('playerLeft', () => {
      setMessage("Opponent left. Waiting...");
    });

    socket.on('full', () => {
      setMessage("Room is full.");
    });

    return () => socket.off();
  }, []);

  const checkWinner = (b) => {
    const lines = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];
    for (let [a, b1, c] of lines) {
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
    }
    return null;
  };

  const handleClick = (i) => {
    if (winner || board[i] || symbol !== currentPlayer) return;
    socket.emit('makeMove', { index: i, symbol });
  };

  const handleRestart = () => {
    socket.emit('restart');
  };

  const generateRoom = () => {
    const id = Math.random().toString(36).substring(2, 7).toUpperCase();
    setRoomId(id);
    setJoiningMode('create');
  };

  const joinRoom = () => {
    if (!roomId) return;
    socket.emit('joinRoom', roomId);
    setJoined(true);
  };

  if (!joined) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🎮 Tic Tac Toe</h1>
        <div style={styles.card}>
          {!joiningMode && (
            <>
              <button style={styles.button} onClick={generateRoom}>Create Room</button>
              <button style={styles.button} onClick={() => setJoiningMode('join')}>Join Room</button>
            </>
          )}
          {joiningMode === 'join' && (
            <>
              <input
                style={styles.input}
                value={roomId}
                onChange={e => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter Room ID"
              />
              <button style={styles.button} onClick={joinRoom}>Join</button>
              <button style={styles.secondaryButton} onClick={() => setJoiningMode(null)}>Back</button>
            </>
          )}
          {joiningMode === 'create' && (
            <>
              <p>Share this Room ID:</p>
              <h2 style={styles.roomId}>{roomId}</h2>
              <button style={styles.button} onClick={joinRoom}>Start</button>
              <button style={styles.secondaryButton} onClick={() => setJoiningMode(null)}>Back</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Room: {roomId}</h1>
      <div style={styles.messageBox}>
        <p>{message}</p>
        <p>{symbol === currentPlayer ? "🟢 Your turn" : "🔴 Opponent's turn"}</p>
      </div>

      <div style={styles.board}>
        {board.map((val, i) => (
          <div
            key={i}
            style={{
              ...styles.cell,
              backgroundColor: val ? (val === 'X' ? '#2ecc71' : '#e74c3c') : '#222',
              color: val ? '#fff' : '#aaa',
            }}
            onClick={() => handleClick(i)}
          >
            {val}
          </div>
        ))}
      </div>

      <button style={styles.button} onClick={handleRestart}>🔄 Restart</button>
    </div>
  );
}

const styles = {
  container: {
    background: '#0d1117',
    color: 'white',
    minHeight: '100vh',
    textAlign: 'center',
    padding: '20px',
    fontFamily: 'Segoe UI, sans-serif'
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '20px'
  },
  card: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
    padding: '30px',
    display: 'inline-block',
    minWidth: '300px',
    boxShadow: '0 0 10px rgba(0,0,0,0.5)'
  },
  button: {
    backgroundColor: '#238636',
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    margin: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background 0.3s'
  },
  secondaryButton: {
    backgroundColor: '#444c56',
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    margin: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  input: {
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #444',
    background: '#0d1117',
    color: 'white',
    marginBottom: '10px'
  },
  roomId: {
    fontSize: '1.5rem',
    color: '#58a6ff',
    margin: '10px 0'
  },
  messageBox: {
    backgroundColor: '#161b22',
    padding: '10px 20px',
    margin: '10px auto',
    borderRadius: '10px',
    display: 'inline-block'
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 100px)',
    gap: '10px',
    justifyContent: 'center',
    margin: '30px auto'
  },
  cell: {
    width: '100px',
    height: '100px',
    fontSize: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    border: '2px solid #444',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  }
};

export default App;
