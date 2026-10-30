/* ==========================================================
   PROPERTIES & PROJECTS DATA — edit this file to update the
   Properties & Projects page and the Home page featured list.

   Every entry below is a PLACEHOLDER. Nothing here is a real
   listing, price or completion status. Replace each one, or
   delete it, before publication.

   Fields
     id          unique slug, lowercase, no spaces
     category    "available" | "ongoing" | "completed"
     name        project / property name
     location    town / area
     status      short status label shown on the card
     description 1-2 sentences
     image       path under assets/images/projects/
     placeholder true shows a "Placeholder" tag; set false once
                 the entry and photo are real
     featured    true shows it on the Home page (max 3 used)
   ========================================================== */
window.PROPERTIES = [
  {
    id: "available-1",
    category: "available",
    name: "Property Name (Placeholder)",
    location: "Location to be confirmed",
    status: "Availability to be confirmed",
    description: "Add a short description of the property here: type, setting and key features once verified.",
    image: "assets/images/projects/residential.jpg",
    placeholder: true,
    featured: true
  },
  {
    id: "available-2",
    category: "available",
    name: "Property Name (Placeholder)",
    location: "Location to be confirmed",
    status: "Availability to be confirmed",
    description: "Add a short description of the property here: type, setting and key features once verified.",
    image: "assets/images/projects/villa-pool.jpg",
    placeholder: true,
    featured: false
  },
  {
    id: "available-3",
    category: "available",
    name: "Land / Plots (Placeholder)",
    location: "Location to be confirmed",
    status: "Availability to be confirmed",
    description: "Add a short description of the plots here: size, location and title details once verified.",
    image: "assets/images/projects/plots.jpg",
    placeholder: true,
    featured: false
  },
  {
    id: "ongoing-1",
    category: "ongoing",
    name: "Project Name (Placeholder)",
    location: "Location to be confirmed",
    status: "Progress to be confirmed",
    description: "Describe the development: what is being built, for whom, and the current stage once verified.",
    image: "assets/images/projects/construction.jpg",
    placeholder: true,
    featured: true
  },
  {
    id: "ongoing-2",
    category: "ongoing",
    name: "Project Name (Placeholder)",
    location: "Location to be confirmed",
    status: "Progress to be confirmed",
    description: "Describe the development: what is being built, for whom, and the current stage once verified.",
    image: "assets/images/projects/development-site.jpg",
    placeholder: true,
    featured: false
  },
  {
    id: "completed-1",
    category: "completed",
    name: "Completed Project (Placeholder)",
    location: "Location to be confirmed",
    status: "Completion details to be confirmed",
    description: "Describe the finished project and what was delivered, once verified.",
    image: "assets/images/projects/completed-block.jpg",
    placeholder: true,
    featured: true
  },
  {
    id: "completed-2",
    category: "completed",
    name: "Completed Project (Placeholder)",
    location: "Location to be confirmed",
    status: "Completion details to be confirmed",
    description: "Describe the finished project and what was delivered, once verified.",
    image: "assets/images/projects/apartments.jpg",
    placeholder: true,
    featured: false
  }
];

window.PROPERTY_CATEGORIES = [
  { key: "available", title: "Available Properties", intro: "Properties currently offered by the company." },
  { key: "ongoing",   title: "Ongoing Projects",     intro: "Developments and construction works in progress." },
  { key: "completed", title: "Completed Projects",   intro: "Projects delivered to our clients." }
];
