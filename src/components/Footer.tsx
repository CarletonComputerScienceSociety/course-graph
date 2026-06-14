export default function Footer() {
  return (
    <footer className="flex-none border-t border-red-600 bg-white px-4 py-3">
      <div className="space-y-2 text-center text-sm text-gray-600">
        <p className="text-lg font-semibold text-gray-900">
          <a href="https://ccss.carleton.ca/">
            Carleton Computer Science Society
          </a>
        </p>
        <div className="space-y-1">
          <p>Not affiliated with or endorsed by Carleton University.</p>
          <p>
            Always verify course requirements in the{' '}
            <a
              className="underline"
              href="https://calendar.carleton.ca/undergrad/undergradprograms/computerscience/"
            >
              official undergraduate calendar
            </a>
            .
          </p>
        </div>
        <p className="text-base">
          © {new Date().getFullYear()} Carleton Computer Science Society -{' '}
          <a
            className="underline"
            href="https://github.com/CarletonComputerScienceSociety/course-graph"
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
