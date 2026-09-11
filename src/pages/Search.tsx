import SearchAirportForm from "../components/SearchAirportForm"
import { useFlightPathContext } from "../Context"

const Search = () => {
    const context = useFlightPathContext()

    return (
        <>
            {context.message.length > 0 && (<p className="message">{context.message}</p>)}
            {context.error.length > 0 && (<p className="message warning">{context.error}</p>)}
            <div className="search-container">
                <SearchAirportForm />
            </div>
        </>
    )
}

export default Search