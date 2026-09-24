import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./NavigationMenu.css";

type Props = {
  city?: string;
};

export default function TravellerSidebar({ city = "Bhopal" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const cityPath = city.toLowerCase().replace(/\s+/g, "-");

  const links = [
    { label: "Home", to: "/" },
    { label: "Destination", to: `/destinations/${cityPath}` },
    { label: "Stays", to: `/destinations/${cityPath}/stays` },
    { label: "Food", to: `/destinations/${cityPath}/food` },
    { label: "Places", to: `/destinations/${cityPath}/places` },
    { label: "Nearby trips", to: `/destinations/${cityPath}/nearby` },
    { label: "My Trip", to: "/my-trip" },
  ];

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? "←" : "☰"}
      </button>
      {isOpen && (
  <button
    className="sidebar-backdrop"
    onClick={() => setIsOpen(false)}
    aria-label="Close menu"
  />
)}

      <aside className={isOpen ? "traveller-sidebar open" : "traveller-sidebar"}>
        <Link to="/" className="sidebar-logo">
          TRAAR<span>.</span>
        </Link>
        

        <p className="sidebar-label">PLAN • EXPLORE</p>

        <nav className="sidebar-menu">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={
                location.pathname === link.to
                  ? "sidebar-link sidebar-link-active"
                  : "sidebar-link"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link to="/provider/login" className="sidebar-provider"
        onClick={() => setIsOpen(false)}>
          List your service
        </Link>
      </aside>
    </>
  );
}