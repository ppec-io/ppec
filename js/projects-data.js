/* ==========================================================================
   PROPERTIES & PROJECTS — edit this file to update the showcase.
   Used by the Properties & Projects page and the Featured section on the Home page.

   HOW TO UPDATE
   1. Put your photo in  assets/images/projects/  (JPG, ~1200px wide, under 300 KB).
   2. Edit an entry below, or copy one and paste it to add a new property/project.
   3. Set  placeholder: false  once the entry holds real, verified information
      (this removes the "Sample" badge and the notice on the page).

   FIELDS
   id          unique short name, no spaces (used in enquiry links)
   category    "available" | "ongoing" | "completed"
   title       property / project name
   location    town or area, e.g. "East Legon, Accra"
   description one or two sentences
   statusNote  optional extra status line (e.g. expected completion) — use "" for none
   image       path to the photo
   imageAlt    short description of the photo (for accessibility)
   featured    true = also shown in "Featured" on the Home page (use 3 for the best layout)
   placeholder true = sample content that must be replaced before publishing
   ========================================================================== */
window.PROJECTS = [
  /* ---------------- Available properties ---------------- */
  {
    id: "available-1",
    category: "available",
    title: "Sample Residence 01",
    location: "[Town / Area], Ghana",
    description: "Add a short description of this property here.",
    statusNote: "",
    image: "assets/images/projects/placeholder-villa.jpg",
    imageAlt: "Placeholder photograph of a modern residence",
    featured: true,
    placeholder: true
  },
  {
    id: "available-2",
    category: "available",
    title: "Sample Residence 02",
    location: "[Town / Area], Ghana",
    description: "Add a short description of this property here.",
    statusNote: "",
    image: "assets/images/projects/placeholder-terrace.jpg",
    imageAlt: "Placeholder photograph of a terrace and living area",
    featured: false,
    placeholder: true
  },

  /* ---------------- Ongoing projects ---------------- */
  {
    id: "ongoing-1",
    category: "ongoing",
    title: "Sample Development 01",
    location: "[Town / Area], Ghana",
    description: "Add a short description of this project here.",
    statusNote: "[Add progress or expected completion]",
    image: "assets/images/projects/placeholder-commercial.jpg",
    imageAlt: "Placeholder photograph of a modern building",
    featured: true,
    placeholder: true
  },
  {
    id: "ongoing-2",
    category: "ongoing",
    title: "Sample Development 02",
    location: "[Town / Area], Ghana",
    description: "Add a short description of this project here.",
    statusNote: "[Add progress or expected completion]",
    image: "assets/images/projects/placeholder-house.jpg",
    imageAlt: "Placeholder photograph of a house with a pool",
    featured: false,
    placeholder: true
  },

  /* ---------------- Completed projects ---------------- */
  {
    id: "completed-1",
    category: "completed",
    title: "Sample Completed Project 01",
    location: "[Town / Area], Ghana",
    description: "Add a short description of this completed project here.",
    statusNote: "",
    image: "assets/images/projects/placeholder-estate.jpg",
    imageAlt: "Placeholder aerial photograph of a residential estate",
    featured: true,
    placeholder: true
  },
  {
    id: "completed-2",
    category: "completed",
    title: "Sample Completed Project 02",
    location: "[Town / Area], Ghana",
    description: "Add a short description of this completed project here.",
    statusNote: "",
    image: "assets/images/projects/placeholder-interior.jpg",
    imageAlt: "Placeholder photograph of a kitchen interior",
    featured: false,
    placeholder: true
  }
];
