import { useState } from "react";
import AppLogo from "./AppLogo"
import Highlights from "./Highlights";
import SearchAirportDialog from "./SearchAirportDialog";
import Expand from "./Expand";
import { SVG_URLS } from "../utilities";

const AppHeader = () => {
    const [showHighlights, setShowHighlights] = useState(false)

    return (
        <div className="app-header">
            <div className="app-header-row top">
                <div className="top-buttons">
                    <button
                        type="button"
                        className={`btn-highlight ${showHighlights ? "open" : ""}`}
                        onClick={() => setShowHighlights(value => !value)}
                    >
                        <img src={SVG_URLS.highlight} width="20" />
                    </button>
                    <SearchAirportDialog />
                </div>
                <AppLogo />
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
