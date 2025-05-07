import './App.css';
import AppRouter from './router/AppRouter';
import NavBar from './components/NavBar';
import { UpdateAnimation } from './components/UpdateProgress/UpdateAnimation';
import { useRecoilValue } from 'recoil';
import { showAnimationState } from './store/atoms';

function App() {
  const showAnimation = useRecoilValue(showAnimationState);

  return (
    <div className="App">
      <NavBar />
      <AppRouter />
      {showAnimation && <UpdateAnimation />}
    </div>
  );
}

export default App;
