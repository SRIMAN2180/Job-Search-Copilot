const fs = require("fs");
const path = require("path");

const mdPath = path.join(__dirname, "..", "AGENTS.md");
const desc = process.argv[2]?.trim();

if (!desc) {
  console.error("Usage: npm run feature:done \"<description of what was implemented>\"");
  process.exit(1);
}

let content = fs.readFileSync(mdPath, "utf-8");

const progressHeader = "## Progress";
const doneHeader = "### Done";

if (!content.includes(progressHeader)) {
  content = content.replace(
    "## Key conventions",
    `${progressHeader}\n\n${doneHeader}\n\n### In Progress\n\n- (none)\n\n## Key conventions`
  );
  fs.writeFileSync(mdPath, content);
}

const lines = content.split("\n");
let doneIndex = -1;
let sectionEndIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === doneHeader) doneIndex = i;
  if (doneIndex !== -1 && i > doneIndex && (lines[i].trim().startsWith("### ") || lines[i].trim().startsWith("## "))) {
    sectionEndIndex = i;
    break;
  }
}
if (sectionEndIndex === -1) sectionEndIndex = lines.length;

const entry = `- ${desc}`;

// Check for duplicate
for (let i = doneIndex + 1; i < sectionEndIndex; i++) {
  if (lines[i].trim() === entry) {
    console.log("Entry already exists in AGENTS.md — skipping.");
    process.exit(0);
  }
}

// Collect existing real bullets (not the placeholder)
const realBullets = [];
const placeholderPattern = /\(none yet.*\)/;
for (let i = doneIndex + 1; i < sectionEndIndex; i++) {
  const t = lines[i].trim();
  if (t.startsWith("- ") && !placeholderPattern.test(t)) {
    realBullets.push(i);
  }
}

if (realBullets.length === 0) {
  // Replace the placeholder line or insert after Done header
  for (let i = doneIndex + 1; i < sectionEndIndex; i++) {
    const t = lines[i].trim();
    if (t.startsWith("- ") && placeholderPattern.test(t)) {
      lines[i] = `  ${entry}`;
      fs.writeFileSync(mdPath, lines.join("\n"));
      console.log(`✓ Added to AGENTS.md: ${desc}`);
      process.exit(0);
    }
  }
  // No placeholder found, insert after header
  lines.splice(doneIndex + 1, 0, "", `  ${entry}`);
} else {
  // Insert after the last real bullet
  const insertAt = realBullets[realBullets.length - 1] + 1;
  lines.splice(insertAt, 0, `  ${entry}`);
}

fs.writeFileSync(mdPath, lines.join("\n"));
console.log(`✓ Added to AGENTS.md: ${desc}`);
