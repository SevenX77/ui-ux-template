# 0008 Story Forge follows production logic, and the handbook's defects are fixed as classes

Purpose: someone who makes films can believe the Story Forge sample, and an agent copying any sample inherits behaviour that matches `UI-RULES.md`.

Status: established on 2026-10-30. Application state: applied, not committed, on branch `interaction-polish`.

This amends decision 0006, decision 1 ("copy the code"). Behaviour stays copied. The prototype's film data is corrected wherever it breaks production logic, because faithful copying is no defence for a sample others will copy.

## Decisions

1. **A shot is a piece of the film.** Serves: a believable workflow. Storyboard walls, breakdown boards and QC boards are never shots, unit thumbnails or set props. They stay on the Explore canvas as what they are: pre-production and post-production material.
2. **Time is derived, never stored twice.** Serves: numbers that add up. A shot stores its duration. A unit's and a cut's duration are the sum of their shots.
3. **The film is 12 shots and 45 seconds, on this table.**

   | # | Scene | Beat | Tc | Dur | Story | On screen | Dialogue | Picture | Panel |
   |---|---|---|---|---|---|---|---|---|---|
   | 1 | 1 INT. BEDROOM — BEFORE DAWN | Wake | 0 | 4 | Joe wakes, blue light on his face | Joe | Announcer off-screen starts | shot-joe-crt-closeup | sb-01 |
   | 2 | 2 INT. LIVING ROOM — BEFORE DAWN | Broadcast | 4 | 5 | Parents rigid on the sofa | Pete, Donna | | shot-parents-living-room | sb-02 |
   | 3 | 2 | Broadcast | 9 | 3 | Insert: white street on the TV | none | | shot-crt-static | sb-03 |
   | 4 | 2 | Broadcast | 12 | 4 | Joe in the doorway | Joe | JOE: "Dad. Mom. Can you hear me?" | shot-joe-recognition | sb-04 |
   | 5 | 2 | Morph / Hammer | 16 | 4 | Cheek turns to wool | Pete | PETE: "We are fine. The world is fine." (lips barely moving) | shot-sheep-morph | sb-05 |
   | 6 | 2 | Morph / Hammer | 20 | 3 | Hand on the hammer | Joe (hand) | | shot-hammer-prop | sb-06 |
   | 7 | 2 | Morph / Hammer | 23 | 2 | Screen breaks | none | Announcer cuts off | shot-broken-tv | sb-07 |
   | 8 | 2 | False relief | 25 | 4 | Parents almost human | Pete, Donna | DONNA: "Do not go outside, sweetheart." | shot-parents-human | sb-08 |
   | 9 | 3 EXT. BALCONY — DAWN | Reveal | 29 | 5 | Joe above the flooded street | Joe | | shot-sheep-street | sb-09 |
   | 10 | 3 | Reveal | 34 | 4 | The flock, all facing the building | none | | shot-flock-reveal | sb-10 |
   | 11 | 3 | Hold | 38 | 4 | Joe between the dead TV, still flickering, and the flock | Joe | | shot-joe-hold | sb-11 |
   | 12 | 3 | Hold | 42 | 3 | CUT TO BLACK: noise and breath; end card | none | | black | sb-12 |

   Acts: I is shots 1 to 8 (29s); II is shots 9 to 12 (16s), and the break is Joe crossing outside. Scenes run 4, 25 and 16 seconds. Beats run 4, 12, 9, 4, 9 and 7 seconds.
4. **The hierarchy nests: Film > Act > Scene > Beat > Shot.** Serves: a structure that cannot contradict itself. A scene is one place and continuous time, so a beat sits inside a scene. Scope counts become 1, 2, 3, 6 and 12. The zoom control's order follows.
5. **A shot has a stable id, and a cut is a list of shot ids.** Serves: cuts that stay coherent. Units, characters and durations are looked up per cut by id, never by position. The cuts:
   - A **Picture Lock**: shots 1 to 12, 45s.
   - B **Alt Cut**, without the TV insert so the reveal stays a surprise: 1, 2, 4, 5, 6, 7, 8, 9, 10, 12, 38s.
   - C **Trailer**: 1, 5, 7, 9, 15s.
   - D **Teaser**, which withholds the reveal: 1, 4, 12, 11s.
   - E **Festival Master**: the picture of A, labelled as a deliverable of A.
6. **All tracks share one time axis.** Serves: an edit timeline a professional recognises. Picture and every lane place clips at `x = t × pxPerSec`. Lanes hold real content:
   - Dialogue: Joe on shot 4, Pete on shot 5, Donna on shot 8, each with speaker and line.
   - Announcer off-screen 0 to 23s; hum 0 to 23s; mute at the impact; static flood from 25s; hammer and glass at 23s; sheep cloth and breath from 25s; one sparse music cue 29 to 42s; noise and breath 42 to 45s.
   - Graphics: title over shot 1, TV chyron on shot 3, end card on shot 12. Subtitles carry speech only.
   Audio clips open their own details, never a shot's image prompt.
7. **Frames show the shot number and record-in timecode at 24fps**, such as `3 · 00:00:09:00`. Serves: labels with meaning. A frame too narrow to hold the whole label, such as the 2-second Shot 7, shows the number and keeps the timecode in its tooltip (revision, 2026-10-31: the full label ran into the next frame).
8. **Every layer and zoom shows the right thing.** Serves: the layers mean what their names say.

   | | Script | Storyboard | Footage |
   |---|---|---|---|
   | Film | logline | panel grid | the playable cut |
   | Act / Scene / Beat | slugged text of that unit | member panels | member shots |
   | Shot | the lines this shot covers | its panel | the selected take and its alternates |

9. **The script is a lined script.** Serves: script and picture agreeing. One heading per location, shot order wins over the old paragraph order, each script element lists the shots that cover it, and picking one selects those shots. The announcer gets a real cue: `ANNOUNCER (V.O.) Everything is normal. Please remain seated.`
10. **Characters, sets and props are per shot and per scene.** Serves: a context panel that describes the selection. Each shot has `size`, `lens`, `move`, its set, its props and its on-screen cast. Shots declare one format, 16:9. The camera row is named "look target", since the takes are generated.
11. **Explore follows the order of production:** seed, script, breakdown, bible, casting, locations, lookbook and colour script, storyboard, shot list, props and continuity, VFX breakdown, takes, edit, picture lock, VFX finals, sound, grade, master QC.
12. **Chat replies claim only what exists,** and film terms are used correctly: a cut is not a reel, a plate is the unaltered background, a master is a deliverable, and a take is circled rather than "soft-locked".
13. **The handbook's defects are fixed as classes.** Serves: rules that hold everywhere. Every finding in the audit below is fixed, and each sample's controls either do what they say or are removed. The audit's findings on keyboard focus, touch, state ownership, language, rule breaches, phone layout, accessibility, stale text and dead code all apply.

## Acceptance

- A script evaluates the data and asserts: shots sum to 45s; every unit's duration equals its members; every level partitions the 12 shots; every cut's running time matches decision 5.
- Clicking Shot 3 shows no cast; picking Donna's line shows Donna, her line and shot 8; Cut C's chat claim matches Cut C.
- A real Tab shows a focus ring on every `all:unset` control. A touch flick opens nothing. The language switch leaves no row in the wrong language.
- At 375 wide there is no page overflow under any gallery filter, and no control is hard-cut.
- No console errors in all six themes and both languages. Every other section's behaviour is otherwise unchanged.

## Owner record

2026-10-30: 「全面检查一下细节」「全面检查一下story forge，要符合制作逻辑」 Gloss: "Check the details comprehensively." "Check Story Forge comprehensively; it must follow production logic." The quotations record the direction; the decisions above are the operative statement.
