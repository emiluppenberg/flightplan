import { useFlightPathContext } from "../Context"

const Messages = () => {
    const context = useFlightPathContext()

    return (
        <div>
            {context.messages.map((message, index) => (
                <div className="message-row">
                    <p className="message">{message}</p>
                    <button
                        type="button"
                        onClick={() => context.handleDiscardMessage(index)}>
                        OK
                    </button>
                </div>
            ))}
            {context.errors.map((error, index) => (
                <div className="message-row">
                    <p className="message warning">{error}</p>
                    <button
                        type="button"
                        onClick={() => context.handleDiscardError(index)}>
                        OK
                    </button>
                </div>
            ))}
        </div>
    )
}

export default Messages