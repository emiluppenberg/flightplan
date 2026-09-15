import { useFlightPathContext } from "../Context"
import { SVG_URLS } from "../utilities"

const AppLogo = () => {
    const context = useFlightPathContext()

    return <img
        src={SVG_URLS.logo}
        alt="FlyRep"
        width="100"
        className={context.isLoading ? "loading" : ""}
    />

}

export default AppLogo
