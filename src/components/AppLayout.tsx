
import { Outlet, useNavigate } from "react-router-dom";
import NavigationMenu from "./NavigationMenu";

export default function AppLayout() {
  const navigate = useNavigate();

  function goBack() {
    const historyIndex = window.history.state?.idx;

    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  }

  return (
    <>
      <NavigationMenu />

      <div className="page-with-sidebar">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            margin: "16px",
            padding: "10px 18px",
            backgroundColor: "#173b2b",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>

        <Outlet />
      </div>
    </>
  );
}