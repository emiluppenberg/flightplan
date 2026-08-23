import { useRef, useState, type MouseEvent, type ReactNode } from "react";

type DialogProps = {
    title: string;
    buttonClassName?: string;
    buttonInlineElement: ReactNode;
    onOpen?: () => void;
    onClose?: () => void
    children: (closeDialog: () => void) => ReactNode;
}

const Dialog = (props: DialogProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [isOpen, setIsOpen] = useState(false)

    const handleOpenDialog = () => {
        dialogRef.current?.showModal();
        setIsOpen(true)
        props.onOpen?.();
    }

    const handleCloseDialog = () => {
        dialogRef.current?.close();
        setIsOpen(false)
    }

    const handleDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
        if (event.target !== event.currentTarget) return

        const bounds = event.currentTarget.getBoundingClientRect();
        const clickedOutside =
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom;

        if (clickedOutside) {
            handleCloseDialog();
        }
    }

    return (
        <>
            <button
                type="button"
                className={`${props.buttonClassName} ${isOpen && "open"}`}
                onClick={handleOpenDialog}>
                {props.buttonInlineElement}
            </button>
            <dialog
                ref={dialogRef}
                onClick={handleDialogClick}
                onClose={() => {
                    setIsOpen(false)
                    props.onClose?.()
                }}>
                <h2>{props.title}</h2>
                <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseDialog}>
                    Close
                </button>
                <div className="dialog-content">
                    {props.children(handleCloseDialog)}
                </div>
            </dialog>
        </>
    )
}

export default Dialog;
