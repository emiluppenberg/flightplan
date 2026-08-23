import { useRef, useState } from "react";
import AppLogo from "./AppLogo"
import Highlights from "./Highlights";
import SearchAirportForm, { type SearchAirportFormHandle } from "./SearchAirportForm";
import Expand from "./Expand";
import { SVG_URLS } from "../utilities";
import Dialog from "./Dialog";
import UserForm from "./UserForm";
import { useFlightPathContext } from "../Context";

const AppHeader = () => {
    const context = useFlightPathContext()
    const [showHighlights, setShowHighlights] = useState(false)
    const searchFormRef = useRef<SearchAirportFormHandle>(null)

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
                    <Dialog
                        title="Search"
                        buttonClassName="btn-search"
                        buttonInlineElement={<img src={SVG_URLS.search} width="20" />}
                        onOpen={() => searchFormRef.current?.onOpen()}>
                        {() => (
                            <SearchAirportForm ref={searchFormRef} />
                        )}
                    </Dialog>
                </div>
                <AppLogo />
                <div className="top-buttons right">
                    {!context.user && (
                        <>
                            <Dialog
                                title="Sign Up"
                                buttonInlineElement="Sign Up">
                                {(closeDialog) => (
                                    <UserForm
                                        onClose={closeDialog}
                                        onSubmit={context.handleSignUp}
                                        submitText="Sign Up" />
                                )}
                            </Dialog>
                            <Dialog
                                title="Log In"
                                buttonInlineElement="Log In">
                                {(closeDialog) => (
                                    <UserForm
                                        onClose={closeDialog}
                                        onSubmit={context.handleSignIn}
                                        submitText="Log In" />
                                )}
                            </Dialog>
                        </>
                    )}
                    {context.user && (
                        <button type="button" onClick={context.handleSignOut}>Log Out</button>
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
