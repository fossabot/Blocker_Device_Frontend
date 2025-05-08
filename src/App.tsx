import './App.css';
import AppRouter from './router/AppRouter';
import NavBar from './components/NavBar';
import { UpdateAnimation } from './components/UpdateProgress/UpdateAnimation';
import { useRecoilValue, useRecoilState } from 'recoil';
import { showAnimationState, toastsState } from './store/atoms';
import ToastContainer from './components/shared/ToastContainer';

function App() {
  const showAnimation = useRecoilValue(showAnimationState);
  const [toasts, setToasts] = useRecoilState(toastsState);

  const handleCloseToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="App">
      <NavBar />
      <AppRouter />
      {showAnimation && <UpdateAnimation />}
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
}

export default App;
