export interface ServiceItem {
  id: string;
  title: string;
  desc: string;
  price: string;
  iconName: string;
  fullDetails: string;
  features: string[];
  standards: string[];
  deliverables: string[];
}

export const servicesData: ServiceItem[] = [
  {
    id: "structural-design",
    title: "Structural Design",
    price: "Price on request",
    desc: "High-grade structural detailing and frame analysis using state-of-the-art computer automation.",
    iconName: "Cpu",
    fullDetails: "Our structural design services cover comprehensive analysis and detailing of reinforced concrete (RCC), pre-engineered buildings (PEB), and heavy steel structures. We perform static and dynamic finite element modeling (FEM) to optimize structural member sizing while ensuring complete safety and compliance under seismic, wind, and dead load combinations. Our designs reduce material utilization by up to 15% without compromising structural integrity.",
    features: [
      "High-rise RCC framing & column layout design",
      "PEB portal frames and industrial warehouse truss systems",
      "Dynamic vibration, earthquake forces, and fatigue analysis",
      "Foundation system optimization (raft, pile, and isolated footings)"
    ],
    standards: [
      "IS 456:2000 (Plain and Reinforced Concrete)",
      "IS 1893:2016 (Earthquake Resistant Design of Structures)",
      "IS 800:2007 (General Steel Construction)",
      "Design Softwares: STAAD.Pro, ETABS, SAFE, AutoCAD"
    ],
    deliverables: [
      "STAAD.Pro/ETABS structural analysis reports",
      "Good For Construction (GFC) framing and schedule drawings",
      "Detailed Bar Bending Schedules (BBS)",
      "Structural stability and compliance certifications"
    ]
  },
  {
    id: "boq-estimation",
    title: "BOQ Estimation",
    price: "Price on request",
    desc: "Detailed Material bills and cost projections computed automatically with IS-code standard accuracies.",
    iconName: "FileText",
    fullDetails: "Prepare highly precise pre-bid and post-bid construction cost estimations and detailed Bill of Quantities (BOQ) sheets conforming to CPWD DSR norms. We audit drawing blueprints, count material configurations, and execute cost projections for civil structure, plumbing, electrical, carpentry, and finishing works, giving you an accurate roadmap before excavation begins.",
    features: [
      "Pre-bid material estimation schedules",
      "Itemized structural material takeoffs",
      "Contractor quotation audits",
      "CPWD DSR rate analysis and local market cost adjustments"
    ],
    standards: [
      "IS 1200 (Method of measurement of building works)",
      "CPWD Delhi Schedule of Rates (DSR) 2023",
      "Standard State Schedule of Rates (SSR) and local rate analysis"
    ],
    deliverables: [
      "Itemized BOQ spreadsheets (Excel/PDF formats)",
      "Detailed rate analysis and breakdown reports",
      "Material procurement planners",
      "Cost variance and contingency audit reports"
    ]
  },
  {
    id: "quantity-surveying",
    title: "Quantity Surveying",
    price: "Price on request",
    desc: "Professional pre-construction quantity audits, concrete takeoffs, and rebar scheduling.",
    iconName: "Briefcase",
    fullDetails: "Our quantity surveying team handles material cost auditing and structural takeoff calculations. We calculate the exact raw materials required for structural casting, steel reinforcement layouts, and brick masonry walls, using industry-standard volumetric swell and shrinkage coefficients to ensure minimal procurement waste and strict expense monitoring.",
    features: [
      "RCC volumetric quantity schedules and grade takeoffs",
      "Steel reinforcing takeoff (BBS) and tonnage indexing",
      "Masonry and mortar calculation sheets",
      "Onsite material wastage auditing and quality checks"
    ],
    standards: [
      "IS 1200 (Measurement guidelines for building works)",
      "IS 456:2000 (Concrete mix proportions & batch density limits)",
      "Standard wastage thresholds (5% - 10%) depending on project tier"
    ],
    deliverables: [
      "Raw material schedules (Cement bags, Sand volume, Aggregates)",
      "Detailed Bar Bending Schedules (BBS) for rebar procurement",
      "Wastage mitigation and tracking reports",
      "Monthly progress and billing audits"
    ]
  },
  {
    id: "pdf-to-autocad",
    title: "PDF to AutoCAD",
    price: "Price on request",
    desc: "Seamless vectorization of blueprint drawings to fully editable DWG/DXF files.",
    iconName: "FileText",
    fullDetails: "Convert paper drawings, PDFs, and scanned blueprints into highly precise, fully editable vector formats (DWG, DXF). We manually trace and vectorize drawings to ensure exact dimensions, clean layer organization, proper text formatting, and clean geometric shapes ready for client review and structural modifications.",
    features: [
      "PDF blueprint vectorization and dimension correction",
      "Scan to clean CAD dwg format conversions",
      "Legacy blueprint reconstruction and detailing",
      "Multi-layered CAD file organizing and layout scaling"
    ],
    standards: [
      "AutoCAD standard layers and colors guidelines",
      "Standard architectural and structural scaling standards",
      "Geometric dimensioning & tolerancing (GD&T) guidelines"
    ],
    deliverables: [
      "Fully editable DWG/DXF vector files",
      "High-resolution vectorized PDF layouts",
      "Scaled PDF blueprints",
      "Layer organization logs & reference manuals"
    ]
  },
  {
    id: "bim-services",
    title: "BIM Services",
    price: "Price on request",
    desc: "Virtual design coordination and 3D modeling up to LOD 400 specification standards.",
    iconName: "Compass",
    fullDetails: "We construct highly coordinated 3D BIM models up to LOD 400 specifications. Our models integrate architectural layouts, structural designs, and MEP networks to detect and resolve spacing clashes before onsite mobilization, saving time and avoiding expensive rework during execution.",
    features: [
      "3D architectural & structural modeling (Revit)",
      "MEP clash detection & resolution audits",
      "Quantity takeoff extraction from BIM models",
      "Virtual walkthrough visualizations and 3D rendering"
    ],
    standards: [
      "LOD 400 Specification standards",
      "PAS 1192 BIM Framework regulations",
      "ISO 19650 (Information organization and management)"
    ],
    deliverables: [
      "Clash Detection Matrix reports",
      "Coordinated 3D BIM models (RVT/NWD formats)",
      "MEP shop drawings",
      "4D scheduling and construction simulation videos"
    ]
  },
  {
    id: "interior-design",
    title: "Interior Design",
    price: "Price on request",
    desc: "Ergonomic workspace designs, custom interior layouts, and wood-finish specifications.",
    iconName: "HomeIcon",
    fullDetails: "Transform your indoor spaces with ergonomic layouts, premium material selections, and custom woodwork detailing. We specialize in corporate workspaces, commercial showrooms, and luxury residential interiors, balancing space optimization with exceptional modern aesthetics and functional flow.",
    features: [
      "Corporate office layout planning and workplace design",
      "Luxury residential space configuration and moodboards",
      "Custom furniture detailing and carpentry drawings",
      "Material and finish board curation with detailed specifications"
    ],
    standards: [
      "National Building Code (NBC) spacing and safety regulations",
      "Ergonomic workspace standards and clearances",
      "Acoustic and lighting standard guidelines"
    ],
    deliverables: [
      "2D interior layout and furniture plans",
      "3D photo-realistic renders of key spaces",
      "Carpentry production and detailed section drawings",
      "Material schedule & BOQ cost listings"
    ]
  }
];
