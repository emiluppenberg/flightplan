import { useFlightPathContext } from "../Context"

const Messages = () => {
    const context = useFlightPathContext()

    return (
        <div>
            {context.messages.map((message, index) => (
                <div
                    key={`message-${index}`}
                    className="message-row">
                    <p className="message">{message.message}</p>
                    <button
                        type="button"
                        onClick={() => context.handleDiscardMessage(index)}>
                        OK
                    </button>
                </div>
            ))}
            {context.errors.map((error, index) => (
                <div
                    key={`error-${index}`}
                    className="message-row">
                    <p className="message warning">{error.message}{error.time && (" - " + new Date(error.time).toLocaleTimeString("sv-SE"))}</p>
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