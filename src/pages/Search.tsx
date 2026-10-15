import AerodromeSearchForm from "../components/AerodromeSearchForm"
import LoadingSpinner from "../components/LoadingSpinner"
import Messages from "../components/Messages"

const Search = () => {

    return (
        <>
            <div className="page-messages search-messages">
                <Messages />
            </div>
            <div className="section-heading search-heading">
                <div>
                    <div className="section-title">
                        <h1 className="eyebrow">AERODROME SEARCH</h1>
                        <LoadingSpinner />
                    </div>
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
