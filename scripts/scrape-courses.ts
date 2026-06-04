
import * as cheerio from "cheerio"
import fs from "fs"

import type {Course} from "../src/types/course"
export type Program = {
    url: string,
    courses: Course[];
}
const clean = (s: string) =>
    s
    .replace(/[\u00a0\u200b]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

let programsToScan: string[] = [
    "Computer Science",
    "Italian (Minor)"
    //"name" as it appears on https://calendar.carleton.ca/undergrad/undergradprograms/
]

export async function getPrograms(programsHtml: cheerio.CheerioAPI) : Promise<Record<string, Program>> {
    let programs: Record<string, Program> = {};
    const programsList = programsHtml("div.page_content a")
    programsList.each((idx: any, ele: any) => {
        const programLinkEle = programsHtml(ele);
        if (programsToScan.includes(programLinkEle.text())){
                programs[programLinkEle.text()] = {
                url: `https://calendar.carleton.ca${programLinkEle.attr("href")}`, 
                courses: []
            }
        };
    })
    
    return programs;
}

export function buildCourseData(course: any): Course {
    let precludes: string[] = [];
    let prereqRaw = null;
    if (course.text().includes("Precludes additional credit for")){
        let precludeString = course.html()
        if (precludeString){
            precludeString.split("Precludes")[1]
            if (precludeString.includes("Prerequisite(s):")){
                const splitString = precludeString.split("Prerequisite(s):")
                precludeString = splitString[0];
                prereqRaw = splitString[1].split("<br")[0]
            }

            const precHtml = cheerio.load(precludeString);
            precHtml("a").each( (_,ele) => {
                const title: any = precHtml(ele).attr("title");
                precludes.push(clean(title))
            })
        }
    } else if (course.text().includes("Prerequisite(s):")){
        const infoHtml = course.html()
        if (infoHtml) {
            prereqRaw = infoHtml.split("Prerequisite(s):")[1].split("<br")[0]
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
            course
                .find(".courseblocktitle")
                .text()
                .match(/\[(\d+(\.\d+)?)\s*credit\]/i)?.[1] ?? 0
        ),
        description: clean(
            course
                .clone()
                .children(".coursedescadditional")
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

export async function getProgramCourses(programs: Record<string,Program>): Promise<void> {
    for (const program of Object.values(programs) as any[]) {
        const programHtml = await cheerio.fromURL(program.url+"#coursesinventory");
        const courses = programHtml("div.courseblock");
    
        courses.each((_, ele) => {
            const course = programHtml(ele);
            
            try {
                const courseData = buildCourseData(course); 
                program.courses.push(courseData)
            } catch {
                console.log("Could not parse course data with html: "+course.html())
            }
        })
    }
}

async function scrape(): Promise<void> {
    const programsHtml = await cheerio.fromURL("https://calendar.carleton.ca/undergrad/undergradprograms/")
    
    let programs: Record<string,Program> = await getPrograms(programsHtml);
    await getProgramCourses(programs);

    fs.writeFileSync(
        "scripts/output/courses-scraped.json",
        JSON.stringify(programs, null, 2),
        "utf-8"
    )
}

scrape();