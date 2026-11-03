# 0016 Watching turns the lights off

Purpose: someone watching the Story Forge monitor sees only the picture and the timeline, in the dark, as in a cinema, whichever scheme the workspace uses.

Status: established on 2026-11-01. Application state: applied to Story Forge in the HTML template and to `core/rules/UI-RULES.md` rule 25 on 2026-11-01.

This extends decision 0014 and decision 0010, decision 14, which enlarge the monitor while watching but left the surroundings in the scheme's colours. On a white scheme the enlarged monitor sat in a white room.

## Owner record

2026-11-01: 「我是不是有说过，观影模式，哪怕是白色主题，也要全部关灯？周围全部变成黑的，只留时间线和监视器。监视器不要圆角，影响观影体验」 Gloss: "Didn't I say that watching mode, even on a white theme, turns all the lights off? Everything around goes black, leaving only the timeline and the monitor. The monitor has no rounded corners, which hurt the watching experience."

The earlier records closest to this are 0010 feedback 3, that the timeline is black even on a light background, and 0010 feedback 4, that the media preview has a translucent black backdrop imitating a cinema. Neither stated this for watching, so this decision is new rather than a repair of an earlier one.

## Decisions

1. **Lights off is the watching state wherever a monitor shows.** Serves: one mode, one look. It holds exactly when `.is-watching` holds and the monitor is visible: Storyboard and Film, entered as decision 0014 describes. The script layer has no monitor and follows decision 0015, so it stays lit.
2. **The whole window goes black, not only the workspace.** Serves: a dark room. `.sf-lights`, placed directly before `.sf`, covers the viewport, including the page around the sample, the top bar and the section rail. A click on it counts as a click outside the timeline, so it ends watching, and it stops the click reaching controls that cannot be seen.
3. **Only the monitor and the timeline remain.** Serves: nothing competes with the picture. The title bar with the mode switch, the side panel and the chat fade out and take no input. They come back unchanged when watching ends. A media preview opened while watching keeps its chat bar, following 0010 decision 19. The timecode line below the picture is part of the monitor and stays.
4. **The black is every scheme's timeline black, and what remains reads as the timeline does.** Serves: the same look in every scheme without new colours. Inside the monitor and the timeline, the scheme's ink, surface, line and signal tokens are bound to its existing `--strip-*` tokens, so a light scheme's white toolbars and black selected state do not appear on black.
5. **The monitor picture has square corners, at rest and while watching.** Serves: a picture is a rectangle, and rounding crops it. The rounded corners of other pictures, including the media preview, are unchanged.
6. **The change of light takes as long as the monitor's growth.** Serves: one movement. It uses the same .52s and easing as the monitor's size.

## Acceptance

Checked with real pointer input at 1440x900.

- A1: in Pure, Neon and Paper, a click on the timeline in the Film layer makes the viewport's corners, the page outside the workspace and the workspace's own background the scheme's `--strip` colour.
- A2: the same holds in the Storyboard layer, and during playback with the pointer elsewhere.
- A3: the title bar, the side panel and the chat have opacity 0 and take no input, and the monitor and the timeline are visible above the black, including over the top bar.
- A4: the toolbar's text is light and the selected segment and the play button are visible on black in Pure.
- A5: a click on the black ends watching, restores the earlier colours, side panel and chat, and triggers no control of the page beneath. Esc does the same.
- A6: the script layer never turns black.
- A7: the monitor picture's computed corner radius is 0 at rest and while watching.
