import { useRef, type MouseEvent, type ReactNode } from "react";

type DialogProps = {
    title: string;
    buttonClassName?: string;
    buttonInlineElement: ReactNode;
    onOpen?: () => void;
    children: (closeDialog: () => void) => ReactNode;
}

const Dialog = (props: DialogProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null)

    const handleOpenDialog = () => {
        dialogRef.current?.showModal();
        props.onOpen?.();
    }

    const handleCloseDialog = () => {
        dialogRef.current?.close();
    }

    const handleDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
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
                className={props.buttonClassName}
                onClick={handleOpenDialog}>
                {props.buttonInlineElement}
            </button>
            <dialog
                ref={dialogRef}
                onClick={handleDialogClick}
            >
                <h2>{props.title}</h2>
                <div className="dialog-content">
                    {props.children(handleCloseDialog)}
                </div>
            </dialog>
        </>
    )
}

export default Dialog;
