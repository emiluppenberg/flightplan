import AerodromeSearchForm from "../components/AerodromeSearchForm"
import Messages from "../components/Messages"
import { useFlightPathContext } from "../Context"

const Search = () => {
    const context = useFlightPathContext()

    return (
        <>
            <Messages />
            <div className="search-container">
                <AerodromeSearchForm />
            </div>
        </>
    )
}

export default Search