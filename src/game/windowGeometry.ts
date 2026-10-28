export type WindowPosition = { x: number; y: number }

export function clampWindowPosition(
  origin: WindowPosition,
  pointerStart: WindowPosition,
  pointerNow: WindowPosition,
  workspace: { width: number; height: number },
  windowSize: { width: number; height: number },
): WindowPosition {
  const maxX = Math.max(0, workspace.width - windowSize.width - 8)
  // Keep the title bar reachable even if the window is taller than the workspace.
  const maxY = Math.max(0, workspace.height - Math.min(48, windowSize.height))
  return {
    x: Math.max(0, Math.min(maxX, origin.x + pointerNow.x - pointerStart.x)),
    y: Math.max(0, Math.min(maxY, origin.y + pointerNow.y - pointerStart.y)),
  }
}
