import { pathToFileURL } from 'node:url';
import fs from 'fs';
import * as cheerio from 'cheerio';

const PROGRAMS_URL =
  'https://calendar.carleton.ca/undergrad/undergradprograms/computerscience/';

export type ChooseGroup = {
  credits: number;
  courses: string[];
};

export type ElectiveRequirement = {
  category: string;
  credits: number;
};

export type ProgramRequirements = {
  url: string;
  requiredCourses: string[];
  chooseGroups: ChooseGroup[];
  electives: ElectiveRequirement[];
};

type ProgramRequirementsManifest = Record<string, ProgramRequirements>;

type RawGroupItem = {
  text: string;
  credits: number;
  isReal: boolean;
};

type WorkingGroup = {
  requiredCredits: number;
  items: RawGroupItem[];
};

const clean = (s: string) =>
  s
    .replace(/[\u00a0\u200b]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const slugify = (s: string) =>
  clean(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const titleCase = (s: string) =>
  clean(s)
    .toLowerCase()
    .replace(/\b[a-z]/g, (ch) => ch.toUpperCase());

const removeCreditSuffix = (s: string) =>
  clean(s).replace(/\s*\(\d+(?:\.\d+)? credits?\)\s*$/i, '');

const parseCredits = (s: string) => {
  const credits = Number.parseFloat(clean(s));
  return Number.isFinite(credits) ? credits : 0;
};

const pushUnique = (values: string[], value: string) => {
  if (!values.includes(value)) values.push(value);
};

const isRealCourseCode = (course: string) => /^[A-Z]{4,5}\s\d{4}$/.test(course);

const normalizeElectiveCategory = (rawCategory: string) => {
  const normalized = clean(rawCategory)
    .replace(/[.]+$/g, '')
    .replace(/electives?$/i, 'elective');
  return titleCase(normalized);
};

const normalizeChoiceLabel = (rawLabel: string) =>
  clean(rawLabel)
    .replace(/^or\s+/i, '')
    .replace(/^\d+\.\s*/i, '')
    .replace(/^\d+(?:\.\d+)?\s*credits?\s+(in|from)\s*/i, '')
    .replace(/^\d+(?:\.\d+)?\s*credit\s+(in|from)\s*/i, '')
    .replace(/^credits?\s+(in|from)\s*/i, '')
    .replace(/:\s*$/i, '')
    .trim();

const parseProgramRequirementsTable = (
  $: cheerio.CheerioAPI,
  table: ReturnType<cheerio.CheerioAPI>,
): Pick<ProgramRequirements, 'requiredCourses' | 'chooseGroups' | 'electives'> => {
  const requiredCourses: string[] = [];
  const electives: ElectiveRequirement[] = [];
  const workingGroups: WorkingGroup[] = [];
  let currentGroup: WorkingGroup | null = null;

  // Helper to cleanly strip any credit markers and trailing colons/spaces
  const cleanCreditsAndColons = (text: string): string => {
    return text
      .replace(/\[?\d+(?:\.\d+)?\]?\s*$/, '') // Strips trailing credits like [0.5] or 0.5
      .replace(/:\s*$/, '')                   // Strips trailing colons
      .trim();
  };

  table.find('tr').each((_, rowElement) => {
    const row = $(rowElement);
    const cells = row.find('td');
    if (!cells.length) return;

    const rowText = clean(row.text());
    if (rowText === 'Total Credits') {
      currentGroup = null;
      return;
    }

    const codeCol = row.find('td.codecol').first();
    const isCourseRow = codeCol.length > 0;
    const hoursCol = row.find('td.hourscol').first();
    const hoursText = clean(hoursCol.text());
    const rowCredits = parseCredits(hoursText);

    // 1. Area Header Rows
    if (row.hasClass('areaheader')) {
      currentGroup = null;
      return;
    }

    // 2. Capture Elective Rows
    const isElectiveRow = !isCourseRow && /electives?/i.test(rowText);
    if (isElectiveRow) {
      currentGroup = null;
      
      const commentSpan = row.find('span.courselistcomment').first();
      const rawCategoryText = commentSpan.length > 0 
        ? clean(commentSpan.text()) 
        : rowText.replace(hoursText, '');

      const category = normalizeElectiveCategory(
        cleanCreditsAndColons(rawCategoryText)
          .replace(/^\d+\.\s*/, '')
          .replace(/^\d+(?:\.\d+)?\s*credits?\s+(in|of|from)?\s*/i, '')
      );

      electives.push({ category, credits: rowCredits });
      return;
    }

    // 3. Requirement Header or Text-based inline requirements
    const commentSpan = row.find('span.courselistcomment').first();
    const isCommentRow = !isCourseRow && commentSpan.length > 0;

    const inlineCommentText = isCommentRow ? clean(commentSpan.text()) : rowText;
    const cleanInlineText = normalizeChoiceLabel(inlineCommentText);
    
    // Check if the row starts with a list item indicator (e.g. "1. ", "A. ")
    const hasListPrefix = /^\s*(?:\d+|[A-Z])\.\s+/i.test(inlineCommentText);

    // Start a new group if it's a standalone requirement AND:
    // - We aren't in a group yet, OR
    // - This row is explicitly a new numbered list item (forcing the old one to close)
    const isStandaloneGroupRequirement = 
      !isCourseRow && 
      /credits?\s+(in|from)/i.test(inlineCommentText) &&
      (currentGroup === null || hasListPrefix);

    if (isStandaloneGroupRequirement) {
      const groupCredits = rowCredits || parseCredits(inlineCommentText);
      const isAbstractPlaceholder = /level/i.test(cleanInlineText) || /above/i.test(cleanInlineText);

      currentGroup = {
        requiredCredits: groupCredits,
        items: [],
      };
      workingGroups.push(currentGroup);

      if (isAbstractPlaceholder) {
        currentGroup.items.push({
          text: cleanCreditsAndColons(cleanInlineText),
          credits: groupCredits,
          isReal: false,
        });
        
        currentGroup = null; 
      }
      return;
    }

    // 4. Collect course / text items
    let itemText = '';
    let isReal = false;

    if (isCourseRow) {
      itemText = clean(codeCol.text());
      itemText = cleanCreditsAndColons(itemText);
      isReal = isRealCourseCode(itemText);
    } else {
      const textWithoutHours = rowText.replace(hoursText, '').trim();
      itemText = cleanCreditsAndColons(normalizeChoiceLabel(textWithoutHours));
      isReal = false;
    }

    if (!itemText) return;

    if (currentGroup) {
      const itemCredits = rowCredits || parseCredits(rowText) || 0.5;
      currentGroup.items.push({
        text: itemText,
        credits: itemCredits,
        isReal,
      });
    } else if (isReal) {
      pushUnique(requiredCourses, itemText);
    }
  });

  // 5. Resolve working groups mathematically
  const finalChooseGroups: ChooseGroup[] = [];

  for (const group of workingGroups) {
    if (group.items.length === 0) continue;

    const totalGroupCredits = group.items.reduce((acc, item) => acc + item.credits, 0);
    
    // If the sum of all items matches the header target exactly, everything is mandatory.
    const isAllMandatory = Math.abs(totalGroupCredits - group.requiredCredits) < 0.001;

    if (isAllMandatory) {
      for (const item of group.items) {
        if (item.isReal) {
          pushUnique(requiredCourses, item.text);
        } else {
          finalChooseGroups.push({
            credits: item.credits,
            courses: [item.text],
          });
        }
      }
    } else {
      // If there are more credits than the requirement, it is a choice group (like Game Dev)
      finalChooseGroups.push({
        credits: group.requiredCredits,
        courses: group.items.map((item) => item.text),
      });
    }
  }

  return {
    requiredCourses,
    chooseGroups: finalChooseGroups,
    electives,
  };
};

export function parseProgramRequirementsPage(
  programsHtml: cheerio.CheerioAPI,
  pageUrl = PROGRAMS_URL,
): ProgramRequirementsManifest {
  const requirements: ProgramRequirementsManifest = {};

  programsHtml('div#textcontainer h3[id]').each((_, headingElement) => {
    const heading = programsHtml(headingElement);
    const table = heading.nextAll('table.sc_courselist').first();

    if (!table.length) return;

    const key = parseProgramKey(heading);
    let identifier = key;
    let suffix = 2;

    while (identifier in requirements) {
      identifier = `${key}-${suffix}`;
      suffix += 1;
    }

    requirements[identifier] = {
      url: `${pageUrl}#${heading.attr('id') ?? identifier}`,
      ...parseProgramRequirementsTable(programsHtml, table),
    };
  });

  return requirements;
}

const parseProgramKey = (programHeading: ReturnType<cheerio.CheerioAPI>) => {
  const headingId = clean(programHeading.attr('id') ?? '');
  if (headingId) return slugify(headingId);
  return slugify(removeCreditSuffix(programHeading.text()));
};

export async function scrapePrograms(): Promise<void> {
  const programsHtml = await cheerio.fromURL(PROGRAMS_URL);
  const programs = parseProgramRequirementsPage(programsHtml);

  fs.writeFileSync(
    'scripts/output/programs-requirements.json',
    JSON.stringify(programs, null, 2),
    'utf-8',
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  scrapePrograms().catch((err) => {
    console.error('Scrape failed:', err);
    process.exit(1);
  });
}