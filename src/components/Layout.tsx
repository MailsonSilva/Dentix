import { Outlet } from "react-router-dom";
import ResponsiveNav from "./ResponsiveNav";

const Layout = () => {
    return (
        <div className="min-h-screen flex">
            <ResponsiveNav />
            <main className="flex-1 pb-20 md:pb-0 md:ml-64">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;