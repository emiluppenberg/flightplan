import { useState } from "react";
import AppLogo from "./AppLogo"
import Config from "./Config";
import Expand from "./Expand";
import { SVG_URLS } from "../utilities";
import { useFlightPathContext } from "../Context";
import { NavLink } from "react-router";

const AppHeader = () => {
    const context = useFlightPathContext()
    const [showHighlights, setShowHighlights] = useState(false)

    return (
        <div className="app-header">
            <div className="app-header-row top">
                <div className="top-buttons left">
                    <button
                        type="button"
                        className={`btn-highlight ${showHighlights && "open"}`}
                        aria-label="Highlight settings"
                        title="Highlight settings"
                        onClick={() => setShowHighlights(value => !value)}>
                        <img src={SVG_URLS.highlight} width="18" alt="" />
                    </button>
                    <NavLink
                        to="/search"
                        className={({ isActive }) => `btn-search ${isActive && "open"}`}>
                        <img src={SVG_URLS.search} width="18" alt="" /><span>Search</span>
                    </NavLink>
                    <NavLink
                        to="/"
                        className={({ isActive }) => `btn-aerodromes ${isActive && "open"}`}>
                        <img src={SVG_URLS.aerodromes} width="18" alt="" /><span>My briefings</span>
                    </NavLink>
                </div>
                <AppLogo />
                <div className="top-buttons right">
                    {!context.user && (
                        <>
                            <NavLink
                                to="/sign-in"
                                className={({ isActive }) => `${isActive && "open"}`}>
                                Sign in
                            </NavLink>
                            <NavLink
                                to="/sign-up"
                                className={({ isActive }) => `${isActive && "open"}`}>
                                Sign up
                            </NavLink>
                        </>
                    )}
                    {context.user && (
                        <button type="button" onClick={context.handleSignOut}>Sign Out</button>
                    )}
                </div>
            </div>
            <Expand
                isOpen={showHighlights}
                rows={1}>
                <div className="app-header-row config">
                    <Config />
                </div>
            </Expand>
        </div>
    )
}

export default AppHeader;
