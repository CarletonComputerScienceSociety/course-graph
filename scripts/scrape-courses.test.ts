import * as scraper from "./scrape-courses"
import fs from "fs"
import * as cheerio from "cheerio"

import type {Program} from "./scrape-courses"

const htmlContent = fs.readFileSync("scripts/fixtures/programsPage.html", "utf-8")
const programsHtml = cheerio.load(htmlContent)

//let programs: Record<string, Program> = await scraper.getPrograms(programsHtml);
//console.log(programs);

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

import type {Course} from "../src/types/course"
const clean = (s: string) =>
    s
    .replace(/[\u00a0\u200b]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

for (const program of Object.values(programsForTest) as any[]) {
        
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
