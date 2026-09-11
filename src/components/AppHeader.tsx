import { useState } from "react";
import AppLogo from "./AppLogo"
import Highlights from "./Highlights";
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
                        onClick={() => setShowHighlights(value => !value)}>
                        <img src={SVG_URLS.highlight} width="20" />
                    </button>
                    <NavLink to="/search">
                        {({ isActive }) => (
                            <button
                                type="button"
                                className={`btn-search ${isActive && "open"}`}>
                                <img src={SVG_URLS.search} width="20" />
                            </button>
                        )}
                    </NavLink>
                    <NavLink to="/all">
                        {({ isActive }) => (
                            <button
                                type="button"
                                className={`btn-airports ${isActive && "open"}`}>
                                <img src={SVG_URLS.airports} width="20" />
                            </button>
                        )}
                    </NavLink>
                </div>
                <AppLogo />
                <div className="top-buttons right">
                    {!context.user && (
                        <>
                            <NavLink to="/sign-in">
                                {({ isActive }) => (
                                    <button
                                        type="button"
                                        className={`${isActive && "open"}`}>
                                        Sign in
                                    </button>
                                )}
                            </NavLink>
                            <NavLink to="/sign-up">
                                {({ isActive }) => (
                                    <button
                                        type="button"
                                        className={`${isActive && "open"}`}>
                                        Sign up
                                    </button>
                                )}
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
                <div className="app-header-row highlights">
                    <Highlights />
                </div>
            </Expand>
        </div>
    )
}

export default AppHeader;
