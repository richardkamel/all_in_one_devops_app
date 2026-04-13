const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  LevelFormat, BorderStyle
} = require('docx');
const fs = require('fs');

const accentColor = "2E75B6";

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accentColor, space: 6 } },
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: "1F3864" })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: accentColor })]
  });
}

function body(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, font: "Arial" })]
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: "Arial" })]
  });
}

function note(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: { left: 720 },
    children: [new TextRun({ text: `\u26A0  ${text}`, size: 20, font: "Arial", italics: true, color: "595959" })]
  });
}

function badge(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: `[ ${text} ]`, size: 20, font: "Arial", bold: true, color: "888888" })]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun("")] });
}

function mono(text) {
  return new Paragraph({
    spacing: { before: 20, after: 20 },
    indent: { left: 720 },
    children: [new TextRun({ text, size: 20, font: "Courier New", color: "444444" })]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1F3864" },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: accentColor },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          },
          {
            level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } }
          }
        ]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 120 },
        children: [new TextRun({ text: "DevOps App", bold: true, size: 56, font: "Arial", color: "1F3864" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 480 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: accentColor, space: 12 } },
        children: [new TextRun({ text: "Feature Overview & Product Specification", size: 28, font: "Arial", color: "595959", italics: true })]
      }),

      spacer(),

      // Section 1
      heading1("1. Concept"),
      body("A unified desktop application for developers and DevOps engineers that consolidates all essential tools into a single workspace. Built around a project/session/checkpoint model, it eliminates context-switching between Postman, Docker Desktop, database GUIs, and browser dev tools."),

      spacer(),

      // Section 2
      heading1("2. Project & Session Structure"),

      heading2("2.1  Projects"),
      bullet("Projects are organizational containers only \u2014 their sole purpose is to group sessions together"),
      bullet("A project represents one large initiative that may require multiple independent programs or services to be built"),
      bullet("Example: Project XYZ needs 3 separate pieces of software developed to work together"),

      spacer(),

      heading2("2.2  Sessions"),
      bullet("Sessions are the core unit of work \u2014 this is where development happens"),
      bullet("Each session represents one specific program, service, or component within a project"),
      bullet("Each session is permanently linked to one local folder on the developer\u2019s machine"),
      bullet("Sessions can have child sessions (e.g. Session 1.1) created by branching off from a checkpoint"),
      bullet("Child sessions are shown under their parent in the sidebar with a toggle to expand/collapse them"),
      bullet("You can have multiple sessions per project, each with completely independent code and checkpoint history"),

      spacer(),

      body("Example structure:"),
      spacer(),
      new Paragraph({
        spacing: { before: 60, after: 20 },
        indent: { left: 720 },
        children: [new TextRun({ text: "Project XYZ", bold: true, size: 20, font: "Courier New" })]
      }),
      ...([
        "\u251C\u2500\u2500 Session: Frontend App         \u2192  /projects/xyz/frontend",
        "\u251C\u2500\u2500 Session: Backend API          \u2192  /projects/xyz/api",
        "\u2514\u2500\u2500 Session: Admin Dashboard      \u2192  /projects/xyz/admin",
      ].map(line => new Paragraph({
        spacing: { before: 20, after: 20 },
        indent: { left: 1080 },
        children: [new TextRun({ text: line, size: 20, font: "Courier New", color: "595959" })]
      }))),

      spacer(),

      heading2("2.3  Session History & Checkpoints"),
      body("Each session has its own checkpoint history \u2014 a timeline of saved states the developer can freely navigate."),
      spacer(),
      bullet("A checkpoint is a full snapshot of the session\u2019s linked folder at a given point in time"),
      bullet("The developer saves a checkpoint manually whenever they reach a meaningful state"),
      bullet("Multiple checkpoints are stored per session and displayed in a History tab"),
      bullet("The developer can freely navigate between checkpoints at any time"),
      bullet("Restoring a checkpoint replaces the contents of the linked local folder with that saved state"),
      bullet("Each checkpoint knows its parent \u2014 forming a chain used by the File Change Tracker to determine what \u201Coriginal\u201D means"),

      spacer(),

      heading2("2.4  Checkpoint Operations"),
      bullet("Save as new checkpoint (default) \u2014 creates a new entry in the history, preserving all previous checkpoints"),
      bullet("Overwrite checkpoint \u2014 replaces an existing checkpoint; all checkpoints after it are removed"),
      note("Overwrite always triggers a confirmation warning: \u201CThis will remove N checkpoints after this point. Continue?\u201D"),
      bullet("Branch into child session \u2014 branch off from any checkpoint to create a new child session (e.g. Session 1.1), linked to its own separate local folder, with its own independent checkpoint history starting as a copy of the branch point"),

      spacer(),

      heading2("2.5  How the History Tab Looks"),
      new Paragraph({
        spacing: { before: 60, after: 20 },
        indent: { left: 720 },
        children: [new TextRun({ text: "Session 1  (Backend API)", bold: true, size: 20, font: "Courier New" })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        indent: { left: 720 },
        children: [new TextRun({ text: "\u2500".repeat(40), size: 20, font: "Courier New", color: "AAAAAA" })]
      }),
      ...([
        "\u251C\u2500\u2500 Checkpoint 1  \u2014  Mar 1",
        "\u251C\u2500\u2500 Checkpoint 2  \u2014  Mar 15",
        "\u251C\u2500\u2500 Checkpoint 3  \u2014  Apr 1   \u2190 branched from here",
        "\u2502",
        "\u2514\u2500\u2500 Session 1.1  (child session)",
        "    \u251C\u2500\u2500 Checkpoint 1  \u2014  Apr 1   (copy of Session 1 / Checkpoint 3)",
        "    \u2514\u2500\u2500 Checkpoint 2  \u2014  Apr 3   \u2190 current",
      ].map(line => new Paragraph({
        spacing: { before: 20, after: 20 },
        indent: { left: 720 },
        children: [new TextRun({ text: line, size: 20, font: "Courier New", color: "444444" })]
      }))),

      spacer(),

      heading2("2.6  Technical Implementation"),
      bullet("Implemented using git under the hood \u2014 never exposed to the user"),
      bullet("Save checkpoint = git commit"),
      bullet("Restore checkpoint = git checkout"),
      bullet("Branch into child session = git branch + new commit on a separate repo/worktree"),
      bullet("Overwrite checkpoint = git reset + new commit"),
      bullet("If the session folder already has a git repo, the app uses it as-is"),
      bullet("If not, the app silently runs git init on first session link"),
      bullet("The developer continues coding in their own IDE \u2014 the app never interferes with their editor"),

      spacer(),

      // Section 3
      heading1("3. Tools Available Inside a Session"),
      body("Each session gives you access to the following tools as tabs:"),
      spacer(),

      heading2("3.1  Live Website Preview"),
      bullet("Embedded browser that shows your website in real time"),
      bullet("Updates automatically after each file save (like Vite HMR but built-in)"),
      bullet("For static/frontend projects: instant re-render on save"),
      bullet("For full-stack projects: proxies your local dev server with live reload injected"),
      bullet("Reacts to file toggle changes from the File Change Tracker in real time"),

      spacer(),

      heading2("3.2  API Tester (Postman-like)"),
      bullet("Create, save, and run HTTP requests (GET, POST, PUT, DELETE, etc.)"),
      bullet("Organized by session/project context \u2014 no manual URL setup, it knows your local server"),
      bullet("Running a request can trigger the live preview to auto-refresh"),
      bullet("Intercept network requests triggered by clicking elements in the live preview and surface them automatically in the API tester panel"),

      spacer(),

      heading2("3.3  Database Manager"),
      bullet("Spin up databases with one click using Docker under the hood (MongoDB, PostgreSQL, MySQL, Redis, etc.)"),
      bullet("Built-in GUI to browse, query, and edit data \u2014 like TablePlus but embedded"),
      bullet("DB panel reacts in real time when an API request inserts, modifies, or deletes a record"),
      bullet("Supports connecting to existing local or remote databases as well"),

      spacer(),

      heading2("3.4  Docker Manager"),
      bullet("Control Docker containers directly from the app using the Docker Engine API"),
      bullet("Start, stop, and restart containers per session"),
      bullet("View logs, resource usage, and port mappings"),
      bullet("Session maps to a docker-compose.yml under the hood \u2014 stack is fully reproducible"),

      spacer(),

      heading2("3.5  File Change Tracker"),
      body("Tracks all files modified since the last checkpoint and lets the developer toggle individual files on and off to compare the live preview with and without specific changes."),
      spacer(),

      new Paragraph({
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "Core behavior", bold: true, size: 22, font: "Arial" })]
      }),
      bullet("Only displays files that have changed since the last checkpoint \u2014 unchanged files are not listed"),
      bullet("Each changed file has a checkbox in the UI"),
      bullet("Checking a file \u2014 the live version (current local state) is used in the preview"),
      bullet("Unchecking a file \u2014 the version from the previous checkpoint is used in the preview instead, without modifying the file on disk"),
      bullet("The live preview updates instantly when files are toggled"),

      spacer(),

      new Paragraph({
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "What \u201Coriginal version\u201D means", bold: true, size: 22, font: "Arial" })]
      }),
      body("The original version of a file is always the version from the previous checkpoint in the chain \u2014 never an arbitrary past state. Each checkpoint knows its parent, so the tracker always has a concrete and predictable reference point."),
      spacer(),
      bullet("Uncheck a file in Session 1.1 Checkpoint 2 \u2192 uses that file from Session 1.1 Checkpoint 1"),
      bullet("Uncheck a file in Session 1.1 Checkpoint 1 \u2192 uses that file from Session 1 Checkpoint 3 (the branch point)"),
      bullet("If the file is identical between two checkpoints \u2014 it does not appear in the tracker at all"),
      bullet("If no checkpoint exists yet \u2014 the original is the initial state of the files when the session was first created"),

      spacer(),

      new Paragraph({
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: "File tracker does not save \u2014 checkpoints do", bold: true, size: 22, font: "Arial" })]
      }),
      body("The file tracker is purely a visual comparison and preview tool. It does not save anything. Saving is always done via checkpoints, which are a separate and independent feature."),

      spacer(),

      // Section 4
      heading1("4. UI Layout & Window Management"),
      bullet("Default view: tools are organized as tabs within the session workspace"),
      bullet("Split-screen mode: user can manually split the workspace to view two tools side by side"),
      bullet("Detached windows: drag any tab out to open it in a separate app window"),
      bullet("Ideal for multi-monitor setups (e.g., live preview on monitor 1, API tester + DB on monitor 2)", 1),
      bullet("All detached windows share the same session state \u2014 they stay in sync in real time", 1),
      bullet("Closing a detached window returns the tool to the main session \u2014 no data lost", 1),
      bullet("Reconnects automatically if a window crashes", 1),

      spacer(),

      // Section 5
      heading1("5. Session State & Sync Rules"),
      bullet("Session state is the single source of truth \u2014 not the window"),
      bullet("All windows (main + detached) reflect the same live session"),
      bullet("Closing or crashing a window never affects the session or running containers"),
      bullet("Reopening a window reconnects to the existing session seamlessly"),

      spacer(),

      // Section 6
      heading1("6. Target Audience"),
      heading2("Primary Users"),
      bullet("Mid-level and senior developers who juggle multiple tools daily"),
      bullet("DevOps engineers managing infrastructure, APIs, and databases simultaneously"),
      bullet("Freelancers and indie hackers who want one tool instead of six subscriptions"),
      bullet("Bootcamp graduates entering the workforce learning multiple tools at once"),

      spacer(),

      heading2("Less Targeted"),
      bullet("Beginners and students (may find learning individual tools separately easier first)"),
      bullet("Enterprise teams with already standardized internal tooling"),

      spacer(),

      // Section 7
      heading1("7. What Makes It Different"),
      bullet("No existing tool combines Docker, database management, API testing, and live preview in one session-aware workspace"),
      bullet("The checkpoint system gives developers a simple, visual way to navigate project history \u2014 no git knowledge required"),
      bullet("The session/child session model mirrors how real projects are structured (one project, multiple independent components)"),
      bullet("File tracker uses the checkpoint chain as the reference point \u2014 \u201Coriginal\u201D always means the last saved state, never an ambiguous past"),
      bullet("The DB panel reacting to API requests in real time is unique to this app"),
      bullet("Multi-window support with shared session state enables true multi-monitor developer workflows"),

      spacer(),

      // Section 8 - Future Features
      heading1("8. Future Features"),
      body("The following features have been identified as potentially valuable but are deferred until a working prototype exists. They should be evaluated for relevance and complexity before implementation."),

      spacer(),

      heading2("8.1  Cross-Checkpoint File Borrowing"),
      badge("OPTIONAL \u2014 evaluate after prototype"),
      spacer(),
      body("Within any session, the developer can replace a specific file in their current working folder with the version of that same file from any other checkpoint \u2014 across any session in the project."),
      spacer(),
      bullet("Available as a right-click option on any file in the File Change Tracker panel"),
      bullet("A dropdown shows all available versions of that file across all checkpoints and sessions"),
      bullet("Selecting a version replaces the file in the live local folder (not in any saved checkpoint)"),
      bullet("The file then appears as modified in the tracker since it now differs from the last checkpoint"),
      bullet("If the developer is happy with the borrowed version, they include it in their next checkpoint save"),
      spacer(),
      body("File list indicator: when a file is using a borrowed version, the tracker shows its origin beside it:"),
      spacer(),
      mono("utils.js        \u2190 modified  (borrowed from Session 1 / Checkpoint 3)"),
      mono("index.css       \u2190 modified"),
      mono("config.json     \u2713 unchanged"),
      spacer(),
      note("Saved checkpoints are never modified by this feature \u2014 only the current working folder is affected. This preserves the integrity of checkpoint history."),

      spacer(),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("D:/projects/devopsApp/DevOps App - Feature Overview.docx", buffer);
  console.log("Done!");
}).catch(err => console.error(err));
