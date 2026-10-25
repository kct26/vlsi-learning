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
