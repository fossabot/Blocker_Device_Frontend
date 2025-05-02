import React from 'react';
import NavBar from './components/NavBar';
import AppRouter from './router/AppRouter';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="w-full relative">
        <div className="app-container">
          <NavBar />
          <AppRouter />
        </div>
      </div>
    </div>
  );
};

export default App;
