import AerodromeSearchForm from "../components/AerodromeSearchForm"
import Messages from "../components/Messages"

const Search = () => {

    return (
        <>
            <Messages />
            <div className="section-heading search-heading">
                <div>
                    <h1 className="eyebrow">AERODROME SEARCH</h1>
                    <p>Find an airport by ICAO code, name, or region.</p>
                </div>
            </div>
            <div className="search-container">
                <AerodromeSearchForm />
            </div>
        </>
    )
}

export default Search
