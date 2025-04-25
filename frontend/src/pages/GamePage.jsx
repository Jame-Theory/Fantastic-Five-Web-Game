import React from "react";

const App = () => {
  return <h1>Hello, world!</h1>;
};

export default App;





// import React from 'react';
// import './GameBoard.css'; // CSS below

// const GamePage = () => {
//   const size = 10; // 10x10 grid
//   const tiles = Array(size * size).fill(0); // all tiles unpainted

//   return (
//     <div
//       className="game-board"
//       style={{
//         display: 'grid',
//         gridTemplateColumns: `repeat(${size}, 32px)`,
//         gridTemplateRows: `repeat(${size}, 32px)`,
//         gap: '1px',
//         backgroundColor: '#000',
//       }}
//     >
//       {tiles.map((cell, idx) => (
//         <div
//           key={idx}
//           className="tile"
//           style={{
//             width: '32px',
//             height: '32px',
//             backgroundColor: '#111', // dark for unpainted
//             border: '1px solid #222',
//           }}
//         />
//       ))}
//     </div>
//   );
// };

// export default GamePage;
