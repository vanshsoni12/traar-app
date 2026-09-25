import { useTrip } from '../context/TripContext';
import { useExplorer } from "../context/ExplorerContext";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import "./NavigationMenu.css";

type Props = {
  city?: string;
};

export default function TravellerSidebar({ city = "Bhopal" }: Props) {
  const [openedRoute, setOpenedRoute] = useState<string | null>(null);
  const location = useLocation();
  const isOpen = openedRoute === location.key;
  if (openedRoute !== null && openedRoute !== location.key) setOpenedRoute(null);
  const panel = useRef<HTMLDialogElement>(null);
  const close = () => setOpenedRoute(null);
  useEffect(() => {
    if (!isOpen) return;
    const dialog = panel.current;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; };
  }, [isOpen]);

  return (
    <>
      <button
        className="sidebar-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls="traveller-sidebar"
        onClick={() => setOpenedRoute(isOpen ? null : location.key)}
        aria-label="Toggle menu"
      >
        {isOpen ? "←" : "☰"}
      </button>
      {isOpen && createPortal(<dialog ref={panel} id="traveller-sidebar" className="traveller-sidebar open" aria-label="Travel navigation" onCancel={close} onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }}>
        <button type="button" className="sidebar-close" aria-label="Close menu" onClick={close}>×</button>
        <SidebarContent city={city} onNavigate={close} />
      </dialog>, document.body)}
    </>
  );
}

export function SidebarContent({ city = 'Bhopal', onNavigate }: Props & { onNavigate?: () => void }) {
  const ex = useExplorer();
  const { items } = useTrip();
  const location = useLocation();
  const close = () => onNavigate?.();
  const cityPath = city.toLowerCase().replace(/\s+/g, "-");

  const links = [
    { label: "Home", to: "/" },
    { label: "Destination Overview", to: `/destinations/${cityPath}` },
    { label: "Stays", to: `/destinations/${cityPath}/stays` },
    { label: "Food", to: `/destinations/${cityPath}/food` },
    { label: "Places to Visit", to: `/destinations/${cityPath}/places` },
    { label: "Nearby Trips", to: `/destinations/${cityPath}/nearby` },
    { label: `My Trip (${items.length})`, to: "/my-trip" },
    { label: "Search", to: "/search" },
    { label: `Saved Favourites (${ex.favourites.length})`, to: "/favourites" },
    { label: "Help Booth", to: "/help" },
  ];

  return <>
        <Link to="/" className="sidebar-logo" onClick={close}>

          <img
            src={`${import.meta.env.BASE_URL}PHOTO-2026-09-25-02-23-39.jpg`}
            alt="TRAAR"
            style={{ width: "150px", height: "auto", display: "block" }}
          />
        </Link>


        <p className="sidebar-label">PLAN • EXPLORE</p>

        <nav className="sidebar-menu">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => { close(); ex.setQuery(""); }}
              aria-current={location.pathname === link.to ? "page" : undefined}
              className={
                location.pathname === link.to
                  ? "sidebar-link sidebar-link-active"
                  : "sidebar-link"
              }
            >
              {link.label}
            </Link>
          ))}
          <button className="sidebar-link" onClick={() => { close(); ex.setModal('compare'); }}>Compare ({ex.comparison.length})</button>
          <button className="sidebar-link" onClick={() => { close(); ex.setModal('starting'); }}>Starting point</button>
          <button className="sidebar-link" onClick={() => { close(); ex.setReadCount(ex.notifications.length); ex.setModal('notifications'); }}>Notifications</button>
          <button className="sidebar-link" onClick={() => { close(); ex.setModal('profile'); }}>Profile</button>
        </nav>

        <Link to="/provider/login" className="sidebar-provider"
          onClick={() => close()}>
          List your service
        </Link>
  </>;
}
