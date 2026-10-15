import { useFlightPathContext } from "../Context"

export interface MessagesProps {
    message?: string
    warning?: boolean
}

const MessageRow = ({ message, warning, onDismiss }: {
    message: string
    warning?: boolean
    onDismiss?: () => void
}) => (
    <div className="message-row">
        <p className={`message ${warning ? "warning" : "info"}`}>{message}</p>
        {onDismiss && (<button type="button" onClick={onDismiss}>OK</button>)}
    </div>
)

const Messages = (props: MessagesProps) => {
    const context = useFlightPathContext()
    const message = props.message

    if (message !== undefined) {
        return (
            <MessageRow
                message={message}
                warning={props.warning} />
        )
    }

    return (
        <div>
            {context.messages.map((message, index) => (
                <MessageRow
                    key={`message-${index}`}
                    message={message.message}
                    onDismiss={() => context.handleDiscardMessage(index)} />
            ))}
            {context.errors.map((error, index) => (
                <MessageRow
                    key={`error-${index}`}
                    message={`${error.message}${error.time ? " - " + new Date(error.time).toLocaleTimeString("sv-SE") : ""}`}
                    warning
                    onDismiss={() => context.handleDiscardError(index)} />
            ))}
        </div>
    )
}

export default Messages
