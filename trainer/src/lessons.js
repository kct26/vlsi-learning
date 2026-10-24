// Learning path: one unit per hardware chapter of "Hardware from the Ground Up".
// Each card: t = title, b = paragraphs, w = interactive widget (optional), q = check question id (optional).
const PARTS = [
  {n:1, name:"Electricity, from zero", units:[1,2,3]},
  {n:2, name:"Semiconductors and transistors", units:[4,5,6]},
  {n:3, name:"From transistors to logic", units:[7,8,9]},
  {n:4, name:"Memory and time", units:[10,11,12]},
  {n:5, name:"Speed, power and the real world", units:[13,14,15]},
  {n:6, name:"Building real chips", units:[16,17,18]},
  {n:7, name:"Digital systems", units:[19,20,21,22]},
  {n:8, name:"Tools of the trade", units:[23]}
];

const UNITS = [
{id:1, title:"Charge, current and voltage", goal:"Read any simple circuit with Ohm's law, and know why ground matters.", cards:[
  {t:"Current, voltage, resistance", b:["Current is how fast charge flows, in amps. Voltage is the push between two points, in volts. Resistance opposes the flow, in ohms.","Ohm's law ties them together: V = I × R. Power is P = V × I. Drag the sliders and watch what doubling the resistance does to the current."], w:"ohm", q:"01-01"},
  {t:"Ground is a shared reference", b:["Voltage is always measured between two points, so every circuit agrees on one 0 V node: ground.","Boards that talk to each other must share ground, current returns through it, and an input connected to nothing floats to a random value."], q:"01-07"},
  {t:"Series, parallel and dividers", b:["In series, parts share the same current and their resistances add. In parallel, parts share the same voltage and the total resistance is smaller than any one of them.","A voltage divider takes its output from the middle of two resistors: Vout = Vin × R2 / (R1 + R2)."], w:"divider", q:"01-04"},
  {t:"Big currents, tiny resistances", b:["A GPU running at 0.9 V and 400 A uses 360 W. At hundreds of amps, even a quarter of a milliohm in the power path drops 50 mV. That is IR drop, and it slows the chip down."], q:"01-11"}
]},
{id:2, title:"Capacitors, inductors and time", goal:"See why every switch takes time, and how decoupling and reflections work.", cards:[
  {t:"Capacitors store charge", b:["A capacitor holds charge Q = C × V. Its current is I = C × dV/dt, so its voltage can never jump instantly.","Every wire and every transistor gate is a capacitor, so every switch costs time and energy (E = ½CV²)."], q:"02-02"},
  {t:"The RC time constant", b:["Charging through a resistor follows an exponential curve. It reaches 50% at 0.69RC, 63% at RC, and is essentially done by 5RC.","A gate's delay is about 0.69 × (transistor resistance) × (load capacitance). Try the sliders: the 50% marker moves with R × C."], w:"rc", q:"02-01"},
  {t:"Inductance and decoupling", b:["An inductor resists changes in current: V = L × dI/dt. The path from the regulator to the chip has inductance, so sudden current demand makes the supply dip.","Decoupling capacitors right next to the power pins supply that sudden current. For the fastest changes, small capacitors placed close beat big capacitors far away."], q:"02-06"},
  {t:"Reflections and bandwidth", b:["On long, fast traces, signals travel as waves. When the load doesn't match the line, part of the wave reflects: Γ = (ZL − Z0) / (ZL + Z0). A negative Γ means the reflection is inverted.","A scope that is too slow for a square wave's harmonics shows it as a sine wave."], q:"02-08"}
]},
{id:3, title:"Heat", goal:"Calculate a chip's temperature and explain how a heat sink works.", cards:[
  {t:"Every watt becomes heat", b:["A chip stores almost no energy, so the power going in comes out as heat. Hot chips leak more, usually run slower, and wear out faster."], q:"03-13"},
  {t:"Thermal resistance", b:["Heat follows its own Ohm's law: temperature rise = power × thermal resistance (ΔT = P × θ).","The layers from the transistors to the air add in series: Tj = Tambient + P × (θjc + θcs + θsa). Push the power up and see where the chip starts to throttle."], w:"thermal", q:"03-01"},
  {t:"How a heat sink works", b:["The base spreads the heat out, so it is often copper, which conducts best. The fins give the air a large area to carry heat away, so they are often aluminum, which is light and cheap.","Thermal paste fills microscopic air gaps, and it should be thin."], q:"03-03"}
]},
{id:4, title:"Semiconductors", goal:"Understand doping, mobility and what temperature does to silicon.", cards:[
  {t:"Doping", b:["Pure silicon's electrons are locked in bonds, so it conducts poorly. Doping frees carriers.","Phosphorus, with 5 valence electrons, makes n-type silicon with free electrons. Boron, with 3, makes p-type silicon with holes."], q:"04-01"},
  {t:"Mobility", b:["Mobility is how fast carriers drift in an electric field. Electrons are about 2–3× more mobile than holes, which is why PMOS transistors are weaker than NMOS ones."], q:"04-03"},
  {t:"What heat does (your OA)", b:["A hotter lattice vibrates more, so carriers scatter more. Mobility falls, and the resistance of metal wires rises.","Heat also frees extra carriers, so leakage climbs steeply. Slide the temperature up and watch each effect."], w:"temp", q:"04-04"},
  {t:"The PN junction", b:["Where p-type meets n-type silicon, a depletion region forms: that is a diode.","In forward bias, above about 0.7 V, it conducts. In reverse bias it blocks, apart from a tiny leakage."], q:"04-09"}
]},
{id:5, title:"The MOSFET", goal:"Predict exactly what voltage a transistor passes, including weak levels.", cards:[
  {t:"A switch controlled by voltage", b:["An NMOS turns on when its gate is above its source by Vtn. A PMOS turns on when its gate is below its source by |Vtp|.","The gate sits on an insulator, so it draws no DC current."], q:"05-01"},
  {t:"Strong and weak levels", b:["When an NMOS passes a 1, its output becomes its source. As the output rises, the gate-to-source voltage shrinks, and the transistor shuts off at VDD − Vtn.","So NMOS passes a strong 0 and a weak 1, while PMOS passes a strong 1 and a weak 0. Try passing a 1 and then a 0 through each type."], w:"pass", q:"05-03"},
  {t:"Pass-transistor chains", b:["The rule is Vout = min(Vin, VG − Vt). In a series chain with every gate at the full supply, you lose one threshold.","When an already-degraded node drives the next gate, the drops add up."], q:"05-09"},
  {t:"How much current", b:["In saturation, ID = ½ × μCox × (W/L) × (VGS − Vt)². More width, less length, more overdrive or higher mobility all mean more current.","That is why PMOS transistors are drawn about twice as wide as NMOS."], q:"05-12"}
]},
{id:6, title:"Analog basics", goal:"Solve amplifier, op-amp, ADC and regulator questions quickly.", cards:[
  {t:"The transistor as an amplifier", b:["A small wiggle on the gate makes a big wiggle at the output. Common-source gain is −gm × RD, with gm = 2ID / (VGS − Vt)."], q:"06-06"},
  {t:"Op-amp golden rules", b:["With negative feedback, no current flows into the inputs, and the output makes V+ equal V−.","An inverting amplifier's gain is −Rf/Rin; a non-inverting amplifier's gain is 1 + Rf/Rg."], q:"06-01"},
  {t:"Converters and regulators", b:["An ADC's step size is Vref / 2ᴺ, and you must sample faster than twice the highest frequency.","A linear regulator burns the whole voltage difference as heat; a buck converter is far more efficient."], q:"06-07"}
]},
{id:7, title:"Binary and Boolean algebra", goal:"Move fluently between binary, hex and two's complement, and simplify logic.", cards:[
  {t:"Binary, hex and widths", b:["n bits hold 2ⁿ values, and N different values need ⌈log₂ N⌉ bits. One hex digit is exactly four bits.","Type a number and switch the width to see how the same bits read as unsigned and as signed."], w:"bits", q:"07-02"},
  {t:"Two's complement", b:["The most significant bit has weight −2ⁿ⁻¹. To negate a number, invert every bit and add 1. 8 bits span −128 to 127."], q:"07-04"},
  {t:"Bit tricks", b:["x & (x − 1) clears the lowest 1 bit. Two addresses are on the same 4 KB page when a >> 12 equals b >> 12. A value XORed with itself is 0."], q:"07-07"},
  {t:"Boolean algebra", b:["De Morgan: NOT(A·B) = A′ + B′. A + A′B = A + B. Karnaugh maps group neighbouring 1s in powers of two."], q:"07-11"}
]},
{id:8, title:"CMOS gates", goal:"Build gates from transistors and explain the swapped inverter.", cards:[
  {t:"The CMOS inverter", b:["The PMOS pulls the output up to VDD, the NMOS pulls it down to ground, and exactly one is on at a time.","That gives full output swing and no static current. Flip the input and see which transistor conducts."], w:"inverter", q:"08-14"},
  {t:"The swapped inverter (your OA)", b:["Put the NMOS on top and the PMOS on the bottom and the circuit stops inverting.","Input 1 gives VDD − Vtn, and input 0 gives |Vtp|. It becomes a weak, non-inverting buffer. Compare the two modes."], w:"inverter:swapped", q:"08-02"},
  {t:"Series means AND", b:["In the pull-down network, NMOS in series means AND and NMOS in parallel means OR. The pull-up network is the dual.","A NAND gate has PMOS in parallel and NMOS in series."], q:"08-05"},
  {t:"Why NAND beats NOR", b:["A NOR gate stacks slow PMOS transistors in series, so it is slow or must be very wide.","Every static CMOS stage inverts, so AND is a NAND followed by an inverter."], q:"08-08"}
]},
{id:9, title:"Combinational logic", goal:"Build any gate out of 2:1 muxes and reason about adders and delays.", cards:[
  {t:"The multiplexer", b:["A 2:1 mux outputs I1 when S = 1 and I0 when S = 0: Y = S ? I1 : I0. Muxes steer data everywhere in hardware."], q:"09-03"},
  {t:"Any gate from a mux (your OA)", b:["Put one variable on the select. Feed I0 with what the gate gives when that variable is 0, and I1 with what it gives when it is 1.","For OR: S = B, I0 = A, I1 = 1. Solve every target in the builder."], w:"mux", q:"09-01"},
  {t:"Adders", b:["A full adder's sum is A ⊕ B ⊕ Cin, and its carry is the majority of the three inputs.","Ripple-carry delay grows with the number of bits; lookahead adders are faster."], q:"09-09"},
  {t:"Delay and glitches", b:["A block's propagation delay is set by its slowest path, and its contamination delay by its fastest.","When paths have unequal delays, the output can glitch briefly before it settles."], q:"09-17"}
]},
{id:10, title:"Latches and flip-flops", goal:"Know exactly when a latch and a flip-flop change, and why flip-flops win.", cards:[
  {t:"Memory from feedback", b:["Two inverters connected in a loop hold one bit indefinitely. Latches and flip-flops add a controlled way to write that bit."], q:"10-07"},
  {t:"Latch vs flip-flop (your OA)", b:["A latch is transparent while it is enabled. A flip-flop samples its input only at the clock edge.","The flip-flop wins on safety: no race-through, glitches ignored, simple timing. The latch wins on size and allows time borrowing. Click the D cells and watch the two outputs."], w:"latchff", q:"10-01"},
  {t:"Flip-flops from muxes", b:["A mux with its output fed back to one input is a latch.","Two of these latches, enabled in opposite clock phases, make a master–slave flip-flop."], q:"10-05"},
  {t:"Metastability", b:["If D changes inside the setup/hold window, a flip-flop can hang between 0 and 1 for an unpredictable time.","It can't be eliminated, only made rare, using two-flop synchronizers."], q:"10-11"}
]},
{id:11, title:"Timing", goal:"Run setup and hold checks in your head, including skew.", cards:[
  {t:"Setup: arriving too late", b:["Data must satisfy tcq + tpd + tsu ≤ T + skew. This check sets the maximum clock frequency, and slowing the clock fixes it.","Change the clock in the calculator and watch the setup slack move."], w:"timing", q:"11-01"},
  {t:"Hold: arriving too early", b:["New data must not arrive before the hold window closes: tcq + tcd ≥ th + skew.","There is no clock period in that check, so slowing the clock never fixes a hold violation. You add delay to the short path instead."], q:"11-04"},
  {t:"Skew and pipelining", b:["Positive skew, where the capture clock arrives late, helps setup and hurts hold.","Pipelining raises throughput and clock frequency, but adds latency."], q:"11-05"}
]},
{id:12, title:"Counters, dividers and FSMs", goal:"Design clock dividers and state machines from scratch.", cards:[
  {t:"Counters divide clocks", b:["Each bit of a binary counter runs at half the frequency of the bit below it. A toggle flip-flop divides by 2."], q:"12-01"},
  {t:"Odd dividers with 50% duty", b:["To divide by 3 with a 50% duty cycle, make a signal that is high for 1 of every 3 cycles. OR it with a copy delayed half a cycle by a falling-edge flip-flop."], q:"12-04"},
  {t:"State machines", b:["A Moore machine's outputs depend only on its state; a Mealy machine's also depend on its inputs.","N states need ⌈log₂ N⌉ flip-flops in binary, or N flip-flops one-hot."], q:"12-10"},
  {t:"Sequence detectors", b:["Each state remembers how much of the pattern has arrived. With overlap, after a match or a mismatch you jump to the longest ending that is still a start of the pattern."], q:"12-09"}
]},
{id:13, title:"Delay", goal:"Estimate gate and wire delays and size a buffer chain.", cards:[
  {t:"Delay is RC", b:["A gate's delay is about 0.69 × R × C: the transistor's resistance charging the load capacitance, which is the fan-out plus the wire plus the gate's own parasitics."], q:"13-01"},
  {t:"Sizing and buffer chains", b:["A wider gate is stronger, but it loads whatever drives it.","To drive a big load, use a chain of inverters, each about 4× larger than the last."], q:"13-02"},
  {t:"Wires", b:["An unbuffered wire's delay grows with the square of its length. Repeaters break it into short pieces, so the delay grows only linearly."], q:"13-04"}
]},
{id:14, title:"Power", goal:"Answer every power-scaling question in seconds.", cards:[
  {t:"Where power goes", b:["Dynamic power is αCV²f, spent every time something switches. Short-circuit power is spent during each transition. Leakage flows all the time."], q:"14-05"},
  {t:"Scaling questions (your OA)", b:["Multiply the factors together and square the voltage factor: doubling both f and V gives 2 × 2² = 8×.","Try the classic variants in the calculator, such as V up 10% with f up 20%."], w:"power", q:"14-01"},
  {t:"Power vs energy", b:["Energy per operation is αCV², with no frequency in it. Running faster at the same voltage uses more power but the same energy."], q:"14-06"},
  {t:"Saving power", b:["Clock gating stops switching, which cuts dynamic power. Power gating cuts off the supply, which stops leakage. DVFS lowers voltage and frequency together, which cuts both."], q:"14-07"}
]},
{id:15, title:"Process, voltage and temperature", goal:"Explain temperature effects, temperature inversion and sign-off corners.", cards:[
  {t:"Mobility and wires vs heat (your OA)", b:["Heat lowers carrier mobility and raises wire resistance, and both slow the chip down.","Heat also lowers Vt. At low supply voltages that effect can win. Slide VDD down to 0.6 V and then heat the chip."], w:"temp", q:"15-01"},
  {t:"Temperature inversion", b:["At low VDD, the drop in Vt outweighs the loss of mobility, so a hot chip can be faster. Wires, however, are always slower when hot."], q:"15-04"},
  {t:"Sign-off corners", b:["Setup is checked at the slow corner with low voltage. Hold is checked at the fast corner with high voltage. Leakage is worst at the fast corner, high voltage and high temperature."], q:"15-07"}
]},
{id:16, title:"Wires and links", goal:"Compute wire resistance, crosstalk windows and link bandwidth.", cards:[
  {t:"Wire resistance", b:["A wire's resistance is its sheet resistance times length divided by width (R = R□ × L/W).","Thin lower layers are very resistive, so the thick top layers carry power, clocks and long routes."], q:"16-01"},
  {t:"Crosstalk", b:["Coupling capacitance lets a switching wire glitch or slow its neighbour, but only where their switching windows overlap."], q:"16-04"},
  {t:"Bandwidth math", b:["Bytes per second = width × transfers per second / 8 × efficiency. DDR moves data on both clock edges, so it makes two transfers per cycle."], q:"16-07"}
]},
{id:17, title:"Manufacturing and reliability", goal:"Explain the antenna rule, electromigration, latch-up and yield.", cards:[
  {t:"How chips are made", b:["Chips are printed one layer at a time with light, then etched with plasma, doped, and polished flat. Dummy fill keeps the metal density even so polishing works."], q:"17-10"},
  {t:"The antenna rule (your OA)", b:["Plasma etching charges long wires. If a wire touches only a gate, that charge must go through the thin gate oxide.","The risk is the ratio of metal area to gate area, so a smaller gate is worse. Try shrinking the gate, then add a diode."], w:"antenna", q:"17-01"},
  {t:"Reliability", b:["Electromigration is driven by current and heat. Latch-up comes from a parasitic thyristor. ESD is static discharge. Aging, such as NBTI, raises Vt over the years."], q:"17-07"}
]},
{id:18, title:"Memory circuits", goal:"Explain SRAM and DRAM reads and writes, and what ECC buys you.", cards:[
  {t:"SRAM", b:["A 6T SRAM cell is two cross-coupled inverters plus two access transistors.","For a safe read, the pull-down must be stronger than the access transistor. For a write to work, the access transistor must be stronger than the pull-up."], q:"18-01"},
  {t:"DRAM", b:["A DRAM cell is one transistor and one capacitor. A read shares its charge with a large bitline, so the signal is small and the read destroys the value. Every cell needs periodic refresh."], q:"18-03"},
  {t:"Sense amps and ECC", b:["Sense amplifiers detect bitline differences of about 100 mV quickly. SECDED error correction protects 64 data bits with 8 check bits."], q:"18-07"}
]},
{id:19, title:"RTL, CDC, FIFOs and verification", goal:"Avoid the classic Verilog and clock-crossing traps, size FIFOs, and learn how designs are verified.", cards:[
  {t:"Blocking vs nonblocking", b:["A nonblocking assignment (<=) updates everything together at the end of the time step, like flip-flops. A blocking assignment (=) takes effect immediately."], q:"19-02"},
  {t:"Crossing clock domains", b:["A single bit crosses through a two-flop synchronizer. A counter crosses in Gray code. A stream of data crosses through an asynchronous FIFO."], q:"19-05"},
  {t:"FIFO depth", b:["Depth ≥ burst length × (1 − read rate / write rate), with both rates in words per second."], q:"19-07"},
  {t:"Verifying a design", b:["A testbench drives the design and checks every output automatically against a reference model: a simple, trusted description of the right answer.","Directed tests hit known corner cases; constrained-random tests find the bugs nobody thought of. Assertions flag a broken rule the moment it happens. Coverage tells you which scenarios you actually reached, but only checkers find bugs."], q:"19-34"}
]},
{id:20, title:"Computer architecture", goal:"Walk through the pipeline, hazards and caches with numbers.", cards:[
  {t:"The five-stage pipeline", b:["IF, ID, EX, MEM, WB: five instructions are in flight at once, and one finishes every cycle."], q:"20-01"},
  {t:"Hazards", b:["Forwarding fixes most data hazards, but a load followed immediately by its use still stalls one cycle. Branch prediction handles control hazards."], q:"20-02"},
  {t:"Caches", b:["An address splits into tag, index and offset. AMAT = hit time + miss rate × miss penalty.","Change the cache shape and watch the fields resize."], w:"cache", q:"20-06"}
]},
{id:21, title:"GPUs", goal:"Explain how GPUs get throughput and what number formats trade off.", cards:[
  {t:"Throughput machines", b:["Warps of 32 threads run in lockstep (SIMT). The GPU hides memory latency by switching to another ready warp."], q:"21-01"},
  {t:"Two pitfalls", b:["When threads in a warp take different branches, the branches run one after the other. Strided memory accesses can't be combined into a few wide transactions."], q:"21-03"},
  {t:"Number formats", b:["A floating-point value is (−1)ˢ × 1.m × 2^(e − bias). The exponent bits set the range and the fraction bits set the precision. BF16 keeps FP32's range.","Decode a few bit patterns to see the pieces."], w:"fp32", q:"21-08"}
]},
{id:22, title:"Computer arithmetic", goal:"See how hardware adds, multiplies, divides and rounds, in integers, fixed point and floating point.", cards:[
  {t:"When a result doesn't fit", b:["The same adder serves unsigned and signed numbers. For unsigned numbers, a carry out of the top bit means the result was too big. For signed numbers, overflow is V = (carry into the sign bit) XOR (carry out of it).","Ordinary hardware wraps around. Saturating hardware clamps to the largest or smallest value instead, which is what pixels, audio and quantized AI need. Try 100 + 50 and 200 + 100."], w:"flags", q:"22-07"},
  {t:"Adding fast", b:["Each bit generates a carry (G = A·B) or propagates one (P = A ⊕ B). Carry-lookahead and prefix adders compute every carry from G and P in about log₂ n levels instead of waiting for a ripple.","A carry-save adder turns three numbers into two (a sum vector and a carry vector) with one full-adder delay, because no carry moves sideways. Multipliers are built on it."], q:"22-14"},
  {t:"Multiplying", b:["Each partial product is the multiplicand or zero, shifted. An n-bit × m-bit product needs n + m bits, and multiplier area grows about with width squared.","Radix-4 Booth recoding reads the multiplier in overlapping groups of three bits and turns each into a digit from −2 to +2, halving the number of partial products. Recode a few multipliers."], w:"booth", q:"22-17"},
  {t:"Dividing", b:["Long division makes one quotient bit per step, and each step needs the previous remainder, so division is slow. Shift the remainder left, bring in the next bit, and subtract the divisor if it fits.","Division by a constant is replaced by a multiply and a shift: for 16-bit x, x / 3 = (x × 43691) >> 17."], q:"22-21"},
  {t:"Fixed point", b:["A Qm.n number is an integer with n fraction bits: its value is the integer ÷ 2ⁿ, and its step is 2⁻ⁿ. Multiplying Qa.b by Qc.d gives b + d fraction bits, so shift back afterwards.","Store a few values and watch the rounding error, and what happens when a value does not fit."], w:"fixq", q:"22-23"},
  {t:"Floating-point arithmetic", b:["To add: compare exponents, shift the smaller significand right to align, add, normalize, round. To multiply: XOR the signs, add the exponent fields and subtract 127, multiply the significands, normalize, round.","Exponent field 0 means zero or a subnormal; 255 means infinity or NaN. Decode some special values."], w:"fp32", q:"22-27"},
  {t:"Rounding and order", b:["The default rounding is round to nearest, ties to even. Every operation rounds, so floating-point addition is not associative: in FP32, (10⁸ + 1) − 10⁸ is 0.","A fused multiply-add rounds only once. AI hardware multiplies in narrow formats but accumulates in FP32 so small terms are not lost."], q:"22-30"}
]},
{id:23, title:"Programming, Linux and scripting", goal:"Use the everyday tools of a hardware engineer: C for hardware, Python, the Linux shell, git, make and Tcl.", cards:[
  {t:"C that talks to hardware", b:["Firmware reaches hardware through memory-mapped registers: a pointer to volatile data at a fixed address, so every read and write really happens.","Watch for C's traps: shifting by the full width is undefined, macros need parentheses, and struct members are padded to their alignment."], q:"23-02"},
  {t:"Python for automation", b:["Python glues chip work together: parsing timing reports and logs, generating test vectors, and driving simulations (for example with cocotb).","Its integers never overflow, so mask explicitly (x & 0xFFFF) to model fixed-width hardware. Dicts count and look things up in O(1)."], q:"23-11"},
  {t:"The Linux shell", b:["Chip design runs on Linux. Small tools joined with pipes answer most questions: find files, grep for patterns, awk for columns, sort and wc to summarize.","2>&1 sends errors along with normal output, and PATH decides which programs the shell can find."], q:"23-13"},
  {t:"git and make", b:["RTL lives in version control. Work on a branch, commit small changes with clear messages, and merge after review.","make rebuilds only what changed, by comparing file timestamps. Recipe lines start with a tab."], q:"23-19"},
  {t:"Tcl and EDA tools", b:["Synthesis, place and route, and timing tools are driven by Tcl. Square brackets run a command and substitute its result; braces keep text literal.","Timing constraints (SDC) are Tcl too: create_clock, set_input_delay, set_clock_groups and multicycle paths."], q:"23-24"},
  {t:"From script to regression", b:["A regression runs thousands of tests with different random seeds on a compute farm (LSF or Slurm), collects pass/fail, and groups failures by their error messages.","Practice the hands-on half in the Coding tab: RTL, testbenches, C, Python, shell, Tcl and CUDA problems."], q:"23-30"}
]}
];
