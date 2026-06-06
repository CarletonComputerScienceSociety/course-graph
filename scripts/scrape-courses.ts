
import * as cheerio from "cheerio"
import fs from "fs"

import type {Course} from "../src/types/course"

/**
 * Represents an academic program with its catalog URL and list of associated courses.
 */
export type Program = {
    url: string,
    courses: Course[];
}

/**
 * Normalizes a string by replacing non-breaking and zero-width spaces with regular spaces,
 * collapsing whitespace runs, and trimming leading/trailing whitespace.
 *
 * @param s - The raw string to clean.
 * @returns The cleaned, normalized string.
 */
const clean = (s: string) =>
    s
    .replace(/[\u00a0\u200b]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

/**
 * The set of program names to scrape, as they appear on the Carleton undergraduate programs page.
 * @see {@link https://calendar.carleton.ca/undergrad/undergradprograms/}
 */
const programsToScan: Set<string> = new Set([
    "Computer Science",
    "Mathematics and Statistics"
])

/**
 * Extracts the programs matching {@link programsToScan} from the Carleton undergraduate programs
 * listing page and returns them as a keyed record.
 *
 * @param programsHtml - A Cheerio instance loaded with the HTML of the Carleton undergraduate programs page.
 * @returns A promise resolving to a record mapping program names to their {@link Program} objects.
 *
 * @example
 * const $ = await cheerio.fromURL("https://calendar.carleton.ca/undergrad/undergradprograms/");
 * const programs = await getPrograms($);
 * // programs["Computer Science"] => { url: "https://...", courses: [] }
 */
export function getPrograms(programsHtml: cheerio.CheerioAPI) : Record<string, Program> {
    const programs: Record<string, Program> = {};
    const programsList = programsHtml("div.page_content a")
    programsList.each((_, ele) => {
        const programLinkEle = programsHtml(ele);
        if (programsToScan.has(programLinkEle.text())){
                programs[programLinkEle.text()] = {
                url: `https://calendar.carleton.ca${programLinkEle.attr("href")}`, 
                courses: []
            }
        };
    })
    
    return programs;
}

/**
 * Parses a Cheerio element representing a single course block and extracts its structured data,
 * including code, title, credits, description, prerequisites, and preclusions.
 *
 * @param course - A Cheerio-wrapped element for a `.courseblock` div.
 * @returns A {@link Course} object populated with the parsed course data.
 *
 * @throws Will not throw directly, but callers should handle potential parse failures
 *         (e.g. missing DOM elements) by wrapping in try/catch.
 *
 * @example
 * const courseData = buildCourseData(programHtml(".courseblock").first());
 */
export function buildCourseData(course: ReturnType<cheerio.CheerioAPI>): Course {
    const precludes: string[] = [];
    let prereqRaw = null;

    if (course.text().includes("Precludes additional credit for")){
        let precludeString = course.html()

        if (precludeString){
            precludeString = precludeString.split("Precludes")[1]
            if (precludeString.includes("Prerequisite(s):")){
                const splitString = precludeString.split("Prerequisite(s):")
                precludeString = splitString[0];
                prereqRaw = clean(cheerio.load(splitString[1].split("<br")[0]).text())
            }

            const precHtml = cheerio.load(precludeString);
            precHtml("a").each( (_,ele) => {
                const title = precHtml(ele).attr("title");
                if (title) precludes.push(clean(title));
            })
        }

    } else if (course.text().includes("Prerequisite(s):")){
        const infoHtml = course.html()
        if (infoHtml) {
            prereqRaw = clean(cheerio.load(infoHtml.split("Prerequisite(s):")[1].split("<br")[0]).text())
        }
    }

    const courseData: Course = {
        code: clean(course.find(".courseblockcode").text()),
        title: clean(
            course
                .find(".courseblocktitle")
                .clone()
                .children()
                .remove()
                .end()
                .text()
                .replace(/\[.*?credit\]/, "")
        ),
        credits: Number(
            course.find(".courseblocktitle").text().split("[")[1].split("credit]")[0]
        ),
        description: clean(
            course
                .clone()
                .find("span.courseblocktitle, div.coursedescadditional")
                .remove()
                .end()
                .text()
        ),
        prereq: null,
        prereqRaw,
        precludes
    }

    return courseData;
}

/**
 * Fetches and parses the course listings for each program in the provided record,
 * mutating each {@link Program} object's `courses` array in place.
 *
 * Courses that fail to parse are skipped with a console warning.
 *
 * @param programs - A record of program names to {@link Program} objects, as returned by {@link getPrograms}.
 * @returns A promise that resolves when all programs have been processed.
 *
 * @example
 * await getProgramCourses(programs);
 * // programs["Computer Science"].courses now populated
 */
export async function getProgramCourses(programs: Record<string,Program>): Promise<void> {
    for (const program of Object.values(programs) as Program[]) {
        const programHtml = await cheerio.fromURL(program.url+"#coursesinventory");
        const courses = programHtml("div.courseblock");
    
        courses.each((_, ele) => {
            const course = programHtml(ele);
            
            try {
                const courseData = buildCourseData(course); 
                program.courses.push(courseData)
            } catch (err) {
                console.error("Could not parse course data:", err, "\nHTML:", course.html())
            }
        })
    }
}

/**
 * Entry point for the scraper. Fetches the Carleton undergraduate programs page,
 * extracts matching programs, collects their courses, and writes the result to
 * `scripts/output/courses-scraped.json`.
 *
 * @returns A promise that resolves when the output file has been written.
 */
async function scrape(): Promise<void> {
    const programsHtml = await cheerio.fromURL("https://calendar.carleton.ca/undergrad/undergradprograms/")
    
    const programs: Record<string,Program> = getPrograms(programsHtml);
    await getProgramCourses(programs);

    fs.writeFileSync(
        "scripts/output/courses-scraped.json",
        JSON.stringify(programs, null, 2),
        "utf-8"
    )
}

scrape().catch((err) => {
    console.error("Scrape failed:", err);
    process.exit(1);
});