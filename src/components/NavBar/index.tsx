import React from 'react';
import { Link } from 'react-router-dom';

const NavBar: React.FC = () => {
  return (
    <div className="navbar w-screen h-[68px] bg-[#fafafa] border-b border-[#eff0ef] flex items-center justify-between px-0 box-border pt-6 pb-4">
      <div className="logo text-[30px] font-bold text-black flex items-center -mt-2 ml-10">Blocker</div>
      <div className="nav-links flex gap-8 items-center">
        <Link to="/" className="nav-link text-[15px] font-medium text-black flex items-center -mt-2">Home</Link>
        <Link to="/updates" className="nav-link text-[15px] font-medium text-black flex items-center -mt-2">Updates</Link>
        <Link to="/history" className="nav-link text-[15px] font-medium text-black flex items-center -mt-2">History</Link>
        <div className="flex items-center gap-6">
          <button className="help-btn bg-black text-white rounded-[20px] px-[18px] py-[7px] text-[15px] font-bold flex items-center -mt-2">
            Help
          </button>
          <button className="settings-btn bg-[#ededed] rounded-[30px] w-[40px] h-[40px] flex items-center justify-center -mt-2 mr-10">
            ⚙️
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavBar;