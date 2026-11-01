# 0011 Every canvas is infinite and every side panel is an overlay

Purpose: someone working on a canvas keeps their spatial memory, because a component stays where it was put whatever panel opens over it, and an agent copying a canvas sample inherits that behaviour.

Status: established on 2026-10-31. Application state: applied to the node canvas and the business blueprint on 2026-10-31; the Story Forge Explore canvas already complied.

## Owner record

2026-10-31: 「这个画布的侧边栏把画布里面的节点位置挤变形了，这很不符合常识啊。画布应该是无限画布啊，侧边栏是叠加的层，都不在一层上。像业务蓝图那样缩小视图是可以理解的行为，为了不影响用户观察。这是原则，所有画布都是无限画布，侧边栏都是叠层，不会影响画布上组件的物理位置」

Gloss: "This canvas's side panel squeezes the node positions out of shape, which defies common sense. A canvas should be infinite; a side panel is an overlaid layer, not on the same layer. Shrinking the view as the business blueprint does is understandable, so as not to get in the way of observation. This is a principle: all canvases are infinite, side panels are overlays, and they do not affect the physical position of components on the canvas."

## The defect

`templates/html/src/app2.js` placed the side panel beside the stage in a flex row. Opening it made the stage narrower, and a `ResizeObserver` clamped each node to the new width. Example at a 1040px stage with a 280px panel: Video at `x=590`, width 210, needed 820px, so it was rewritten to `x=550` and landed on Camera and Composer. The same clamp limited dragging to the stage, so the canvas had an edge.

## Definitions

- **World coordinate:** a component's position on the canvas, in canvas pixels. Example: Video is `{x:590,y:140}`.
- **View:** the pan and zoom through which the world is seen, `{x,y,z}`. It is one transform on the world layer.
- **Overlay panel:** a panel drawn above the canvas that takes no part in its layout.

## Decisions

1. **Only the user's drag changes a world coordinate.** Serves: spatial memory. Opening a panel, closing it, resizing the window, changing width class and fitting the view never rewrite a coordinate. The narrow-screen rearrangement of nodes and the clamp are removed, and phones show the same world through a smaller view.
2. **There is no canvas edge.** Serves: infinite canvas. Dragging a node has no limit. Dragging empty canvas pans. Ctrl or Cmd with the wheel zooms about the pointer. Zoom in, zoom out and fit are also controls, so touch and keyboard reach them. A plain wheel keeps scrolling the page, because these canvases sit inside a long page and must not trap it.
3. **A side panel is an overlay.** Serves: separate layers. It is absolutely positioned above the canvas and slides in with a transform at the existing push timing, .52s. On a phone it is a bottom sheet over the canvas, with the same rule.
4. **The view may give way; the world may not.** Serves: nothing important is hidden by the panel. When a panel opens and the content does not fit the uncovered area at the current zoom, the view pans and zooms out until it does. If it already fits, the view does not move. When the panel closes, the view returns to where it was, unless the user moved the view meanwhile. The view moves only after the pointer is released, because a press that starts dragging a node also opens its panel, and the view must not change under the pointer.
5. **Clicking empty canvas ends focus only if it was a click.** Serves: panning without losing the panel. The shared layer blurs on pointer down, so a pan would close the panel at its start. On empty canvas, blur now waits for the click, and a click that ended a pan does nothing.
6. **The mechanism lives in core.** Serves: one behaviour across samples. `UX.canvas` in `core/behavior/ux.js` owns the view, and its limits stay in that file. Samples declare `data-canvas` on the stage and pass the world layer, panel and root. The Story Forge Explore canvas keeps its own view code, because it already draws under all chrome and no panel changes its layout.

## Acceptance

Measured in a real browser with real pointer input, in pure and neon, at 1440x900, at a narrow desktop width and at a phone width:

- A1: every node's and group's `left`, `top` and page-independent world coordinates are identical before opening, while open, and after closing the panel.
- A2: the stage's width and height do not change when the panel opens.
- A3: while open, no content rectangle lies under the panel at the widths where it would otherwise be covered, and the view returned to its previous value after closing.
- A4: a node can be dragged past the former stage bounds, and a coordinate stays as dragged after opening a panel and resizing the window.
- A5: dragging empty canvas pans without closing an open panel. A plain click on empty canvas closes it.
- A6: Ctrl with the wheel zooms about the pointer and does not scroll the page. A plain wheel scrolls the page.
- A7: wires stay attached to node ports at every zoom.
- A8: Story Forge and every other sample keep working, shown by the build checks and React parity.
