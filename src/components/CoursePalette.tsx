// Reserved pane for the course palette. A later ticket fills this with course
// tiles (built from the same `courseList`/`courses` data the Explorer uses) that
// students drag onto term slots — course tiles are consumed once placed, blanket
// tiles (electives) are reusable. For now it's a labelled placeholder so the
// two-pane layout contract is locked and the palette ticket only fills the body.
//
// Hidden below md to keep narrow screens to the grid alone.
export default function CoursePalette() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 p-4 md:flex">
      <h2 className="text-sm font-semibold text-gray-800">Courses</h2>
      <p className="mt-2 text-xs text-gray-400">
        Drag-and-drop course palette — coming soon.
      </p>
    </aside>
  );
}
