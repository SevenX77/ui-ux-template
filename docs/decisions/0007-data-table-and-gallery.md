# 0007 Data table and image gallery samples

Purpose: an agent building an interface that lists many records or many images takes a working pattern from the handbook, in every theme and both languages, instead of inventing one.

Status: established on 2026-10-30. Application state: applied on branch `interaction-polish`, not yet merged to `main`.

The handbook's existing values table (section 15) lists design values and is not a sample of this kind. Both samples live in `src/03-apps.html`, `src/data.css` and `src/data.js`, as sections 12 and 13.

## Decisions

1. **The data table is a records table.** Serves: a pattern for real lists. Sample `#dt` holds 46 deterministic media records with name, type, owner, status, duration, size and update date. It offers status filter with counts, search, sorting (ascending, descending, none), column resize, column show and hide, row density, row selection with Shift for a range, bulk actions, row actions, a row detail, and paging.
2. **The table's height never changes by itself.** Serves: rule 25, the page does not jump. The scroll area holds eight rows through paging, filtering, an empty result and selection. Only an action that asks for more room changes it: density, or a row detail, which pushes the rows below it (rule 9).
3. **The bulk bar replaces the pager in place.** Serves: rule 9, Retire when both claim the same place. Both occupy the footer, so selecting a row retires the pager and the table does not move.
4. **Rows do not dim each other.** Serves: reading across rows. The whole table is one component with `data-dim="none"`, so a hovered row only takes a background and its tools.
5. **Gallery items are interactive, so hovering one dims the others.** Serves: rule 6. Each image opens a lightbox and holds a favourite button, so it is not display-only.
6. **The gallery places by shortest column, in script.** Serves: stable positions while filtering and resizing. Absolute positions let an image slide to its new place, and a placeholder holds its real proportions before it appears. CSS columns would reorder items and cannot animate.
7. **Art follows the theme.** Serves: a self-contained handbook. The repository has no image assets, so images are theme gradients and patterns chosen deterministically by item.
8. **The phone form keeps every function.** Serves: rules 12 and 18. At 375 wide the table scrolls sideways with the name column pinned and row tools always visible, the status filter scrolls on one line, density control is hidden, and the gallery has two columns.

## Acceptance

- **Table:** sorting cycles; the height stays constant through filter, empty result, paging and selection; Shift selects a range; a row detail pushes the rows below and closes on Esc or an outside click; rename and approve work; a hidden column stays hidden after paging; dense rows are shorter; archiving lowers the count.
- **Gallery:** no two images overlap at any filter or size; filtering and resizing animate; scrolling loads more until all 42 appear; the lightbox opens from its thumbnail, follows the arrow keys and closes on Esc; a favourite persists through filtering.
- **Handbook:** both languages leave no untranslated text; 375 wide has no page overflow; no console errors.

## Owner record

2026-10-30: 「还漏掉两个样张：1. 数据表，不是数值表，明白我的意思嘛？ 2. 图片瀑布流」 Gloss: "Two samples are still missing: 1. a data table, not a table of values, do you see what I mean? 2. an image masonry gallery." The quotation records the direction; the decisions above are the operative statement.
