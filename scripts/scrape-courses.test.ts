import * as scraper from "./scrape-courses"
import fs from "fs"
import * as cheerio from "cheerio"
import type {Program} from "./scrape-courses"

// The following 2 lines are an example of fetching programs from the undergraduate programs webpage, uses a downloaded version of that page
//let programs: Record<string, Program> = scraper.getPrograms(programsHtml);
//console.log(programs);

/*
    ProgramsForTest is an example result of programs fetched from the undergraduate programs webpage. Since we're testing against fixtures, these are hard coded. 
    This would be the result of the above test but the URLs would be actual links:
*/
let programsForTest = {
    "Computer Science" : {
        url: "scripts/fixtures/cs_courses.html",
        courses: []
    },
    "Mathematics and Statistics" : {
        url: "scripts/fixtures/MathStats_courses.html",
        courses: []
    }
}

// coursesScrapeTest is a test of reading courses for the programs fetched previously. It uses downloaded versions of programs' pages from the calendar website.
function coursesScrapeTest() {
    for (const program of Object.values(programsForTest) as Program[]) {
        
        const htmlContent = fs.readFileSync("scripts/fixtures/cs_courses.html", "utf-8")
        const programHtml = cheerio.load(htmlContent)

        const courses = programHtml("div.courseblock");
        courses.each((_, ele) => {
            const course = programHtml(ele);

            try {
                const courseData = scraper.buildCourseData(course); 
                program.courses.push(courseData)
            } catch {
                console.log("Could not parse course data with html: "+course.html())
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