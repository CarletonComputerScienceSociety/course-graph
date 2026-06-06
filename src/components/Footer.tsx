export default function Footer() {
  return (
    <footer className="bg-black border-t-red-600 border-t-2 p-1">
      <div className="text-center text-white text-xs">
        <p className="text-lg font-semibold">
          <a href="https://ccss.carleton.ca/">
            Carleton Computer Science Society
          </a>
        </p>
        <p>
          Not affiliated with or endorsed by Carleton University. Always verify
          course requirements in the{' '}
          <a
            className="underline"
            href="https://calendar.carleton.ca/undergrad/undergradprograms/computerscience/"
          >
            official undergraduate calendar
          </a>
          .
        </p>
        <p className="text-sm">
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
