window.LFP_DATA = {
  questionnaire: [
    {
      id: "doc_type",
      question: "What type of legal document do you need?",
      type: "radio",
      name: "doc_type",
      options: [
        { value: "nda", title: "NDA / confidentiality", hint: "Protect sensitive information shared with another party." },
        { value: "contract", title: "Service or employment contract", hint: "Define terms, deliverables, and obligations." },
        { value: "will", title: "Estate planning (will / trust draft)", hint: "Plan asset distribution and guardianship." },
        { value: "other", title: "Something else", hint: "We will follow up with custom scope." },
      ],
    },
    {
      id: "jurisdiction",
      question: "Which jurisdiction applies?",
      type: "select",
      name: "jurisdiction",
      placeholder: "Select state or region",
      options: [
        { value: "", label: "Choose one…" },
        { value: "ca", label: "California" },
        { value: "ny", label: "New York" },
        { value: "tx", label: "Texas" },
        { value: "fl", label: "Florida" },
        { value: "other", label: "Other / not sure" },
      ],
    },
    {
      id: "urgency",
      question: "How soon do you need the first draft?",
      type: "radio",
      name: "urgency",
      options: [
        { value: "standard", title: "Standard (5–7 business days)", hint: "Best value for most matters." },
        { value: "expedited", title: "Expedited (48–72 hours)", hint: "Priority queue and faster turnaround." },
      ],
    },
    {
      id: "brief",
      question: "Briefly describe your situation or goals",
      type: "textarea",
      name: "brief",
      placeholder: "Example: Two companies sharing product roadmaps before a pilot. Need mutual NDA with CA law.",
    },
  ],

  pricing: {
    base: 299,
    docTypeMultiplier: { nda: 1, contract: 1.35, will: 1.6, other: 1.2 },
    urgencyMultiplier: { standard: 1, expedited: 1.45 },
    jurisdictionLabel: {
      ca: "California",
      ny: "New York",
      tx: "Texas",
      fl: "Florida",
      other: "Other / TBD",
      "": "Not specified",
    },
    docLabel: {
      nda: "NDA / confidentiality",
      contract: "Service or employment contract",
      will: "Estate planning",
      other: "Custom matter",
    },
  },

  chat: {
    welcome:
      "Hi — I'm a demo assistant for LexFlow. Ask about timelines, pricing, or what happens after you pay. I don't provide legal advice.",
    typingMs: { min: 550, max: 1200 },
    replies: [
      { keys: ["price", "cost", "fee", "pay", "payment", "how much"], text: "Pricing in this demo is calculated from your intake (document type and speed). After you complete the questionnaire, open Pay to see a live total. Real quotes would come from an attorney or your product rules." },
      { keys: ["nda", "confidential"], text: "NDAs typically cover definition of confidential information, permitted use, term, and remedies. Your answers in intake help scope the first draft—this assistant can't review your specific facts in the MVP." },
      { keys: ["time", "timeline", "how long", "when"], text: "You chose standard or expedited in intake. Standard is modeled as 5–7 business days; expedited as 48–72 hours. Actual schedules depend on counsel workflow when you connect a backend." },
      { keys: ["after", "next", "what happens", "process"], text: "After payment (demo), you'd normally receive a confirmation, drafter assignment, and secure upload link. Here we only show a success screen—no email is sent." },
      { keys: ["lawyer", "attorney", "legal advice"], text: "LexFlow MVP is a product demo, not a law firm. For real matters, speak with a qualified attorney licensed in your jurisdiction." },
      { keys: ["help", "hello", "hi", "start"], text: "Try completing the intake on the Home page, then use Pay to simulate checkout. You can paste questions about timelines or pricing here—I respond from scripted demo logic." },
    ],
    fallback: [
      "Thanks for the detail. In the full product, this would route to retrieval or your matter team. For the MVP, refine your question or mention pricing, timelines, NDAs, or next steps.",
      "Got it. I can speak to how this demo behaves: intake feeds the order summary and suggested fee. Specific legal interpretation still requires a professional.",
    ],
  },
};
