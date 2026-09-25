import { useLocation, useNavigate } from 'react-router-dom';
import NavigationMenu from './NavigationMenu';
import { useSelectedCity } from '../context/CityContext';
import { backFallback } from '../utils/navigation';
import './PageControls.css';

export default function PageControls() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { city } = useSelectedCity();
  return <nav className="page-controls" aria-label="Page navigation">
    <NavigationMenu />
    {pathname !== '/' && <button type="button" className="page-back-button" onClick={() => {
      const index = window.history.state?.idx;
      if (typeof index === 'number' && index > 0) navigate(-1);
      else navigate(backFallback(pathname, city), { replace: true });
    }}>← Back</button>}
  </nav>;
}
