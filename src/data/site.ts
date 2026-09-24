// ─────────────────────────────────────────────────────────────
//  EDIT THIS FILE to change phone, email, services and projects.
//  Everything on the website reads from here.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: "NS Infra",
  tagline: "Civil Engineering & Architecture",
  description:
    "NS Infra is a civil engineering and architecture firm delivering structural design, architectural planning, construction management and infrastructure projects.",
  phone: "+91 00000 00000", // TODO: your phone
  whatsapp: "910000000000", // TODO: country code + number, no + or spaces
  email: "info@nsinfra.com", // TODO: your email
  address: "Your office address, City, State, India", // TODO
  hours: "Mon – Sat, 9:30 AM – 6:30 PM",
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
];

export const services = [
  {
    icon: "🏗️",
    title: "Structural Design",
    text: "RCC and steel structural analysis, design and detailing for residential, commercial and industrial buildings.",
  },
  {
    icon: "📐",
    title: "Architectural Planning",
    text: "Concept design, floor plans, elevations, 3D visualisation and working drawings that balance beauty and function.",
  },
  {
    icon: "🏢",
    title: "Construction Management",
    text: "Site supervision, quality control, scheduling and cost control from foundation to handover.",
  },
  {
    icon: "🛣️",
    title: "Infrastructure & Roads",
    text: "Roads, drainage, water supply and site development works planned and executed to standards.",
  },
  {
    icon: "📋",
    title: "Estimation & Costing",
    text: "Detailed BOQ, quantity take-off, rate analysis and tender documents you can rely on.",
  },
  {
    icon: "🔍",
    title: "Survey & Consultancy",
    text: "Topographic surveys, structural audits, retrofitting advice and project feasibility studies.",
  },
];

export const projects = [
  // TODO: replace these samples with your real projects
  { title: "Residential Villa", type: "Architecture + Structure", location: "City, State", year: "2025" },
  { title: "Commercial Complex", type: "Structural Design", location: "City, State", year: "2024" },
  { title: "Industrial Warehouse", type: "Steel Structure", location: "City, State", year: "2024" },
  { title: "Township Road Works", type: "Infrastructure", location: "City, State", year: "2023" },
  { title: "Apartment Building G+5", type: "Design + Construction", location: "City, State", year: "2023" },
  { title: "School Campus", type: "Architecture Planning", location: "City, State", year: "2022" },
];

export const stats = [
  { value: "10+", label: "Years of experience" },
  { value: "150+", label: "Projects delivered" },
  { value: "50+", label: "Happy clients" },
  { value: "100%", label: "Code compliant" },
];
