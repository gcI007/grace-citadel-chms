var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var apiKey = process.env.GEMINI_API_KEY;
var ai = null;
if (apiKey) {
  ai = new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
var app = (0, import_express.default)();
app.use(import_express.default.json());
var PORT = 3e3;
var INITIAL_MEMBERS = [
  {
    id: "m-1",
    name: "Rev. Dr. Christopher Jenkins",
    email: "c.jenkins@gracechurch.org",
    phone: "+1 (555) 123-4567",
    birthday: "1978-08-22",
    student_status: false,
    first_timer: false,
    date_joined: "2025-01-10",
    address: "742 Evergreen Terrace, Springfield",
    notes: "Lead Pastor and Elder."
  },
  {
    id: "m-2",
    name: "Sarah Alabi",
    email: "sarah.alabi@university.edu",
    phone: "+1 (555) 987-6543",
    birthday: "2004-06-24",
    // Birthday coming up very soon! (Today is June 18)
    student_status: true,
    first_timer: false,
    date_joined: "2026-03-15",
    address: "102 College Hall, Campus East",
    notes: "Active in campus student ministry."
  },
  {
    id: "m-3",
    name: "John Doe",
    email: "john.doe@gmail.com",
    phone: "+1 (555) 444-2211",
    birthday: "1997-12-05",
    student_status: false,
    first_timer: true,
    // First timer!
    date_joined: "2026-06-12",
    address: "12 Meadow Lane, Apt 4B",
    notes: "Found us via Google Maps search. Interested in small groups."
  },
  {
    id: "m-4",
    name: "Chinedu Okafor",
    email: "chinedu.okafor@gmail.com",
    phone: "+234 803 123 4567",
    birthday: "1994-11-12",
    student_status: false,
    first_timer: false,
    date_joined: "2026-02-14",
    address: "Block B4, Lekki Phase 1, Lagos",
    notes: "Professional software designer. Willing to help with tech."
  },
  {
    id: "m-5",
    name: "David Miller",
    email: "d.miller@polytech.edu",
    phone: "+1 (555) 333-8888",
    birthday: "2005-06-19",
    // Tomorrow is his birthday!
    student_status: true,
    first_timer: false,
    date_joined: "2026-05-10",
    address: "404 Main Street, Riverside",
    notes: "Musician, interested in joining the worship choir."
  },
  {
    id: "m-6",
    name: "Amanda Smith",
    email: "amanda.smith@yahoo.com",
    phone: "+1 (555) 888-9999",
    birthday: "1991-03-10",
    student_status: false,
    first_timer: false,
    date_joined: "2025-05-20",
    address: "88 Pine Avenue, Hilltop",
    notes: "Regular family member. Volunteers in children Sunday school."
  },
  {
    id: "m-7",
    name: "Grace Taylor",
    email: "grace.taylor@outlook.com",
    phone: "+1 (555) 222-7777",
    birthday: "2003-09-30",
    student_status: true,
    first_timer: true,
    // First timer
    date_joined: "2026-06-17",
    address: "303 Student Res, Unit 12A",
    notes: "Invited by Sarah Alabi. Enjoys theological discussions."
  },
  {
    id: "m-8",
    name: "Mercy Johnson",
    email: "mercy.j@outlook.com",
    phone: "+234 812 345 6789",
    birthday: "1989-07-04",
    student_status: false,
    first_timer: false,
    date_joined: "2026-01-20",
    address: "15 Adeniyi Jones, Ikeja",
    notes: "Recently relocated. Looking to settle down here."
  }
];
var INITIAL_SERVICES = [
  {
    id: "s-1",
    name: "Sunday Praise & Restoration",
    date: "2026-06-14",
    time: "09:00",
    theme: "Grace in Season"
  },
  {
    id: "s-2",
    name: "Midweek Word Encounter",
    date: "2026-06-17",
    time: "18:30",
    theme: "Lamps Lit and Alert"
  },
  {
    id: "s-3",
    name: "Upcoming Sunday Celebration",
    date: "2026-06-21",
    time: "09:00",
    theme: "The Power of Love"
  }
];
var INITIAL_ATTENDANCE = [
  // s-1 Sunday Praise
  { id: "a-1", member_id: "m-1", service_id: "s-1", status: "present", signed_in_at: "2026-06-14T08:45:00Z" },
  { id: "a-2", member_id: "m-2", service_id: "s-1", status: "present", signed_in_at: "2026-06-14T08:50:00Z" },
  { id: "a-3", member_id: "m-3", service_id: "s-1", status: "present", signed_in_at: "2026-06-14T08:58:00Z", notes: "First-timer guest" },
  { id: "a-4", member_id: "m-4", service_id: "s-1", status: "present", signed_in_at: "2026-06-14T08:52:00Z" },
  { id: "a-5", member_id: "m-5", service_id: "s-1", status: "absent", signed_in_at: "" },
  { id: "a-6", member_id: "m-6", service_id: "s-1", status: "absent", signed_in_at: "" },
  // Missed last Sunday
  { id: "a-7", member_id: "m-8", service_id: "s-1", status: "present", signed_in_at: "2026-06-14T08:55:00Z" },
  // s-2 Midweek Praise
  { id: "a-8", member_id: "m-1", service_id: "s-2", status: "present", signed_in_at: "2026-06-17T18:15:00Z" },
  { id: "a-9", member_id: "m-2", service_id: "s-2", status: "present", signed_in_at: "2026-06-17T18:20:00Z" },
  { id: "a-10", member_id: "m-5", service_id: "s-2", status: "present", signed_in_at: "2026-06-17T18:25:00Z" },
  { id: "a-11", member_id: "m-4", service_id: "s-2", status: "present", signed_in_at: "2026-06-17T18:18:00Z" },
  // 2nd attendance for Chinedu! (s-1 and s-2)
  { id: "a-12", member_id: "m-7", service_id: "s-2", status: "present", signed_in_at: "2026-06-17T18:28:00Z", notes: "Grace's first attendance" },
  { id: "a-13", member_id: "m-8", service_id: "s-2", status: "absent", signed_in_at: "" }
];
var INITIAL_COMMUNICATIONS = [
  {
    id: "c-1",
    member_id: "m-3",
    member_name: "John Doe",
    type: "sms",
    campaign_type: "welcome",
    message: "Hello John, welcome to Grace Church! We are overjoyed that you joined us for Sunday Praise on June 14th. Let us know if you have any questions!",
    status: "sent",
    sent_at: "2026-06-14T12:00:00Z"
  }
];
var database = {
  members: [...INITIAL_MEMBERS],
  services: [...INITIAL_SERVICES],
  attendance: [...INITIAL_ATTENDANCE],
  communications: [...INITIAL_COMMUNICATIONS]
};
app.get("/api/state", (req, res) => {
  res.json(database);
});
app.post("/api/reset", (req, res) => {
  database = {
    members: [...INITIAL_MEMBERS],
    services: [...INITIAL_SERVICES],
    attendance: [...INITIAL_ATTENDANCE],
    communications: [...INITIAL_COMMUNICATIONS]
  };
  res.json({ success: true, message: "Database state reset successfully.", state: database });
});
app.post("/api/members", (req, res) => {
  const { name, email, phone, birthday, student_status, first_timer, notes, address } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required fields." });
  }
  const newMember = {
    id: `m-${Date.now()}`,
    name,
    email,
    phone: phone || "",
    birthday: birthday || "",
    student_status: !!student_status,
    first_timer: first_timer !== void 0 ? !!first_timer : true,
    date_joined: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    address: address || "",
    notes: notes || ""
  };
  database.members.push(newMember);
  if (newMember.first_timer) {
    const welcomeSms = {
      id: `c-${Date.now()}-sms`,
      member_id: newMember.id,
      member_name: newMember.name,
      type: "sms",
      campaign_type: "welcome",
      message: `System [Twilio Auto]: Welcome ${newMember.name} to Grace Church Family! \u{1F31F} We're so blessed to have you connect with us. See you at our next service!`,
      status: "sent",
      sent_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const welcomeEmail = {
      id: `c-${Date.now()}-email`,
      member_id: newMember.id,
      member_name: newMember.name,
      type: "email",
      campaign_type: "welcome",
      message: `System [SendGrid Auto]: Hi ${newMember.name},

We wanted to officially welcome you to Grace Church. As a first-time visitor, we want to help you feel right at home. Come say hi after our upcoming service!

Warm regards,
Grace Care Team`,
      status: "sent",
      sent_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    database.communications.push(welcomeSms, welcomeEmail);
  }
  res.status(201).json({ success: true, member: newMember, state: database });
});
app.put("/api/members/:id", (req, res) => {
  const { id } = req.params;
  const index = database.members.findIndex((m) => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Member not found." });
  }
  const updated = {
    ...database.members[index],
    ...req.body
  };
  database.members[index] = updated;
  res.json({ success: true, member: updated, state: database });
});
app.delete("/api/members/:id", (req, res) => {
  const { id } = req.params;
  database.members = database.members.filter((m) => m.id !== id);
  database.attendance = database.attendance.filter((a) => a.member_id !== id);
  database.communications = database.communications.filter((c) => c.member_id !== id);
  res.json({ success: true, state: database });
});
app.post("/api/services", (req, res) => {
  const { name, date, time, theme } = req.body;
  if (!name || !date || !time) {
    return res.status(400).json({ error: "Name, date, and time are required." });
  }
  const newService = {
    id: `s-${Date.now()}`,
    name,
    date,
    time,
    theme: theme || ""
  };
  database.services.push(newService);
  database.members.forEach((m) => {
    database.attendance.push({
      id: `a-${Date.now()}-${m.id}`,
      member_id: m.id,
      service_id: newService.id,
      status: "absent",
      signed_in_at: ""
    });
  });
  res.status(201).json({ success: true, service: newService, state: database });
});
app.post("/api/attendance", (req, res) => {
  const { member_id, service_id, status, notes } = req.body;
  if (!member_id || !service_id || !status) {
    return res.status(400).json({ error: "member_id, service_id, and status are required." });
  }
  const existingIndex = database.attendance.findIndex(
    (a) => a.member_id === member_id && a.service_id === service_id
  );
  const signedInTime = status === "present" ? (/* @__PURE__ */ new Date()).toISOString() : "";
  if (existingIndex !== -1) {
    database.attendance[existingIndex] = {
      ...database.attendance[existingIndex],
      status,
      notes: notes !== void 0 ? notes : database.attendance[existingIndex].notes,
      signed_in_at: signedInTime
    };
  } else {
    database.attendance.push({
      id: `a-${Date.now()}`,
      member_id,
      service_id,
      status,
      notes: notes || "",
      signed_in_at: signedInTime
    });
  }
  res.json({ success: true, state: database });
});
app.post("/api/send-campaign", (req, res) => {
  const { member_ids, type, campaign_type, message } = req.body;
  if (!member_ids || !Array.isArray(member_ids) || !type || !campaign_type || !message) {
    return res.status(400).json({ error: "member_ids (array), type, campaign_type, and message are required." });
  }
  const sentLogs = [];
  member_ids.forEach((mId) => {
    const member = database.members.find((m) => m.id === mId);
    if (member) {
      const log = {
        id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        member_id: mId,
        member_name: member.name,
        type,
        campaign_type,
        message: message.replace(/{{name}}/g, member.name),
        status: "sent",
        sent_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      database.communications.push(log);
      sentLogs.push(log);
    }
  });
  res.json({ success: true, logs: sentLogs, state: database });
});
app.post("/api/generate-message", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: "Gemini API tool is currently unconfigured or has no active API Key. Please add the GEMINI_API_KEY inside Settings > Secrets."
    });
  }
  const { memberId, contextType } = req.body;
  if (!memberId || !contextType) {
    return res.status(400).json({ error: "memberId and contextType are required." });
  }
  const member = database.members.find((m) => m.id === memberId);
  if (!member) {
    return res.status(404).json({ error: "Member not found." });
  }
  const memberAttendance = database.attendance.filter((a) => a.member_id === memberId && a.status === "present");
  const attendanceCount = memberAttendance.length;
  let prompt = "";
  if (contextType === "welcome") {
    prompt = `Write a short, warm, and welcoming church welcome SMS message for a new first-time visitor.
    Name: ${member.name}
    Join Date: ${member.date_joined}
    Is Student: ${member.student_status ? "Yes" : "No"}
    Additional Notes: ${member.notes || "None"}
    
    Make it feel genuinely caring, modern, and exciting (e.g. including helpful emoji accents like \u2728 \u{1F64C} \u{1F31F}). Limit to 140 characters. DO NOT include placeholders or quotes.`;
  } else if (contextType === "missed") {
    prompt = `Write a gentle, warm caring church outreach email campaign message to a member who missed our recent worship services recently.
    Name: ${member.name}
    They have missed the latest service. Let them know we missed seeing them, hope they are doing well, and invite them back to worship next Sunday.
    Keep it light and pastoral, completely free of guilt or pressure.
    Subject line and body required. Format nicely with paragraph text. Limit to 120 words. No templates, fill-in-the-blank brackets, or generic sign-offs. Always sign off as 'Your Grace Church Care Team'`;
  } else if (contextType === "birthday") {
    prompt = `Write a joyful and uplifting birthday blessing greeting SMS for:
    Name: ${member.name}
    Birthday: ${member.birthday}
    Express absolute appreciation for them, wish them an amazing year filled with grace, peace, and love, and mention we're praying for them today.
    Keep it cheerful, vibrant, and energetic. Limit to 150 characters. No placeholders.`;
  } else {
    prompt = `Write a short pastoral update message for:
    Name: ${member.name}
    Total services attended: ${attendanceCount}
    Is Student: ${member.student_status ? "Yes" : "No"}
    Thanking them for being an active part of Grace Church. Keep to 160 characters.`;
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an encouraging, modern, empathetic Church Outreach and Pastoral Care coordinator writing highly customized personal messages. Do not use generic template brackets like [Insert Name] or placeholders."
      }
    });
    res.json({ success: true, message: response.text });
  } catch (err) {
    console.error("Gemini API generation error:", err);
    res.status(500).json({ error: `Internal Server Error generating message: ${err.message || err}` });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Church Management Server running on http://localhost:${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
