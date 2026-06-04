
export default function Footer() {
  return (
    <footer className="bg-black border-t-red-600 border-t-2 p-1">
      <p className="text-center text-white text-xs">
        <b>Carleton Computer Science Society</b>
        <br/>
        <a href="https://github.com/CarletonComputerScienceSociety/course-graph">
          <u>GitHub</u>
        </a>
        <br/>
        Not affiliated with or endorsed by Carleton University.
        <br/>
        Always verify course requirements in the official undergraduate calendar.
        <br/>
        © {new Date().getFullYear()} Carleton Computer Science Society
      </p>
    </footer>
  );
}