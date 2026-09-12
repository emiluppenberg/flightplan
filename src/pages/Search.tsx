import AerodromeSearchForm from "../components/AerodromeSearchForm"
import { useFlightPathContext } from "../Context"

const Search = () => {
    const context = useFlightPathContext()

    return (
        <>
            {context.message.length > 0 && (<p className="message">{context.message}</p>)}
            {context.error.length > 0 && (<p className="message warning">{context.error}</p>)}
            <div className="search-container">
                <AerodromeSearchForm />
            </div>
        </>
    )
}

export default Search