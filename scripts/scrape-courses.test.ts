import * as scraper from "./scrape-courses"
import fs from "fs"
import * as cheerio from "cheerio"
import type {Program} from "./scrape-courses"

/**
 * In production, programs are fetched dynamically:
 *   const programsHtml = await cheerio.fromURL("https://calendar.carleton.ca/undergrad/undergradprograms/");
 *   const programs = scraper.getPrograms(programsHtml);
 *
 * For testing, we use local fixtures with hardcoded URLs instead:
 */
let programsForTest: Record<string, Program> = {
    "Computer Science" : {
        url: "scripts/fixtures/cs_courses.html",
        courses: []
    },
    "Mathematics and Statistics" : {
        url: "scripts/fixtures/MathStats_courses.html",
        courses: []
    }
}

/** 
 coursesScrapeTest is a test of reading courses for the programs fetched previously. It uses downloaded versions of programs' pages from the calendar website.
 */ 
function coursesScrapeTest() {
    for (const program of Object.values(programsForTest) as Program[]) {
        
        const htmlContent = fs.readFileSync(program.url, "utf-8")
        const programHtml = cheerio.load(htmlContent)

        const courses = programHtml("div.courseblock");
        courses.each((_, ele) => {
            const course = programHtml(ele);

            try {
                const courseData = scraper.buildCourseData(course); 
                program.courses.push(courseData)
            } catch (err) {
                console.error("Could not parse course data:", err, "\nHTML:", course.html())
            }

        })
    }

    fs.writeFileSync(
        "scripts/output/courses-scraped.json",
        JSON.stringify(programsForTest, null, 2),
        "utf-8"
    )
}
coursesScrapeTest();

function programsScrapeTest() {
    const htmlContent = fs.readFileSync("scripts/fixtures/programsPage.html", "utf-8")
    const programsHtml = cheerio.load(htmlContent)
    const programs = scraper.getPrograms(programsHtml)
    console.log("Programs scraped & saved: ") // only saves programs in the programsToScan scan within scrape-courses.ts as it uses the script in scrape-courses.ts
    console.log(programs)
}
programsScrapeTest();