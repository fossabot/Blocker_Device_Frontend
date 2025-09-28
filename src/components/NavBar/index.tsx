import React from 'react';
import { Link } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { showAnimationState } from '../../store/atoms';
import styles from './NavBar.module.css';

const NavBar: React.FC = () => {
  const setShowAnimation = useSetRecoilState(showAnimationState);

  const handleHelpClick = () => {
    setShowAnimation(true);
  };

  return (
    <div className={styles.navbar}>
      <div className={styles.logo}>
        <Link
          to="/"
          className={styles.logoLink}
          style={{ fontSize: 30, fontWeight: 'bold' }}
          onMouseOver={e => e.currentTarget.style.color = '#000'}
          onMouseOut={e => e.currentTarget.style.color = '#000'}
        >
          Blocker
        </Link>
      </div>
      <div className={styles.navLinks}>
        <Link to="/" className={styles.navLink}>Home</Link>
        <Link to="/history" className={styles.navLink}>History</Link>
        <div className="flex items-center gap-6">
          <button
            className={styles.helpBtn}
            onClick={handleHelpClick}
          >
            Help
          </button>
          {/* <button className={styles.settingsBtn}>
            ⚙️
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default NavBar;