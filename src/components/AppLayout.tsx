import { Outlet } from "react-router-dom";
import NavigationMenu from "./NavigationMenu";

export default function AppLayout() {
    return (
        <>
            <NavigationMenu />

            <div className="page-with-sidebar">
                <Outlet />
            </div>
        </>
    );
}