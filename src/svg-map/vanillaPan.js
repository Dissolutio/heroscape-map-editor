function getPointFromEvent(event) {
  const point = { x: 0, y: 0 }
  // If event is triggered by a touch event, we get the position of the first finger
  if (event.targetTouches) {
    point.x = event.targetTouches[0].clientX
    point.y = event.targetTouches[0].clientY
  } else {
    point.x = event.clientX
    point.y = event.clientY
  }

  return point
}

// We select the SVG into the page
const svg = document.querySelector('svg')

// If browser supports pointer events
if (window.PointerEvent) {
  svg.addEventListener('pointerdown', onPointerDown) // Pointer is pressed
  svg.addEventListener('pointerup', onPointerUp) // Releasing the pointer
  svg.addEventListener('pointerleave', onPointerUp) // Pointer gets out of the SVG area
  svg.addEventListener('pointermove', onPointerMove) // Pointer is moving
} else {
  // Add all mouse events listeners fallback
  svg.addEventListener('mousedown', onPointerDown) // Pressing the mouse
  svg.addEventListener('mouseup', onPointerUp) // Releasing the mouse
  svg.addEventListener('mouseleave', onPointerUp) // Mouse gets out of the SVG area
  svg.addEventListener('mousemove', onPointerMove) // Mouse is moving

  // Add all touch events listeners fallback
  svg.addEventListener('touchstart', onPointerDown) // Finger is touching the screen
  svg.addEventListener('touchend', onPointerUp) // Finger is no longer touching the screen
  svg.addEventListener('touchmove', onPointerMove) // Finger is moving
}

// This variable will be used later for move events to check if pointer is down or not
let isPointerDown = false

// This variable will contain the original coordinates when the user start pressing the mouse or touching the screen
const pointerOrigin = {
  x: 0,
  y: 0,
}

// Function called by the event listeners when user start pressing/touching
function onPointerDown(event) {
  isPointerDown = true // We set the pointer as down

  // We get the pointer position on click/touchdown so we can get the value once the user starts to drag
  const pointerPosition = getPointFromEvent(event)
  pointerOrigin.x = pointerPosition.x
  pointerOrigin.y = pointerPosition.y
}
