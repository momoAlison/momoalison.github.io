// Work history data, shown inline on the About page. Facts only — nothing
// here is invented. Where the source material gave no project name for an
// entry, that optional field is simply omitted.

export interface WorkExperience {
  id: string;
  org: string;
  role: string;
  /** Named project, shown as "Project — description." when present. */
  project?: string;
  /** Year-level label shown in the timeline gutter. */
  yearLabel: string;
  /** One or two sentences — the whole story for this entry, not a CV bullet list. */
  description: string;
}

export const experience: WorkExperience[] = [
  {
    id: 'chalmers-research-assistant',
    org: 'Chalmers University of Technology',
    role: 'Research Assistant',
    project: 'RD&T Template Generator',
    yearLabel: '2026',
    description: '0-to-1 industrial AI workflow turning heterogeneous engineering data into structured RD&T models and validated Excel output.',
  },
  {
    id: 'chalmers-masters-thesis',
    org: 'Chalmers University of Technology',
    role: "Master's Thesis",
    project: 'LLM-based Natural Language Interface for IPS IMMA',
    yearLabel: '2026',
    description: 'Built a constrained agent workflow for industrial simulation commands with validation, spatial grounding, and human-in-the-loop approval — in collaboration with FCC, IPS AB, and AB Volvo.',
  },
  {
    id: 'givaudan-intern',
    org: 'Givaudan',
    role: 'AI & Software Engineer Intern',
    yearLabel: '2025',
    description: 'Production-data modeling and an internally deployed self-service analytics dashboard.',
  },
  {
    id: 'givaudan-innovation',
    org: 'Givaudan',
    role: 'Software Engineer, Innovation Team',
    yearLabel: '2024',
    description: 'Built frontend for an internal generative-AI slide product and other innovation prototypes.',
  },
  {
    id: 'microfocus-opentext',
    org: 'Micro Focus / OpenText',
    role: 'Specialist Engineer',
    yearLabel: '2021 – 2023',
    description: 'Modernized enterprise frontend architecture from AngularJS to modern Angular and led feature delivery as Feature Owner.',
  },
  {
    id: 'ebizserve',
    org: 'eBizServe Technology Limited',
    role: 'Front-end Developer',
    yearLabel: '2019 – 2021',
    description: 'Angular migration, shared proto-generated contracts, and frontend/backend integration in a microservices environment.',
  },
  {
    id: 'changjiang-times',
    org: 'Changjiang Times Communication Co., Ltd.',
    role: 'Front-end Developer',
    yearLabel: '2018 – 2019',
    description: 'Frontend architecture, reusable components, and D3.js relationship visualizations.',
  },
];
