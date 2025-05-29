import React from 'react';
import { Link } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { showAnimationState } from '../../store/atoms';

const NavBar: React.FC = () => {
  const setShowAnimation = useSetRecoilState(showAnimationState);

  const handleHelpClick = () => {
    setShowAnimation(true);
  };

  return (
    <div className="navbar w-screen h-[90px] bg-[#fafafa] border-b border-[#eff0ef] flex items-center justify-between px-0 box-border pt-6 pb-4">
      <div className="logo text-[30px] font-bold text-black flex items-center -mt-2 ml-20">
        <Link to="/" className="no-underline text-black font-bold" style={{ fontSize: 30, fontWeight: 'bold' }}
          onMouseOver={e => e.currentTarget.style.color = '#000'}
          onMouseOut={e => e.currentTarget.style.color = '#000'}
        >
          Blocker
        </Link>
      </div>
      <div className="nav-links flex gap-8 mr-20 items-center">
        <Link to="/" className="nav-link text-[18px] font-medium text-black flex items-center -mt-2 hover:border-b-2 hover:border-black transition-all no-underline">Home</Link>
        <Link to="/updates" className="nav-link text-[18px] font-medium text-black flex items-center -mt-2 hover:border-b-2 hover:border-black transition-all no-underline">Updates</Link>
        <Link to="/history" className="nav-link text-[18px] font-medium text-black flex items-center -mt-2 hover:border-b-2 hover:border-black transition-all no-underline">History</Link>
        <div className="flex items-center gap-6">
          <button 
            className="help-btn bg-black text-white rounded-[20px] px-[18px] py-[7px] text-[18px] font-bold flex items-center -mt-2 mr-4"
            onClick={handleHelpClick}
          >
            Help
          </button>
          {/* <button className="settings-btn bg-[#ededed] rounded-[30px] w-[40px] h-[40px] flex items-center justify-center -mt-2 mr-10">
            ⚙️
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default NavBar;