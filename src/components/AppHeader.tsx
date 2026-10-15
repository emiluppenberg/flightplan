import { SVG_URLS } from "../utilities";
import { useFlightPathContext } from "../Context";
import { NavLink } from "react-router";

type AppHeaderProps = {
    showHighlights: boolean;
    onToggleHighlights: () => void;
}

const AppHeader = ({ showHighlights, onToggleHighlights }: AppHeaderProps) => {
    const context = useFlightPathContext()

    return (
        <div className="app-header">
            <div className="app-header-row top">
                <div className="top-buttons left">
                    <button
                        type="button"
                        className="control-button btn-highlight"
                        aria-pressed={showHighlights}
                        aria-expanded={showHighlights}
                        aria-controls="highlight-settings"
                        aria-label="Highlight settings"
                        title="Highlight settings"
                        onClick={onToggleHighlights}>
                        <img src={SVG_URLS.highlight} width="18" alt="" />
                        <span>Highlights</span>
                    </button>
                    <NavLink
                        to="/search"
                        aria-label="Search"
                        className="control-button btn-search">
                        <img src={SVG_URLS.search} width="18" alt="" /><span>Search</span>
                    </NavLink>
                    <NavLink
                        to="/my-briefings"
                        aria-label="My briefings"
                        className="control-button btn-aerodromes">
                        <img src={SVG_URLS.aerodromes} width="18" alt="" /><span>My briefings</span>
                    </NavLink>
                </div>
                <div className="top-buttons right">
                    {!context.user && (
                        <NavLink
                            to="/account"
                            className={({ isActive }) => `primary-action${isActive ? " open" : ""}`}>
                            Sign in
                        </NavLink>
                    )}
                    {context.user && (
                        <button type="button" onClick={context.handleSignOut}>Sign Out</button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AppHeader;
