import { useLayoutEffect, useState, type RefObject } from "react"

export const useWorkspaceWidth = (containerRef: RefObject<HTMLElement | null>) => {
    const [width, setWidth] = useState(() => window.innerWidth)

    useLayoutEffect(() => {
        const container = containerRef.current
        if (!container) return

        const updateWidth = () => setWidth(container.getBoundingClientRect().width)
        const observer = new ResizeObserver(updateWidth)
        observer.observe(container)
        window.addEventListener("resize", updateWidth)
        document.addEventListener("visibilitychange", updateWidth)
        updateWidth()

        return () => {
            observer.disconnect()
            window.removeEventListener("resize", updateWidth)
            document.removeEventListener("visibilitychange", updateWidth)
        }
    }, [containerRef])

    return width
}
