import { Building2, Boxes, Cable, Factory, FileText, Gauge, HardHat, Layers3, Map, Network, Route, Ruler, ShieldCheck, Sparkles, Waves } from "lucide-react";

export const expertiseGroups = [
  {
    title: "Engineering & Design",
    eyebrow: "Technical core",
    description: "Engineering-led design and documentation for projects that need clear decisions, coordinated drawings and practical deliverables.",
    items: ["Structural Design", "BOQ & Estimation", "Quantity Surveying", "CAD / Drawing Services", "BIM Coordination"],
    icon: Ruler,
  },
  {
    title: "Project Delivery",
    eyebrow: "From design to site",
    description: "Support across planning, coordination, documentation and construction-stage reviews, with the project context kept visible.",
    items: ["Project Planning", "Technical Coordination", "Construction Support", "Quality Reviews", "Handover Documentation"],
    icon: HardHat,
  },
  {
    title: "Digital Engineering",
    eyebrow: "Modern delivery",
    description: "Use BIM, CAD, data and structured digital workflows where they materially improve coordination, quantity control or project decisions.",
    items: ["BIM / 3D Coordination", "Digital Drawings", "Quantity Workflows", "Engineering Tools", "Project Information"],
    icon: Network,
  },
  {
    title: "Technical Advisory",
    eyebrow: "Better decisions",
    description: "Translate complex engineering questions into a practical scope, review path and set of deliverables before work begins.",
    items: ["Drawing Review", "Scope Definition", "Technical Due Diligence", "Feasibility Support", "Engineering Guidance"],
    icon: ShieldCheck,
  },
] as const;

export const sectors = [
  { title: "Buildings & Developments", description: "Residential, commercial and mixed-use built environments.", icon: Building2 },
  { title: "Industrial & PEB", description: "Industrial buildings, steel systems and coordinated technical documentation.", icon: Factory },
  { title: "Infrastructure", description: "Civil infrastructure planning, documentation and project support.", icon: Route },
  { title: "Structures", description: "Structural analysis, detailing, reviews and engineering documentation.", icon: Boxes },
  { title: "Water & Utilities", description: "Water, drainage and utility-related engineering support where applicable.", icon: Waves },
  { title: "Digital Built Environment", description: "BIM, CAD, GIS and structured project information workflows.", icon: Map },
] as const;

export const lifecycle = [
  { step: "01", title: "Discover", description: "Understand the site, project objective, constraints and available information.", icon: Sparkles },
  { step: "02", title: "Assess", description: "Review drawings, requirements, risks, quantities and technical gaps before committing to scope.", icon: Gauge },
  { step: "03", title: "Design", description: "Develop the engineering solution and the drawings, calculations or models required for the next decision.", icon: Ruler },
  { step: "04", title: "Coordinate", description: "Resolve interfaces between disciplines, documents, quantities and delivery stakeholders.", icon: Network },
  { step: "05", title: "Deliver", description: "Issue clear, organized deliverables with review points and project-stage context.", icon: FileText },
  { step: "06", title: "Handover", description: "Close the documentation loop with final records, revisions and practical next-step guidance.", icon: Layers3 },
] as const;

export const digitalCapabilities = [
  { title: "BIM & 3D Coordination", description: "Model-based coordination to make design intent easier to review and communicate.", icon: Boxes },
  { title: "CAD & Drawing Systems", description: "Structured drawing production, conversion, detailing and documentation workflows.", icon: Ruler },
  { title: "Quantity Intelligence", description: "Digital takeoffs and structured quantity information for estimating and procurement workflows.", icon: Gauge },
  { title: "GIS & Site Information", description: "Location-aware project information for planning and infrastructure decisions where applicable.", icon: Map },
  { title: "Project Data", description: "Clear information structures that make revisions, deliverables and project status easier to manage.", icon: Network },
  { title: "Technical Tools", description: "Practical calculators and decision-support tools that make engineering information easier to use.", icon: Cable },
] as const;
