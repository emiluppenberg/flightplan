import { useRef, useState } from "react";
import AppLogo from "./AppLogo"
import Highlights from "./Highlights";
import SearchAirportForm, { type SearchAirportFormHandle } from "./SearchAirportForm";
import Expand from "./Expand";
import { SVG_URLS } from "../utilities";
import Dialog from "./Dialog";
import SignUpForm from "./SignUpForm";

const AppHeader = () => {
    const [showHighlights, setShowHighlights] = useState(false)
    const searchFormRef = useRef<SearchAirportFormHandle>(null)

    return (
        <div className="app-header">
            <div className="app-header-row top">
                <div className="top-buttons left">
                    <button
                        type="button"
                        className={`btn-highlight ${showHighlights ? "open" : ""}`}
                        onClick={() => setShowHighlights(value => !value)}
                    >
                        <img src={SVG_URLS.highlight} width="20" />
                    </button>
                    <Dialog
                        title="Search"
                        buttonClassName="btn-search"
                        buttonInlineElement={<img src={SVG_URLS.search} width="20" />}
                        onOpen={() => searchFormRef.current?.onOpen()}>
                        {(closeDialog) => (
                            <SearchAirportForm
                                ref={searchFormRef}
                                onClose={closeDialog}
                            />
                        )}
                    </Dialog>
                </div>
                <AppLogo />
                <div className="top-buttons right">
                    <Dialog
                        title="Sign Up"
                        buttonInlineElement="Sign Up">
                        {(closeDialog) => (
                            <SignUpForm onClose={closeDialog} />
                        )}
                    </Dialog>
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
