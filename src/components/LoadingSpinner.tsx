import { useFlightPathContext } from "../Context"

const LoadingSpinner = () => {
    const { isLoading } = useFlightPathContext()

    return isLoading
        ? <span className="loading-spinner" role="status" aria-label="Loading" />
        : null
}

export default LoadingSpinner
