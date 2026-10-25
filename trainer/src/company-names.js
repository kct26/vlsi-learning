// Public company list: names, badges and focus lines, shown to everyone (the Premium page, logos, the home page).
// Which problems belong to each company, and the online assessment formats, are Premium and are NOT in this
// public file: they live in trainer/private/premium-data.js (kept out of git) and in Firestore (premium_content/main).
const COMPANY_NAMES = [
  {id:'nvidia',short:'NV',name:'NVIDIA',focus:'GPUs, AI systems and networking'},
  {id:'amd',short:'AMD',name:'AMD',focus:'CPUs, GPUs and adaptive SoCs'},
  {id:'intel',short:'IN',name:'Intel',focus:'CPUs, foundry and process technology'},
  {id:'apple',short:'AP',name:'Apple',focus:'Custom SoCs for phones and Macs'},
  {id:'qualcomm',short:'QC',name:'Qualcomm',focus:'Mobile SoCs, modems and DSPs'},
  {id:'google',short:'GO',name:'Google',focus:'TPUs and data-center silicon'},
  {id:'amazon',short:'AZ',name:'Amazon (Annapurna Labs)',label:'Amazon',focus:'Graviton CPUs, Trainium and Inferentia'},
  {id:'arm',short:'ARM',name:'Arm',focus:'CPU and GPU IP'},
  {id:'broadcom',short:'BR',name:'Broadcom',focus:'Networking, SerDes and custom ASICs'},
  {id:'marvell',short:'MV',name:'Marvell',focus:'Data-infrastructure and storage silicon'},
  {id:'micron',short:'MU',name:'Micron',focus:'DRAM, NAND and memory systems'},
  {id:'ti',short:'TI',name:'Texas Instruments',label:'TI',focus:'Analog, power and embedded processors'},
  {id:'tesla',short:'TS',name:'Tesla',focus:'Vehicle AI chips and power electronics'},
  {id:'synopsys',short:'SN',name:'Synopsys',focus:'EDA tools: synthesis, timing and verification'},
  {id:'cadence',short:'CD',name:'Cadence',focus:'EDA tools: implementation and simulation'}
];

// What each kind of position is tested on: the book chapters its theory problems come from (most central first) and
// the Coding areas of its coding problems. Which companies post which positions is Premium (private/premium-data.js).
// n = problems per position (default 20), nc = how many of them are coding problems (default 4 when it has areas).
// tags/first: draw theory from these source tags instead of chapters (first = the tag that goes first).
// code:'reported' draws coding from the company's reported problems.
const POS_ROLES = {
  hwe:     {label:'Hardware engineering', ch:[9, 10, 11, 8, 5, 20, 14], areas:['RTL design', 'C and C++']},
  asic:    {label:'ASIC and RTL design', ch:[9, 10, 11, 12, 19, 22, 13], areas:['RTL design']},
  dv:      {label:'Design verification', ch:[19, 12, 10, 9, 11], areas:['Verification', 'RTL design']},
  pd:      {label:'Physical design', ch:[11, 13, 15, 16, 17, 14], areas:['Physical design', 'Linux and scripting']},
  dft:     {label:'Design for test', ch:[17, 10, 9, 12], areas:['RTL design']},
  arch:    {label:'Architecture and performance', ch:[20, 18, 21, 22, 11], areas:['C and C++', 'GPU and CUDA']},
  gpu:     {label:'GPU architecture', ch:[21, 20, 22, 7], areas:['GPU and CUDA', 'C and C++']},
  power:   {label:'Power', ch:[14, 3, 15, 11, 5], areas:['Python and MATLAB']},
  psv:     {label:'Silicon validation', ch:[10, 11, 16, 17, 15, 23], areas:['Linux and scripting', 'Python and MATLAB']},
  circuit: {label:'Circuit design', ch:[5, 6, 8, 4, 13, 18], areas:[]},
  memory:  {label:'Memory design', ch:[18, 5, 8, 4, 15], areas:[]},
  board:   {label:'Boards and signal integrity', ch:[1, 2, 16, 3, 6], areas:['Python and MATLAB']},
  ee:      {label:'Electrical engineering', ch:[1, 2, 6, 3, 14, 5], areas:['Python and MATLAB']},
  rf:      {label:'RF and analog', ch:[2, 16, 6, 1], areas:['Python and MATLAB']},
  sysh:    {label:'Hardware systems', ch:[16, 2, 14, 3, 20], areas:['Python and MATLAB', 'Linux and scripting']},
  test:    {label:'Test and product', ch:[17, 15, 16, 10, 23], areas:['Python and MATLAB', 'Linux and scripting']},
  process: {label:'Process and yield', ch:[4, 5, 17, 15], areas:['Python and MATLAB']},
  cad:     {label:'CAD and EDA', ch:[23, 20, 19, 11], areas:['Linux and scripting', 'C and C++', 'Python and MATLAB']},
  fw:      {label:'Firmware and embedded', ch:[7, 20, 23, 10], areas:['C and C++']},
  ignite:  {label:'Hardware engineering program', tags:'ovr', first:'o', code:'reported', n:40, nc:5}
};
const POS_LEVELS = ['Program', 'Intern', 'New grad'];
