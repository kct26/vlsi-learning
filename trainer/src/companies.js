// Company tags, like LeetCode's company lists. Every theory and coding problem can carry company tags.
//
// Each company: id, short (2–3 letters for its badge), name, label (optional shorter name for tags), focus, then its tags.
//
// How a problem gets a company's tag (any one is enough):
//   chapters: theory problems from these book chapters (most central first; the order ranks the tags shown on a problem)
//   areas:    coding problems in these Coding areas
//   tags:     theory problems carrying these source tags from questions.js (o = your OA, v = OA variant, r = reported)
//   ids:      exact problems, theory ('14-03') or coding ('rtl-07'). Use this for questions reported for one company.
//
// To add questions for a company: write them in questions.js or coding.js as usual, then list their ids under that
// company's `ids` (and `reported` if they came from that company's interviews or assessments). To add a company,
// copy an entry. The build checks that every id exists.
//
// Tags from chapters and areas mean "this topic is core to the company's hardware roles" (from public job postings
// and widely reported interview topics). Only `reported` ids and the `tags` sources claim a question was actually seen.
const COMPANIES = [
  {id:'nvidia', short:'NV', name:'NVIDIA', focus:'GPUs, AI systems and networking',
    chapters:[21, 19, 20, 22, 11, 14, 8, 10, 9, 13], areas:['RTL design', 'Verification', 'GPU and CUDA', 'C and C++', 'Physical design'],
    tags:'ovr', ids:['c-03', 'c-04', 'c-05', 'cpp-01', 'rtl-07'], reported:['c-03', 'c-04', 'c-05', 'cpp-01', 'rtl-07'],
    note:'Includes every question from your Ignite OA, their variants, and topics other candidates reported.'},
  {id:'amd', short:'AMD', name:'AMD', focus:'CPUs, GPUs and adaptive SoCs',
    chapters:[20, 11, 19, 10, 14, 13, 21], areas:['RTL design', 'Verification', 'Physical design'], ids:[]},
  {id:'intel', short:'IN', name:'Intel', focus:'CPUs, foundry and process technology',
    chapters:[17, 4, 5, 15, 11, 20], areas:['RTL design', 'Verification', 'Physical design'], ids:[]},
  {id:'apple', short:'AP', name:'Apple', focus:'Custom SoCs for phones and Macs',
    chapters:[14, 18, 11, 19, 20, 6, 15], areas:['RTL design', 'Verification', 'C and C++'], ids:[]},
  {id:'qualcomm', short:'QC', name:'Qualcomm', focus:'Mobile SoCs, modems and DSPs',
    chapters:[22, 14, 9, 19, 7, 16], areas:['RTL design', 'Verification', 'Python and MATLAB'], ids:[]},
  {id:'google', short:'GO', name:'Google', focus:'TPUs and data-center silicon',
    chapters:[21, 22, 20, 19], areas:['RTL design', 'Verification', 'C and C++', 'Python and MATLAB'], ids:[]},
  {id:'amazon', short:'AZ', name:'Amazon (Annapurna Labs)', label:'Amazon', focus:'Graviton CPUs, Trainium and Inferentia',
    chapters:[20, 21, 19, 22], areas:['RTL design', 'Verification', 'Linux and scripting'], ids:[]},
  {id:'arm', short:'ARM', name:'Arm', focus:'CPU and GPU IP',
    chapters:[20, 12, 10, 9, 22], areas:['RTL design', 'Verification', 'C and C++'], ids:[]},
  {id:'broadcom', short:'BR', name:'Broadcom', focus:'Networking, SerDes and custom ASICs',
    chapters:[16, 6, 2, 11, 17], areas:['RTL design', 'Physical design'], ids:[]},
  {id:'marvell', short:'MV', name:'Marvell', focus:'Data-infrastructure and storage silicon',
    chapters:[16, 18, 19, 11], areas:['RTL design', 'Verification'], ids:[]},
  {id:'micron', short:'MU', name:'Micron', focus:'DRAM, NAND and memory systems',
    chapters:[18, 17, 4, 15], areas:['Python and MATLAB', 'Linux and scripting'], ids:[]},
  {id:'ti', short:'TI', name:'Texas Instruments', label:'TI', focus:'Analog, power and embedded processors',
    chapters:[6, 5, 1, 2, 3, 14], areas:['C and C++'], ids:[]},
  {id:'tesla', short:'TS', name:'Tesla', focus:'Vehicle AI chips and power electronics',
    chapters:[21, 14, 3, 1], areas:['C and C++', 'RTL design'], ids:[]},
  {id:'synopsys', short:'SN', name:'Synopsys', focus:'EDA tools: synthesis, timing and verification',
    chapters:[11, 13, 17, 23], areas:['Physical design', 'Linux and scripting', 'C and C++'], ids:[]},
  {id:'cadence', short:'CD', name:'Cadence', focus:'EDA tools: implementation and simulation',
    chapters:[13, 11, 16, 19, 23], areas:['Physical design', 'Verification', 'Linux and scripting'], ids:[]},
];
