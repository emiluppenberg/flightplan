import AerodromeSearchForm from "../components/AerodromeSearchForm"
import Messages from "../components/Messages"

const Search = () => {
    
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