import type { Prereq } from "@/types/course";

//COMP 2401 with a minimum grade of C-, (COMP 2404 or SYSC 3010 or SYSC 3110) with a minimum grade of C-, and (COMP 2406 or SYSC 4504)
// Returns null for an empty or missing string, a structured Prereq node otherwise.
export function parsePrereq(raw: string): Prereq | null {
    if (raw.trim() === "") {
        return null;
    }
    let out: Prereq = { kind: 'raw', text: raw };
    const parts = raw.split(",").map(part => part.trim());
    //check what kind
    const last = parts[parts.length - 1] ?? "";
    if (last.startsWith("and ")) {
        out = { kind: 'all', of: [] };
    } else if (last.startsWith("or ")) {
        out = { kind: 'any', of: [] };
    } else if (parts.length === 1) {
        // this handles both simple courses and nested stuff where its like "(A or B) with a minimum grade of C-"
        out = parseNestedPart(parts[0]);
        return out;
    }

    //now we have the kind of the prereq, we need to parse the parts
    if (out.kind === 'all' || out.kind === 'any') {
        for (const rawPart of parts) {
            let part = rawPart;
            //remove the and/or
            if (part.startsWith('and ')) part = part.slice(4).trim();
            if (part.startsWith('or ')) part = part.slice(3).trim();
            //nested?
            if (part.startsWith("(")) {
                out.of.push(parseNestedPart(part));
            } else {
                out.of.push(parseCoursePart(part));
            }
        }
    }
    return out;
}

// Parses a part that should probably be a course code and possibly has a min grade, ex "COMP 2401 with a minimum grade of C-"
function parseCoursePart(part: string): Prereq {
    const trimmed = part.trim();
    const [coursePart, gradePart] = trimmed.includes(" with a minimum grade of ")
        ? trimmed.split(" with a minimum grade of ").map(s => s.trim())
        : [trimmed, undefined];

    if (!isCourseCode(coursePart)) {
        return { kind: 'raw', text: trimmed };
    }

    if (gradePart) {
        return { kind: 'course', code: coursePart, minGrade: gradePart };
    }

    return { kind: 'course', code: coursePart };
}

// Parses a part that has nested parentheses and possibly has a min grade, ex "(COMP 2401 or COMP 2402) with a minimum grade of B-"
function parseNestedPart(part: string): Prereq {
    // accepts strings like `(A or B) with a minimum grade of X` or `A and B`
    let s = part.trim();
    const gradeMarker = " with a minimum grade of ";
    let grade: string | undefined;

    const idx = s.indexOf(gradeMarker);
    if (idx !== -1) {
        grade = s.slice(idx + gradeMarker.length).trim();
        s = s.slice(0, idx).trim();
    }

    if (s.startsWith("(") && s.endsWith(")")) {
        s = s.slice(1, -1).trim();
    }

    let node: Prereq;
    if (s.includes(" and ")) {
        const subparts = s.split(" and ").map(s => s.trim());
        node = { kind: 'all', of: subparts.map(parseCoursePart) };
    } else if (s.includes(" or ")) {
        const subparts = s.split(" or ").map(s => s.trim());
        node = { kind: 'any', of: subparts.map(parseCoursePart) };
    } else {
        // its not nested, just a course part with a possible min grade
        node = parseCoursePart(s);
    }

    // if there was an overall min grade (ex "(A or B) with a minimum grade of C-"), we need to attach that min grade to all courses in the prereq
    // if there are min grades on the individual courses, its handled by parseCoursePart
    // if there is ever a case where there are both an overall min grade and individual min grades, the overall min grade takes precedence (dont think this ever happens)
    if (grade) attachGrade(node, grade);
    return node;
}

// Recursively puts the min grade on all courses in the prereq given. Used for overall min grades applied to nested groups, ex "(A or B) with a minimum grade of C-" 
function attachGrade(node: Prereq, grade: string) {
    if (node.kind === 'course') {
        (node as any).minGrade = grade;
    } else if (node.kind === 'raw') {
        // put the grade text on to the raw text so the min grade is preserved for unparseable parts.
        // This is weird but its only for when it falls back to raw text
        (node as any).text = `${(node as any).text} with a minimum grade of ${grade}`;
    } else if (node.kind === 'all' || node.kind === 'any') {
        for (const child of node.of) {
            attachGrade(child, grade);
        }
    }
}

// checks if the part is a valid course code like "COMP 2401"
function isCourseCode(part: string): boolean {
    return /^[A-Z]{4}\s\d{4}$/.test(part.trim());
}