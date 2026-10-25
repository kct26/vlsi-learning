// Online assessments, one per company, shown in the Online Assessment tab.
// ready:false shows a "coming soon" card. To build one later, set ready:true and fill in the same fields as NVIDIA's.
//
// Each assessment: co (a company id from companies.js), title, platform, minutes (one timer for the whole test),
// negative (points lost per wrong multiple-choice answer when the candidate turns negative marking on), format (bullets
// shown before starting), and sections in order:
//   {kind:'mcq', title, n, pick:{oa, reported, core}} draws n theory problems for the company:
//       oa = from your own OA and its variants (tags o, v), reported = candidate reports (tag r),
//       core = the rest of the company's tagged topics; any shortfall is filled from core.
//   {kind:'code', title, n, ids:[...]} draws n coding problems from ids (judged ones are graded automatically).
const ASSESSMENTS = [
  {co:'nvidia', ready:true, title:'Ignite Hardware Engineering', platform:'HackerRank-style', minutes:75, negative:0.25,
    format:['One timer for the whole test, like HackerRank: once you start, it keeps running even if you leave the page.',
      '15 hardware questions (multiple choice and true/false): transistors, circuits, timing, power, FIFOs and the topics candidates report.',
      '2 easy coding problems in C or C++, like the linked-list and bit-manipulation problems reported for Ignite. They are graded by hidden tests.',
      'No feedback until you submit. Flag questions to come back to them.',
      'Some tracks use negative marking. Turn it on below to practice skipping questions you cannot narrow down.'],
    sections:[{kind:'mcq', title:'Hardware: multiple choice and true/false', n:15, pick:{oa:5, reported:4, core:6}},
      {kind:'code', title:'Coding', n:2, ids:['c-03', 'c-04', 'c-05', 'cpp-01', 'c-01', 'c-08']}]},
  {co:'amd', ready:false}, {co:'intel', ready:false}, {co:'apple', ready:false}, {co:'qualcomm', ready:false},
  {co:'google', ready:false}, {co:'amazon', ready:false}, {co:'arm', ready:false}, {co:'broadcom', ready:false},
  {co:'marvell', ready:false}, {co:'micron', ready:false}, {co:'ti', ready:false}, {co:'tesla', ready:false},
  {co:'synopsys', ready:false}, {co:'cadence', ready:false},
];
