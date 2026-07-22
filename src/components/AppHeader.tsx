import AppLogo from "./AppLogo"
import Highlights from "./Highlights";

const AppHeader = () => {

    return (
        <div className="app-header">
            <div className="app-header-row">
                <AppLogo />
            </div>
            <div className="app-header-row control">
                <Highlights />
            </div>
        </div>
    )
}

export default AppHeader;
