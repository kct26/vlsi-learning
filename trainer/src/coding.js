// Coding problems: the hands-on half of a hardware engineer's job.
// Each problem: id, d (E/M/H), lang, area, title, p (statement paragraphs; `code` in backticks),
// ex (example, optional), starter, hints, sol (reference solution), why (explanation paragraphs),
// run (Python only: {fn, tests: [[args], expected]} checked in the browser).
const LANGS = {verilog:'Verilog', sv:'SystemVerilog', c:'C', cpp:'C++', python:'Python', bash:'Bash', tcl:'Tcl', perl:'Perl', cuda:'CUDA', matlab:'MATLAB'};
const CODE_AREAS = ['RTL design', 'Verification', 'C and C++', 'Python and MATLAB', 'Linux and scripting', 'Physical design', 'GPU and CUDA'];
const CODING = [
// ---------------- RTL design (Verilog) ----------------
{id:'rtl-01', d:'E', lang:'verilog', area:'RTL design', title:'Parameterized 2:1 multiplexer',
 p:["Write a module `mux2` with a parameter `W` (default 8). Inputs `a`, `b` (W bits each) and select `s`; output `y` is `b` when `s` is 1, otherwise `a`."],
 starter:`module mux2 #(parameter W = 8) (
  input  wire [W-1:0] a, b,
  input  wire         s,
  output wire [W-1:0] y
);
  // your code
endmodule`,
 hints:["One continuous assignment with the conditional operator is enough."],
 sol:`module mux2 #(parameter W = 8) (
  input  wire [W-1:0] a, b,
  input  wire         s,
  output wire [W-1:0] y
);
  assign y = s ? b : a;
endmodule`,
 why:["`assign` describes combinational logic that is always active. The parameter lets one module serve every width: instantiate it as `mux2 #(.W(32)) u_mux (...)`."]},
{id:'rtl-02', d:'E', lang:'verilog', area:'RTL design', title:'4-bit counter with enable and synchronous reset',
 p:["Write `counter4`: on each rising edge of `clk`, if `rst` is 1 the count `q` becomes 0; otherwise, if `en` is 1, it increments (wrapping from 15 to 0)."],
 starter:`module counter4 (
  input  wire       clk, rst, en,
  output reg  [3:0] q
);
  // your code
endmodule`,
 hints:["Use `always @(posedge clk)` and nonblocking assignments.", "Reset has priority, so check it first."],
 sol:`module counter4 (
  input  wire       clk, rst, en,
  output reg  [3:0] q
);
  always @(posedge clk) begin
    if (rst)     q <= 4'd0;
    else if (en) q <= q + 4'd1;   // wraps naturally: 4'd15 + 1 = 4'd0
  end
endmodule`,
 why:["A synchronous reset is just another input to the next-state logic, so it only acts on a clock edge. A 4-bit register wraps by itself because the sum is truncated to 4 bits."]},
{id:'rtl-03', d:'E', lang:'verilog', area:'RTL design', title:'Rising-edge detector',
 p:["Write `rise_detect`: output `pulse` is high for exactly one clock cycle each time input `d` goes from 0 to 1. Use an active-low asynchronous reset `rst_n`. Assume `d` is already synchronous to `clk`."],
 starter:`module rise_detect (
  input  wire clk, rst_n, d,
  output wire pulse
);
  // your code
endmodule`,
 hints:["Remember last cycle's value of `d` in a flip-flop.", "A rising edge means: now 1, last cycle 0."],
 sol:`module rise_detect (
  input  wire clk, rst_n, d,
  output wire pulse
);
  reg d_q;
  always @(posedge clk or negedge rst_n)
    if (!rst_n) d_q <= 1'b0;
    else        d_q <= d;
  assign pulse = d & ~d_q;   // high while d is 1 but was 0 one cycle ago
endmodule`,
 why:["The flip-flop holds the previous value, so `d & ~d_q` is true only in the first cycle after `d` rises. If `d` came from another clock domain, it would first need a two-flop synchronizer (Chapter 19)."]},
{id:'rtl-04', d:'E', lang:'verilog', area:'RTL design', title:'Even parity generator',
 p:["Write `parity8`: given an 8-bit input `d`, output `p` such that the 9 bits `{p, d}` contain an even number of 1s."],
 starter:`module parity8 (input wire [7:0] d, output wire p);
  // your code
endmodule`,
 hints:["XOR of all bits is 1 when the number of 1s is odd.", "Verilog has a reduction XOR operator."],
 sol:`module parity8 (input wire [7:0] d, output wire p);
  assign p = ^d;   // reduction XOR: 1 when d has an odd number of 1s
endmodule`,
 why:["If `d` has an odd number of 1s, `p` = 1 makes the total even; if even, `p` = 0. The receiver XORs all 9 bits: a result of 1 means a single-bit error. This is the XOR-chain idea from Chapter 9."]},
{id:'rtl-05', d:'E', lang:'verilog', area:'RTL design', title:'3-to-8 decoder with enable',
 p:["Write `dec3to8`: when `en` is 1, exactly the output bit `y[a]` is 1; when `en` is 0, all outputs are 0."],
 starter:`module dec3to8 (input wire [2:0] a, input wire en, output wire [7:0] y);
  // your code
endmodule`,
 hints:["Shifting a 1 left by `a` places sets exactly bit `a`."],
 sol:`module dec3to8 (input wire [2:0] a, input wire en, output wire [7:0] y);
  assign y = en ? (8'b1 << a) : 8'b0;
endmodule`,
 why:["`8'b1 << a` produces a one-hot word. A `case` statement with eight lines works too; the shift is shorter and synthesizes to the same decoder."]},
{id:'rtl-06', d:'E', lang:'verilog', area:'RTL design', title:'8-bit maximal-length LFSR',
 p:["Write `lfsr8`, an 8-bit Fibonacci LFSR that steps when `en` is 1 and cycles through all 255 nonzero states. Use the polynomial x⁸ + x⁶ + x⁵ + x⁴ + 1 and reset to `8'h01`."],
 starter:`module lfsr8 (
  input  wire       clk, rst_n, en,
  output reg  [7:0] q
);
  // your code
endmodule`,
 hints:["The feedback bit is the XOR of the tapped bits: q[7], q[5], q[4] and q[3].", "Shift left and insert the feedback bit at the bottom."],
 sol:`module lfsr8 (
  input  wire       clk, rst_n, en,
  output reg  [7:0] q
);
  wire fb = q[7] ^ q[5] ^ q[4] ^ q[3];   // taps for x^8 + x^6 + x^5 + x^4 + 1
  always @(posedge clk or negedge rst_n)
    if (!rst_n)  q <= 8'h01;              // any nonzero seed; all zeros would lock up
    else if (en) q <= {q[6:0], fb};
endmodule`,
 why:["A primitive polynomial gives the maximal period 2⁸ − 1 = 255. The all-zero state maps to itself, so it must never be loaded. LFSRs are used for pseudo-random test patterns, scramblers and CRCs."]},
{id:'rtl-07', d:'M', lang:'verilog', area:'RTL design', title:'Divide-by-3 clock with 50% duty cycle',
 p:["Write `div3`: `clk_out` has one third of the frequency of `clk` and is high for exactly half of its period (1.5 input cycles). This is a reported NVIDIA interview question."],
 starter:`module div3 (
  input  wire clk, rst_n,
  output wire clk_out
);
  // your code
endmodule`,
 hints:["A mod-3 counter on the rising edge gives a signal that is high for 1 of every 3 cycles.", "Delay that signal by half a cycle with a falling-edge flip-flop.", "OR the two together: high for 1.5 cycles."],
 sol:`module div3 (
  input  wire clk, rst_n,
  output wire clk_out
);
  reg [1:0] cnt;
  reg       a, b;
  always @(posedge clk or negedge rst_n)
    if (!rst_n)           cnt <= 2'd0;
    else if (cnt == 2'd2) cnt <= 2'd0;
    else                  cnt <= cnt + 2'd1;
  always @(posedge clk or negedge rst_n)
    if (!rst_n) a <= 1'b0;
    else        a <= (cnt == 2'd2);   // high for one full cycle out of three
  always @(negedge clk or negedge rst_n)
    if (!rst_n) b <= 1'b0;
    else        b <= a;               // the same pulse, half a cycle later
  assign clk_out = a | b;             // high for 1.5 of every 3 cycles
endmodule`,
 why:["With only rising edges, a divide-by-3 output can be high for 1 or 2 cycles (33% or 67%). The falling-edge copy adds the missing half cycle. Both `a` and `b` come from flip-flops, so the OR does not glitch. In a real chip, generated clocks are built from library cells and declared to timing analysis."]},
{id:'rtl-08', d:'M', lang:'verilog', area:'RTL design', title:'Overlapping 1011 sequence detector (Mealy)',
 p:["Write `det1011`: input bit `x` arrives one per clock. Output `y` is 1 in the same cycle as the final 1 of every `1011` pattern, including overlapping patterns (for 1011011, `y` is high twice)."],
 starter:`module det1011 (
  input  wire clk, rst_n, x,
  output wire y
);
  // your code
endmodule`,
 hints:["Use four states: nothing matched, 1, 10, 101.", "From 101, a 1 completes the match and its last 1 can start the next pattern.", "Mealy output: y depends on the state and the current input."],
 sol:`module det1011 (
  input  wire clk, rst_n, x,
  output wire y
);
  localparam S0 = 2'd0, S1 = 2'd1, S2 = 2'd2, S3 = 2'd3;   // matched: "", "1", "10", "101"
  reg [1:0] s, ns;
  always @(*) begin
    case (s)
      S0: ns = x ? S1 : S0;
      S1: ns = x ? S1 : S2;
      S2: ns = x ? S3 : S0;
      S3: ns = x ? S1 : S2;   // after 1011 the trailing 1 is a new start; 1010 leaves "10"
      default: ns = S0;
    endcase
  end
  always @(posedge clk or negedge rst_n)
    if (!rst_n) s <= S0;
    else        s <= ns;
  assign y = (s == S3) & x;
endmodule`,
 why:["Each state records the longest suffix of the input that is also a prefix of 1011. On a mismatch you fall back to the longest prefix still matched, not always to S0: that is what makes overlap work. A Moore version would need a fifth state for 'just matched'."]},
{id:'rtl-09', d:'M', lang:'verilog', area:'RTL design', title:'Synchronous FIFO with full and empty',
 p:["Write `sync_fifo` with parameters `W` (data width) and `AW` (address bits, depth 2^AW). Writes happen when `wr_en` and not full; reads when `rd_en` and not empty, with `dout` registered. Provide `full` and `empty`."],
 starter:`module sync_fifo #(parameter W = 8, AW = 3) (
  input  wire         clk, rst_n,
  input  wire         wr_en, rd_en,
  input  wire [W-1:0] din,
  output reg  [W-1:0] dout,
  output wire         full, empty
);
  // your code
endmodule`,
 hints:["Keep read and write pointers with one extra bit.", "Equal pointers (including the extra bit) mean empty.", "Equal low bits but different extra bits mean full."],
 sol:`module sync_fifo #(parameter W = 8, AW = 3) (
  input  wire         clk, rst_n,
  input  wire         wr_en, rd_en,
  input  wire [W-1:0] din,
  output reg  [W-1:0] dout,
  output wire         full, empty
);
  reg [W-1:0] mem [0:(1<<AW)-1];
  reg [AW:0]  wp, rp;                        // extra bit tells full from empty
  wire do_wr = wr_en && !full;
  wire do_rd = rd_en && !empty;
  always @(posedge clk)                      // memory: no reset needed
    if (do_wr) mem[wp[AW-1:0]] <= din;
  always @(posedge clk or negedge rst_n)
    if (!rst_n) begin
      wp <= 0; rp <= 0;
    end else begin
      if (do_wr) wp <= wp + 1'b1;
      if (do_rd) begin dout <= mem[rp[AW-1:0]]; rp <= rp + 1'b1; end
    end
  assign empty = (wp == rp);
  assign full  = (wp[AW] != rp[AW]) && (wp[AW-1:0] == rp[AW-1:0]);
endmodule`,
 why:["The pointers wrap around the memory; the extra bit counts how many times. Equal including that bit means the writer has not lapped the reader (empty); differing only in that bit means it is exactly one lap ahead (full). Simultaneous read and write work at any fill level."]},
{id:'rtl-10', d:'M', lang:'verilog', area:'RTL design', title:'4-way round-robin arbiter',
 p:["Write `rr_arb4`: `req[3:0]` are requests, `gnt[3:0]` is one-hot (or zero). Priority rotates: after requester i is granted, requester i+1 has the highest priority next cycle. No requester may starve."],
 starter:`module rr_arb4 (
  input  wire       clk, rst_n,
  input  wire [3:0] req,
  output reg  [3:0] gnt
);
  // your code
endmodule`,
 hints:["Keep a 2-bit pointer to the requester with the highest priority.", "Scan from the pointer, wrapping around, and grant the first request found.", "After a grant, move the pointer to one past the winner."],
 sol:`module rr_arb4 (
  input  wire       clk, rst_n,
  input  wire [3:0] req,
  output reg  [3:0] gnt
);
  reg [1:0] ptr;          // highest-priority requester this cycle
  reg [1:0] idx;
  integer   i;
  always @(*) begin
    gnt = 4'b0000;
    for (i = 0; i < 4; i = i + 1) begin
      idx = ptr + i[1:0];                    // wraps around 3 -> 0
      if (gnt == 4'b0000 && req[idx]) gnt[idx] = 1'b1;
    end
  end
  always @(posedge clk or negedge rst_n)
    if (!rst_n) ptr <= 2'd0;
    else case (gnt)                          // next turn starts after the winner
      4'b0001: ptr <= 2'd1;
      4'b0010: ptr <= 2'd2;
      4'b0100: ptr <= 2'd3;
      4'b1000: ptr <= 2'd0;
      default: ptr <= ptr;
    endcase
endmodule`,
 why:["The loop describes a priority chain starting at `ptr`; synthesis unrolls it into logic. Because the winner drops to lowest priority, every requester holding its request is served within 4 cycles. A fixed-priority arbiter (always prefer bit 0) is simpler but can starve the others."]},
{id:'rtl-11', d:'M', lang:'verilog', area:'RTL design', title:'Pulse synchronizer between clock domains',
 p:["A one-cycle pulse `pulse_a` in domain `clk_a` must produce exactly one one-cycle pulse `pulse_b` in domain `clk_b`. The clocks are unrelated, and pulses are at least a few `clk_b` cycles apart. Write `pulse_sync`."],
 starter:`module pulse_sync (
  input  wire clk_a, rst_a_n, pulse_a,
  input  wire clk_b, rst_b_n,
  output wire pulse_b
);
  // your code
endmodule`,
 hints:["A short pulse can fall between clk_b edges. Convert it into a level that toggles.", "Synchronize the toggle level with two flip-flops in clk_b.", "Detect a change of the synchronized level with one more flip-flop and an XOR."],
 sol:`module pulse_sync (
  input  wire clk_a, rst_a_n, pulse_a,
  input  wire clk_b, rst_b_n,
  output wire pulse_b
);
  reg tog_a;                                  // flips once per source pulse
  always @(posedge clk_a or negedge rst_a_n)
    if (!rst_a_n)     tog_a <= 1'b0;
    else if (pulse_a) tog_a <= ~tog_a;
  reg [2:0] sync_b;                           // 2 flops synchronize, the 3rd remembers
  always @(posedge clk_b or negedge rst_b_n)
    if (!rst_b_n) sync_b <= 3'b000;
    else          sync_b <= {sync_b[1:0], tog_a};
  assign pulse_b = sync_b[2] ^ sync_b[1];     // one pulse per change of the level
endmodule`,
 why:["A level cannot be missed, only delayed, so the toggle is safe to synchronize. The first flop may go metastable; the second gives it a full cycle to settle. If pulses can arrive faster than the destination can see two changes, use a handshake or an asynchronous FIFO instead."]},
{id:'rtl-12', d:'M', lang:'verilog', area:'RTL design', title:'Binary to Gray and Gray to binary',
 p:["Write two parameterized modules: `bin2gray` (N-bit binary `b` to Gray `g`) and `gray2bin` (back again)."],
 starter:`module bin2gray #(parameter N = 4) (input wire [N-1:0] b, output wire [N-1:0] g);
  // your code
endmodule

module gray2bin #(parameter N = 4) (input wire [N-1:0] g, output reg [N-1:0] b);
  // your code
endmodule`,
 hints:["Gray = binary XOR (binary shifted right by 1).", "Going back, each binary bit is the XOR of all Gray bits at and above it: b[i] = b[i+1] ^ g[i]."],
 sol:`module bin2gray #(parameter N = 4) (input wire [N-1:0] b, output wire [N-1:0] g);
  assign g = b ^ (b >> 1);
endmodule

module gray2bin #(parameter N = 4) (input wire [N-1:0] g, output reg [N-1:0] b);
  integer i;
  always @(*) begin
    b[N-1] = g[N-1];
    for (i = N-2; i >= 0; i = i - 1)
      b[i] = b[i+1] ^ g[i];
  end
endmodule`,
 why:["Consecutive Gray codes differ in one bit, which is why asynchronous FIFO pointers cross clock domains in Gray code. The conversion back is a prefix XOR from the top bit down."]},
{id:'rtl-13', d:'M', lang:'verilog', area:'RTL design', title:'8-bit ALU with flags',
 p:["Write `alu8`. `op`: 0 add, 1 subtract, 2 AND, 3 OR, 4 XOR, 5 shift left by 1, 6 shift right by 1, 7 set-less-than (signed). Outputs: result `y`, and flags `z` (zero), `n` (negative), `c` (carry, or borrow for subtract), `v` (signed overflow, for add and subtract)."],
 starter:`module alu8 (
  input  wire [7:0] a, b,
  input  wire [2:0] op,
  output reg  [7:0] y,
  output wire       z, n,
  output reg        c, v
);
  // your code
endmodule`,
 hints:["Compute add and subtract in 9 bits so bit 8 is the carry.", "Overflow on add: operands have the same sign and the result's sign differs.", "Give every output a default at the top of the always block so no latches appear."],
 sol:`module alu8 (
  input  wire [7:0] a, b,
  input  wire [2:0] op,
  output reg  [7:0] y,
  output wire       z, n,
  output reg        c, v
);
  reg [8:0] t;
  always @(*) begin
    t = 9'd0; y = 8'd0; c = 1'b0; v = 1'b0;      // defaults: no latches
    case (op)
      3'd0: begin t = a + b; y = t[7:0]; c = t[8]; v = (a[7] == b[7]) && (y[7] != a[7]); end
      3'd1: begin t = a - b; y = t[7:0]; c = t[8]; v = (a[7] != b[7]) && (y[7] != a[7]); end
      3'd2: y = a & b;
      3'd3: y = a | b;
      3'd4: y = a ^ b;
      3'd5: y = a << 1;
      3'd6: y = a >> 1;
      default: y = {7'd0, $signed(a) < $signed(b)};
    endcase
  end
  assign z = (y == 8'd0);
  assign n = y[7];
endmodule`,
 why:["For subtraction, bit 8 of the 9-bit difference is 1 when a < b as unsigned numbers (a borrow). Signed overflow is detected from the signs, as in Chapter 22. `$signed` makes the comparison treat the operands as two's complement."]},
{id:'rtl-14', d:'M', lang:'verilog', area:'RTL design', title:'Leading-zero counter',
 p:["Write `lzc16`: `count` is the number of leading zeros in the 16-bit input `x` (16 when `x` is 0). Floating-point normalization uses exactly this."],
 starter:`module lzc16 (input wire [15:0] x, output reg [4:0] count);
  // your code
endmodule`,
 hints:["Scan from bit 15 down and stop at the first 1.", "A `found` flag inside a combinational loop works."],
 sol:`module lzc16 (input wire [15:0] x, output reg [4:0] count);
  integer i;
  reg found;
  always @(*) begin
    count = 5'd16; found = 1'b0;
    for (i = 15; i >= 0; i = i - 1)
      if (!found && x[i]) begin
        count = 15 - i;
        found = 1'b1;
      end
  end
endmodule`,
 why:["This is a priority encoder. Synthesis turns the loop into a chain; for speed, real designs build a tree (count leading zeros of each half, then combine), giving log₂ n delay."]},
{id:'rtl-15', d:'H', lang:'verilog', area:'RTL design', title:'Asynchronous FIFO with Gray-coded pointers',
 p:["Write `async_fifo`: a writer on `wclk` and a reader on `rclk` (unrelated clocks). Depth 2^AW. Pointers must cross domains safely. Provide `full` in the write domain and `empty` in the read domain."],
 starter:`module async_fifo #(parameter W = 8, AW = 4) (
  input  wire         wclk, wrst_n, wr_en,
  input  wire [W-1:0] din,
  output wire         full,
  input  wire         rclk, rrst_n, rd_en,
  output wire [W-1:0] dout,
  output wire         empty
);
  // your code
endmodule`,
 hints:["Each side keeps a binary pointer (to address memory) and a Gray copy (to send across).", "Synchronize the other side's Gray pointer with two flip-flops.", "Empty: Gray pointers equal. Full: equal except the top two bits are inverted."],
 sol:`module async_fifo #(parameter W = 8, AW = 4) (
  input  wire         wclk, wrst_n, wr_en,
  input  wire [W-1:0] din,
  output wire         full,
  input  wire         rclk, rrst_n, rd_en,
  output wire [W-1:0] dout,
  output wire         empty
);
  reg  [W-1:0] mem [0:(1<<AW)-1];
  reg  [AW:0]  wbin, wgray, rbin, rgray;     // binary and Gray pointers, one extra bit
  reg  [AW:0]  rgray_w1, rgray_w2;           // read pointer, synchronized into wclk
  reg  [AW:0]  wgray_r1, wgray_r2;           // write pointer, synchronized into rclk
  wire [AW:0]  wbin_nxt  = wbin + (wr_en & ~full);
  wire [AW:0]  rbin_nxt  = rbin + (rd_en & ~empty);

  always @(posedge wclk) if (wr_en && !full) mem[wbin[AW-1:0]] <= din;
  assign dout = mem[rbin[AW-1:0]];

  always @(posedge wclk or negedge wrst_n)
    if (!wrst_n) begin wbin <= 0; wgray <= 0; rgray_w1 <= 0; rgray_w2 <= 0; end
    else begin
      wbin <= wbin_nxt;
      wgray <= wbin_nxt ^ (wbin_nxt >> 1);
      {rgray_w2, rgray_w1} <= {rgray_w1, rgray};
    end

  always @(posedge rclk or negedge rrst_n)
    if (!rrst_n) begin rbin <= 0; rgray <= 0; wgray_r1 <= 0; wgray_r2 <= 0; end
    else begin
      rbin <= rbin_nxt;
      rgray <= rbin_nxt ^ (rbin_nxt >> 1);
      {wgray_r2, wgray_r1} <= {wgray_r1, wgray};
    end

  assign empty = (rgray == wgray_r2);
  assign full  = (wgray == {~rgray_w2[AW:AW-1], rgray_w2[AW-2:0]});
endmodule`,
 why:["Only Gray-coded pointers cross the clock boundary, so a sample taken mid-change is either the old or the new value. The synchronized pointer lags, which can only make the FIFO look fuller (to the writer) or emptier (to the reader): always safe. The full test inverts the top two Gray bits because in Gray code the 'one lap ahead' pattern differs in both."]},
{id:'rtl-16', d:'H', lang:'verilog', area:'RTL design', title:'Valid/ready skid buffer',
 p:["Write `skid_buffer`: a pipeline register between an upstream (`s_valid`, `s_ready`, `s_data`) and a downstream (`m_valid`, `m_ready`, `m_data`) valid/ready interface. `s_ready` must come from a flip-flop (not combinationally from `m_ready`), no data may be lost or duplicated, and full throughput must be possible."],
 starter:`module skid_buffer #(parameter W = 8) (
  input  wire         clk, rst_n,
  input  wire         s_valid,
  output wire         s_ready,
  input  wire [W-1:0] s_data,
  output wire         m_valid,
  input  wire         m_ready,
  output wire [W-1:0] m_data
);
  // your code
endmodule`,
 hints:["Because s_ready is registered, the upstream may send one more word in the cycle the downstream stalls. You need somewhere to park it.", "Keep an output register plus one extra 'skid' register.", "s_ready = the skid register is empty."],
 sol:`module skid_buffer #(parameter W = 8) (
  input  wire         clk, rst_n,
  input  wire         s_valid,
  output wire         s_ready,
  input  wire [W-1:0] s_data,
  output wire         m_valid,
  input  wire         m_ready,
  output wire [W-1:0] m_data
);
  reg         full;          // skid register holds a word
  reg [W-1:0] skid;
  reg         out_valid;
  reg [W-1:0] out_data;
  assign s_ready = !full;
  assign m_valid = out_valid;
  assign m_data  = out_data;
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      full <= 1'b0; out_valid <= 1'b0;
    end else if (!out_valid || m_ready) begin      // output register can take a word
      if (full) begin
        out_data <= skid; out_valid <= 1'b1; full <= 1'b0;
      end else begin
        out_data <= s_data; out_valid <= s_valid;
      end
    end else if (s_valid && s_ready) begin         // output stalled: park the word
      skid <= s_data; full <= 1'b1;
    end
  end
endmodule`,
 why:["Registering `s_ready` breaks the long combinational ready path that would otherwise run backward through every pipeline stage. The price is one extra register to catch the word already in flight when the stall arrives. This pattern appears in nearly every high-speed datapath."]},

// ---------------- Verification (SystemVerilog, cocotb) ----------------
{id:'ver-01', d:'E', lang:'sv', area:'Verification', title:'Self-checking testbench for an adder',
 p:["`adder8` has inputs `a`, `b` (8 bits) and output `sum` (9 bits). Write `tb_adder8` that checks the corner cases 0+0, 255+1 and 255+255, then 10,000 random pairs, counts mismatches and prints the total."],
 starter:`module tb_adder8;
  logic [7:0] a, b;
  logic [8:0] sum;
  adder8 dut (.a(a), .b(b), .sum(sum));
  // your code
endmodule`,
 hints:["Write a task that drives inputs, waits a moment, and compares against `x + y`.", "Use `!==` so X and Z outputs count as failures.", "`$urandom` gives random 32-bit values; assigning to 8 bits keeps the low byte."],
 sol:`module tb_adder8;
  logic [7:0] a, b;
  logic [8:0] sum;
  int errors = 0;
  adder8 dut (.a(a), .b(b), .sum(sum));

  task automatic check(input logic [7:0] x, y);
    a = x; b = y;
    #1;                                    // let the combinational logic settle
    if (sum !== x + y) begin               // reference model: the + operator in 9 bits
      errors++;
      $display("FAIL: %0d + %0d gave %0d", x, y, sum);
    end
  endtask

  initial begin
    check(8'd0, 8'd0);
    check(8'd255, 8'd1);
    check(8'd255, 8'd255);
    repeat (10000) check($urandom, $urandom);
    $display("%0d errors", errors);
    $finish;
  end
endmodule`,
 why:["The comparison is 9 bits wide because `sum` is 9 bits, so `x + y` keeps its carry. Corner cases go first: they are where bugs live. The final count lets a regression script decide pass or fail without reading waveforms."]},
{id:'ver-02', d:'M', lang:'sv', area:'Verification', title:'Assertions for an arbiter',
 p:["Write a checker module `arb_checks` (inputs `clk`, `rst_n`, `req[3:0]`, `gnt[3:0]`) with SystemVerilog Assertions: (1) a grant only goes to a requester; (2) at most one grant at a time; (3) a requester that keeps requesting is granted within 4 cycles."],
 starter:`module arb_checks (input logic clk, rst_n, input logic [3:0] req, gnt);
  // your assertions
endmodule`,
 hints:["`(gnt & ~req) == 0` says no grant without a request.", "`$onehot0` is true for zero or one bits set.", "Use a `generate` loop for one liveness property per requester."],
 sol:`module arb_checks (input logic clk, rst_n, input logic [3:0] req, gnt);
  a_gnt_needs_req: assert property (@(posedge clk) disable iff (!rst_n)
                                    (gnt & ~req) == 4'b0000);
  a_one_grant:     assert property (@(posedge clk) disable iff (!rst_n)
                                    $onehot0(gnt));
  for (genvar i = 0; i < 4; i++) begin : g_live
    // if req[i] stays high, gnt[i] must arrive within 0 to 3 more cycles
    a_no_starve: assert property (@(posedge clk) disable iff (!rst_n)
                                  req[i] |-> req[i][*0:3] ##0 gnt[i]);
  end
endmodule`,
 why:["Bind the checker to the design (`bind rr_arb4 arb_checks u_chk (.*);`) and the rules are checked in every test, and formal tools can try to prove them. `disable iff` turns checking off during reset. Writing the property forces you to state precisely what 'no starvation' means."]},
{id:'ver-03', d:'M', lang:'sv', area:'Verification', title:'Functional coverage for a FIFO',
 p:["Write a covergroup `fifo_cg`, sampled every clock, that records whether the FIFO level was empty, in the middle, and full; all four combinations of `wr_en` and `rd_en`; and specifically a write and a read in the same cycle while full."],
 starter:`// signals available: clk, count (0..DEPTH), wr_en, rd_en, full
covergroup fifo_cg @(posedge clk);
  // your coverpoints
endgroup`,
 hints:["Use bins on `count` for 0, 1..DEPTH-1 and DEPTH.", "`cross` two coverpoints to get all combinations.", "A coverpoint on an expression can target one specific scenario."],
 sol:`covergroup fifo_cg @(posedge clk);
  level: coverpoint count {
    bins empty  = {0};
    bins middle = {[1:DEPTH-1]};
    bins full   = {DEPTH};
  }
  wr: coverpoint wr_en;
  rd: coverpoint rd_en;
  ops: cross wr, rd;                                  // all four write/read combinations
  rw_while_full: coverpoint (full && wr_en && rd_en) {
    bins hit = {1};
  }
endgroup
fifo_cg cg = new();`,
 why:["Coverage answers 'did my tests reach the scenarios that matter?' Random tests rarely fill a deep FIFO; a coverage hole on the `full` bin tells you to bias the stimulus (more writes than reads). Code coverage would never show this gap."]},
{id:'ver-04', d:'M', lang:'sv', area:'Verification', title:'Constrained-random packets',
 p:["Write a class `packet` with random fields `len` (8 bits), `addr` (32 bits) and `corrupt` (1 bit). Constraints: length 1 to 64; address word-aligned; about 10% of packets corrupt; a packet never crosses a 4 KB page."],
 starter:`class packet;
  // your fields and constraints
endclass`,
 hints:["`inside {[1:64]}` limits a range.", "`dist` sets relative weights.", "Not crossing a page: the address offset within the page plus the length must not exceed 4096."],
 sol:`class packet;
  rand bit [7:0]  len;
  rand bit [31:0] addr;
  rand bit        corrupt;
  constraint c_len     { len inside {[1:64]}; }
  constraint c_align   { addr[1:0] == 2'b00; }
  constraint c_corrupt { corrupt dist {1 := 1, 0 := 9}; }        // about 10% bad
  constraint c_page    { addr[11:0] + len <= 13'd4096; }        // stays inside one 4 KB page
endclass

// use:  packet p = new();  repeat (100) begin  assert(p.randomize());  drive(p);  end`,
 why:["The solver picks random values that satisfy every constraint at once. The 13-bit constant makes the sum 13 bits wide so it cannot wrap. Constraints keep stimulus legal; `dist` and extra constraints steer it toward interesting cases."]},
{id:'ver-05', d:'H', lang:'sv', area:'Verification', title:'FIFO testbench with a queue reference model',
 p:["Write `tb_fifo` for the `sync_fifo` (depth 8, registered `dout`). Drive random writes and reads for 2,000 cycles, keep a SystemVerilog queue as the reference model, and check every value read."],
 starter:`module tb_fifo;
  logic clk = 0, rst_n = 0, wr_en = 0, rd_en = 0;
  logic [7:0] din, dout;
  logic full, empty;
  sync_fifo dut (.*);
  always #5 clk = ~clk;
  // your code
endmodule`,
 hints:["Mirror every accepted write with `push_back` and every accepted read with `pop_front`.", "dout is registered, so compare it one cycle after the read.", "Change inputs on the falling edge to avoid races with the design."],
 sol:`module tb_fifo;
  logic clk = 0, rst_n = 0, wr_en = 0, rd_en = 0;
  logic [7:0] din, dout;
  logic full, empty;
  logic [7:0] model[$];                  // reference model: a queue
  logic [7:0] expected;
  logic       check_next = 0;
  int errors = 0;
  sync_fifo dut (.*);
  always #5 clk = ~clk;

  always @(posedge clk) begin
    if (check_next && dout !== expected) begin
      errors++;
      $display("FAIL at %0t: got %0h, expected %0h", $time, dout, expected);
    end
    check_next <= 1'b0;
    if (rst_n) begin
      if (rd_en && !empty) begin expected <= model.pop_front(); check_next <= 1'b1; end
      if (wr_en && !full)  model.push_back(din);
    end
  end

  initial begin
    repeat (2) @(posedge clk);
    rst_n = 1;
    repeat (2000) begin
      @(negedge clk);
      wr_en = $urandom_range(0, 1);
      rd_en = $urandom_range(0, 1);
      din   = $urandom;
    end
    $display("%0d errors, %0d words left", errors, model.size());
    $finish;
  end
endmodule`,
 why:["The queue is a trivially correct FIFO, so any difference is a design bug. Checking one cycle later matches the registered output. Extend it by also comparing `empty` and `full` against `model.size()`, and add the covergroup from the coverage problem to prove the full case was reached."]},
{id:'ver-06', d:'M', lang:'python', area:'Verification', title:'cocotb test for a counter',
 p:["Write a cocotb test (Python) for `counter4` (`clk`, `rst`, `en`, `q`): start a 10 ns clock, reset for one cycle, enable counting, and check `q` for 20 cycles including the wrap from 15 to 0. (Run it with a simulator such as Icarus Verilog or Verilator; it cannot run in the browser.)"],
 starter:`import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, ReadOnly

@cocotb.test()
async def counts_up(dut):
    # your code
    pass`,
 hints:["`cocotb.start_soon(Clock(dut.clk, 10, units='ns').start())` starts the clock.", "After `await RisingEdge(dut.clk)`, wait for `ReadOnly()` before reading values updated on that edge.", "Expected value: the cycle number modulo 16."],
 sol:`import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, ReadOnly

@cocotb.test()
async def counts_up(dut):
    cocotb.start_soon(Clock(dut.clk, 10, units="ns").start())
    dut.rst.value = 1
    dut.en.value = 0
    await RisingEdge(dut.clk)
    dut.rst.value = 0
    dut.en.value = 1
    for expected in range(1, 21):
        await RisingEdge(dut.clk)
        await ReadOnly()                                   # values after this edge
        got = int(dut.q.value)
        assert got == expected % 16, f"cycle {expected}: q={got}, expected {expected % 16}"`,
 why:["cocotb drives a Verilog simulation from Python, so the reference model can be any Python code. It is popular for open-source flows and is a quick way to build self-checking tests without SystemVerilog classes."]},

// ---------------- C and C++ ----------------
{id:'c-01', d:'E', lang:'c', area:'C and C++', title:'Count the set bits',
 p:["Write `int popcount(unsigned int x)` returning the number of 1 bits in `x`, using the `x & (x - 1)` trick."],
 starter:`int popcount(unsigned int x) {
    /* your code */
}`,
 hints:["`x & (x - 1)` clears the lowest set bit.", "Count how many times you can do that before x is 0."],
 sol:`int popcount(unsigned int x) {
    int n = 0;
    while (x) {
        x &= x - 1;   /* clears the lowest set bit */
        n++;
    }
    return n;
}`,
 why:["The loop runs once per 1 bit, not once per bit. Hardware has a dedicated instruction (`__builtin_popcount` in GCC), and the same trick appears in parity and Hamming-distance problems."]},
{id:'c-02', d:'E', lang:'c', area:'C and C++', title:'Is it a power of two?',
 p:["Write `int is_pow2(unsigned int x)` that returns 1 if `x` is a power of two and 0 otherwise (0 is not a power of two)."],
 starter:`int is_pow2(unsigned int x) {
    /* your code */
}`,
 hints:["A power of two has exactly one 1 bit.", "Clearing the lowest set bit of such a number leaves 0."],
 sol:`int is_pow2(unsigned int x) {
    return x != 0 && (x & (x - 1)) == 0;
}`,
 why:["Cache sizes, FIFO depths and alignments are powers of two because masking replaces division: `addr & (size - 1)` is the offset when size is a power of two."]},
{id:'c-03', d:'E', lang:'c', area:'C and C++', title:'Reverse a linked list',
 p:["Given `struct node { int val; struct node *next; };`, write `struct node *reverse(struct node *head)` that reverses the list in place and returns the new head. (A linked-list problem was the coding question on your OA.)"],
 starter:`#include <stddef.h>

struct node { int val; struct node *next; };

struct node *reverse(struct node *head) {
    /* your code */
}`,
 hints:["Walk the list keeping a `prev` pointer.", "Save `next` before you overwrite `head->next`."],
 sol:`#include <stddef.h>

struct node { int val; struct node *next; };

struct node *reverse(struct node *head) {
    struct node *prev = NULL;
    while (head) {
        struct node *next = head->next;   /* save before overwriting */
        head->next = prev;
        prev = head;
        head = next;
    }
    return prev;                          /* the old tail */
}`,
 why:["O(n) time, O(1) extra space. Draw three boxes and trace the pointers once; interviewers often ask for the recursive version too."]},
{id:'c-04', d:'E', lang:'c', area:'C and C++', title:'Same 4 KB page?',
 p:["Write `int same_page(uint32_t a, uint32_t b)` that returns 1 if both addresses lie in the same 4 KB page. This was reported as an Ignite coding question."],
 starter:`#include <stdint.h>

int same_page(uint32_t a, uint32_t b) {
    /* your code */
}`,
 hints:["A 4 KB page has a 12-bit offset.", "Compare everything above the offset."],
 sol:`#include <stdint.h>

int same_page(uint32_t a, uint32_t b) {
    return (a >> 12) == (b >> 12);
}`,
 why:["0x12345FFF and 0x12346000 differ by 1 but are on different pages. `(a ^ b) < 4096` is an equivalent test."]},
{id:'c-05', d:'M', lang:'c', area:'C and C++', title:'Bit mask from lo to hi as hex',
 p:["Write `void mask_hex(int lo, int hi, char *out)` that writes a 32-bit mask with ones in bits lo..hi (inclusive, 0 ≤ lo ≤ hi ≤ 31) as `0x` plus 8 uppercase hex digits. Example: lo = 4, hi = 7 gives `0x000000F0`. Reported as an Ignite coding question."],
 starter:`#include <stdio.h>
#include <stdint.h>

void mask_hex(int lo, int hi, char *out) {   /* out has room for 11 bytes */
    /* your code */
}`,
 hints:["Width = hi − lo + 1; a run of `w` ones is (1 << w) − 1.", "When w = 32, `1u << 32` is undefined in C. Do the shift in 64 bits."],
 sol:`#include <stdio.h>
#include <stdint.h>

void mask_hex(int lo, int hi, char *out) {
    uint64_t width = (uint64_t)(hi - lo + 1);
    uint32_t mask  = (uint32_t)(((1ULL << width) - 1) << lo);
    sprintf(out, "0x%08X", mask);
}`,
 why:["Shifting a 32-bit value by 32 or more is undefined behaviour in C, a classic trap. Doing the arithmetic in 64 bits and truncating makes lo = 0, hi = 31 work."]},
{id:'c-06', d:'M', lang:'c', area:'C and C++', title:'Detect a cycle in a linked list',
 p:["Write `int has_cycle(struct node *head)` that returns 1 if the list loops back on itself, using O(1) extra memory."],
 starter:`struct node { int val; struct node *next; };

int has_cycle(struct node *head) {
    /* your code */
}`,
 hints:["Move one pointer one step and another two steps at a time.", "If there is a loop, the fast one eventually lands on the slow one."],
 sol:`struct node { int val; struct node *next; };

int has_cycle(struct node *head) {
    struct node *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return 1;
    }
    return 0;
}`,
 why:["Floyd's tortoise and hare: inside a loop, the gap shrinks by one each step, so they must meet. No hash set needed."]},
{id:'c-07', d:'M', lang:'c', area:'C and C++', title:'Merge two sorted lists',
 p:["Write `struct node *merge(struct node *a, struct node *b)` that merges two ascending lists into one ascending list by relinking nodes (no allocation)."],
 starter:`#include <stddef.h>

struct node { int val; struct node *next; };

struct node *merge(struct node *a, struct node *b) {
    /* your code */
}`,
 hints:["A dummy head node removes the special case for the first element.", "Append the smaller head each time; at the end attach whatever remains."],
 sol:`#include <stddef.h>

struct node { int val; struct node *next; };

struct node *merge(struct node *a, struct node *b) {
    struct node dummy = {0, NULL}, *tail = &dummy;
    while (a && b) {
        if (a->val <= b->val) { tail->next = a; a = a->next; }
        else                  { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = a ? a : b;
    return dummy.next;
}`,
 why:["`<=` keeps equal elements in their original order (a stable merge). This is the inner step of merge sort on lists."]},
{id:'c-08', d:'M', lang:'c', area:'C and C++', title:'Reverse the bits of a 32-bit word',
 p:["Write `uint32_t reverse_bits(uint32_t x)` so that bit 0 swaps with bit 31, bit 1 with bit 30, and so on, without a 32-iteration loop."],
 starter:`#include <stdint.h>

uint32_t reverse_bits(uint32_t x) {
    /* your code */
}`,
 hints:["Swap the two 16-bit halves, then the bytes within each half, then nibbles, pairs and single bits.", "Each step uses a mask like 0xFF00FF00."],
 sol:`#include <stdint.h>

uint32_t reverse_bits(uint32_t x) {
    x = (x >> 16) | (x << 16);
    x = ((x & 0xFF00FF00u) >> 8) | ((x & 0x00FF00FFu) << 8);
    x = ((x & 0xF0F0F0F0u) >> 4) | ((x & 0x0F0F0F0Fu) << 4);
    x = ((x & 0xCCCCCCCCu) >> 2) | ((x & 0x33333333u) << 2);
    x = ((x & 0xAAAAAAAAu) >> 1) | ((x & 0x55555555u) << 1);
    return x;
}`,
 why:["Five steps of swapping groups (16, 8, 4, 2, 1 bits) reverse everything: log₂ 32 steps, like a barrel shifter's layers. In hardware, bit reversal is free: it is just wiring."]},
{id:'c-09', d:'M', lang:'c', area:'C and C++', title:'Byte swap and endianness',
 p:["Write `uint32_t bswap32(uint32_t x)` that reverses the byte order, and `int is_little_endian(void)` that detects the machine's byte order at run time."],
 starter:`#include <stdint.h>

uint32_t bswap32(uint32_t x) {
    /* your code */
}

int is_little_endian(void) {
    /* your code */
}`,
 hints:["Move each byte with a shift and a mask.", "Store 1 in an integer and look at its first byte through a `uint8_t *`."],
 sol:`#include <stdint.h>

uint32_t bswap32(uint32_t x) {
    return  (x >> 24)
         | ((x >> 8)  & 0x0000FF00u)
         | ((x << 8)  & 0x00FF0000u)
         |  (x << 24);
}

int is_little_endian(void) {
    uint32_t one = 1;
    return *(uint8_t *)&one == 1;   /* the low byte is stored first */
}`,
 why:["x86 and most ARM systems are little-endian; network protocols are big-endian. Drivers and packet parsers swap bytes constantly."]},
{id:'c-10', d:'M', lang:'c', area:'C and C++', title:'Struct padding',
 p:["On a typical 64-bit machine (int 4 bytes, pointers 8 bytes, each aligned to its size), what does `sizeof` give for each struct, and how would you reorder `A` to shrink it? Write your answers as comments.",
   "`struct A { char a; int b; char c; };`  `struct B { char c; void *p; };`  `struct C { int b; char a; char c; };`"],
 starter:`/* sizeof(struct A) = ?
   sizeof(struct B) = ?
   sizeof(struct C) = ?
   smaller layout for A: ? */`,
 hints:["Each member starts at a multiple of its own size.", "The whole struct's size is rounded up to a multiple of its largest member's alignment."],
 sol:`/* struct A: a at 0, 3 bytes padding, b at 4..7, c at 8, 3 bytes tail padding -> 12
   struct B: c at 0, 7 bytes padding, p at 8..15                           -> 16
   struct C: b at 0..3, a at 4, c at 5, 2 bytes tail padding               -> 8
   Shrinking A: order members from largest to smallest alignment, which is
   exactly struct C (12 -> 8 bytes). */`,
 why:["The struct with a char and a pointer giving 16 was a reported assessment question. Padding matters in hardware register maps and packed network headers, where layout must match exactly."]},
{id:'c-11', d:'M', lang:'c', area:'C and C++', title:'Read-modify-write a hardware register',
 p:["A control register lives at address 0x40000000. Bit 0 enables the block; bits 6..4 select a mode. Write `void enable_with_mode(uint32_t mode)` that sets the mode and the enable bit without disturbing any other bit, reading and writing the register once each."],
 starter:`#include <stdint.h>

void enable_with_mode(uint32_t mode) {
    /* your code */
}`,
 hints:["Use a `volatile` pointer so the compiler cannot skip or reorder the accesses.", "Clear the field with a mask, then OR in the new value, shifted into place."],
 sol:`#include <stdint.h>

#define REG32(addr)       (*(volatile uint32_t *)(addr))
#define CTRL              REG32(0x40000000u)
#define BIT(n)            (1u << (n))
#define FIELD(lo, w)      (((1u << (w)) - 1u) << (lo))

void enable_with_mode(uint32_t mode) {
    uint32_t v = CTRL;                        /* read once */
    v &= ~FIELD(4, 3);                        /* clear the old mode */
    v |= (mode << 4) & FIELD(4, 3);           /* insert the new mode */
    v |= BIT(0);                              /* enable */
    CTRL = v;                                 /* write once */
}`,
 why:["`volatile` tells the compiler the location can change or has side effects, so every access really happens. Masking the inserted value stops an out-of-range `mode` from corrupting neighbouring bits."]},
{id:'c-12', d:'H', lang:'c', area:'C and C++', title:'Ring buffer (a FIFO in software)',
 p:["Implement a 16-entry byte ring buffer with `rb_init`, `rb_push` (returns false when full) and `rb_pop` (returns false when empty). Use free-running head and tail counters instead of a separate count."],
 starter:`#include <stdbool.h>
#include <stdint.h>

#define RB_SIZE 16   /* power of two */

typedef struct {
    uint8_t  data[RB_SIZE];
    uint32_t head, tail;
} ringbuf;

void rb_init(ringbuf *rb);
bool rb_push(ringbuf *rb, uint8_t v);
bool rb_pop(ringbuf *rb, uint8_t *v);`,
 hints:["head counts writes, tail counts reads; they only ever increase.", "Number of items = head − tail, which works even after the counters wrap (unsigned arithmetic).", "Index with `count & (RB_SIZE − 1)`."],
 sol:`#include <stdbool.h>
#include <stdint.h>

#define RB_SIZE 16

typedef struct {
    uint8_t  data[RB_SIZE];
    uint32_t head, tail;     /* free-running write and read counters */
} ringbuf;

void rb_init(ringbuf *rb)        { rb->head = rb->tail = 0; }
static bool rb_empty(const ringbuf *rb) { return rb->head == rb->tail; }
static bool rb_full(const ringbuf *rb)  { return rb->head - rb->tail == RB_SIZE; }

bool rb_push(ringbuf *rb, uint8_t v) {
    if (rb_full(rb)) return false;
    rb->data[rb->head++ & (RB_SIZE - 1)] = v;
    return true;
}

bool rb_pop(ringbuf *rb, uint8_t *v) {
    if (rb_empty(rb)) return false;
    *v = rb->data[rb->tail++ & (RB_SIZE - 1)];
    return true;
}`,
 why:["This is the hardware FIFO's 'extra pointer bit' idea taken to the limit: the counters have many extra bits, and unsigned subtraction gives the fill level. With one producer and one consumer (for example an interrupt and the main loop), it needs no lock as long as the counter updates are atomic."]},
{id:'cpp-01', d:'M', lang:'cpp', area:'C and C++', title:'k-th largest with a min-heap',
 p:["Write `int kth_largest(const std::vector<int>& v, int k)` in O(n log k) time. (A greedy problem using a heap was reported on the Ignite coding section.)"],
 starter:`#include <vector>

int kth_largest(const std::vector<int>& v, int k) {
    // your code
}`,
 hints:["Keep a min-heap holding the k largest values seen so far.", "When it grows past k, pop the smallest. The top is the answer."],
 sol:`#include <functional>
#include <queue>
#include <vector>

int kth_largest(const std::vector<int>& v, int k) {
    std::priority_queue<int, std::vector<int>, std::greater<int>> heap;   // min-heap
    for (int x : v) {
        heap.push(x);
        if ((int)heap.size() > k) heap.pop();     // drop the smallest
    }
    return heap.top();
}`,
 why:["`std::priority_queue` is a max-heap by default; `std::greater` turns it into a min-heap. The same pattern finds the k worst timing paths in a long report."]},
{id:'cpp-02', d:'H', lang:'cpp', area:'C and C++', title:'LRU cache in O(1)',
 p:["Implement `LRUCache(int capacity)` with `int get(int key)` (−1 if missing) and `void put(int key, int value)`, both O(1). When full, evict the least recently used key."],
 starter:`class LRUCache {
public:
    explicit LRUCache(int capacity);
    int get(int key);
    void put(int key, int value);
};`,
 hints:["A doubly linked list keeps usage order; a hash map finds a key's list node.", "`std::list::splice` moves a node to the front in O(1)."],
 sol:`#include <list>
#include <unordered_map>
#include <utility>

class LRUCache {
    int cap;
    std::list<std::pair<int, int>> items;     // front = most recently used
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> where;
public:
    explicit LRUCache(int capacity) : cap(capacity) {}

    int get(int key) {
        auto it = where.find(key);
        if (it == where.end()) return -1;
        items.splice(items.begin(), items, it->second);   // mark as most recent
        return it->second->second;
    }

    void put(int key, int value) {
        auto it = where.find(key);
        if (it != where.end()) {
            it->second->second = value;
            items.splice(items.begin(), items, it->second);
            return;
        }
        if ((int)items.size() == cap) {                   // evict least recent
            where.erase(items.back().first);
            items.pop_back();
        }
        items.emplace_front(key, value);
        where[key] = items.begin();
    }
};`,
 why:["This is the software version of a cache's replacement policy (Chapter 20). Real hardware approximates LRU (pseudo-LRU trees) because true LRU state grows quickly with associativity."]},
{id:'cpp-03', d:'H', lang:'cpp', area:'C and C++', title:'Event-driven simulation scheduler',
 p:["Write a `Scheduler` class for a discrete-event simulator: `schedule(delay, name)` adds an event at `now + delay`; `run()` processes events in time order (events at the same time in the order they were scheduled), setting `now` and printing `time: name`. This is how logic simulators advance time."],
 starter:`#include <string>

class Scheduler {
public:
    long now = 0;
    void schedule(long delay, const std::string& what);
    void run();
};`,
 hints:["Use a priority queue ordered by (time, sequence number).", "The sequence number breaks ties so equal-time events keep their order."],
 sol:`#include <iostream>
#include <queue>
#include <string>
#include <vector>

struct Event { long time; long seq; std::string what; };

struct Later {   // makes the priority_queue return the earliest event first
    bool operator()(const Event& a, const Event& b) const {
        return a.time != b.time ? a.time > b.time : a.seq > b.seq;
    }
};

class Scheduler {
    std::priority_queue<Event, std::vector<Event>, Later> q;
    long next_seq = 0;
public:
    long now = 0;
    void schedule(long delay, const std::string& what) {
        q.push({now + delay, next_seq++, what});
    }
    void run() {
        while (!q.empty()) {
            Event e = q.top();
            q.pop();
            now = e.time;
            std::cout << now << ": " << e.what << "\\n";
        }
    }
};`,
 why:["Verilog simulators keep exactly this kind of time-ordered queue, plus extra ordering regions within each time step (which is where blocking and nonblocking assignments differ). Performance models of GPUs and networks are built the same way."]},

// ---------------- Python (runs in the browser) ----------------
{id:'py-01', d:'E', lang:'python', area:'Python and MATLAB', title:'WNS and TNS from a timing report',
 p:["Each line is `path_name slack` (slack in ns, may be negative). Write `wns_tns(lines)` returning `[wns, tns]`: WNS is the most negative slack (0.0 if none are negative) and TNS is the sum of all negative slacks. Round both to 3 decimals."],
 ex:`wns_tns(["p1 0.05", "p2 -0.10", "p3 -0.25"])  ->  [-0.25, -0.35]
wns_tns(["a 0.2"])                          ->  [0.0, 0.0]`,
 starter:`def wns_tns(lines):
    # your code
    pass`,
 hints:["`line.split()` gives the name and the slack text; convert with `float`.", "Collect the negative slacks, then use `min` and `sum`."],
 sol:`def wns_tns(lines):
    neg = [float(line.split()[1]) for line in lines if float(line.split()[1]) < 0]
    if not neg:
        return [0.0, 0.0]
    return [round(min(neg), 3), round(sum(neg), 3)]`,
 why:["WNS tells you how far the worst path misses; TNS tells you how much work is left overall. Every timing-closure script starts by parsing reports like this."],
 run:{fn:'wns_tns', tests:[[[["p1 0.05", "p2 -0.10", "p3 -0.25"]], [-0.25, -0.35]], [[["a 0.2", "b 0.1"]], [0.0, 0.0]], [[[]], [0.0, 0.0]], [[["x -1.5"]], [-1.5, -1.5]], [[["u1/a->u2/d -0.012", "u3/q->u4/d -0.004", "u5 0.3"]], [-0.012, -0.016]]]}},
{id:'py-02', d:'E', lang:'python', area:'Python and MATLAB', title:'Two\'s complement bit string',
 p:["Write `twos(n, width)` returning the `width`-bit two's-complement representation of integer `n` as a string of 0s and 1s."],
 ex:`twos(-20, 8) -> "11101100"
twos(5, 4)   -> "0101"`,
 starter:`def twos(n, width):
    # your code
    pass`,
 hints:["Masking with (1 << width) − 1 maps negative numbers to their two's-complement pattern.", "`format(x, '08b')` pads with zeros; build the format string from `width`."],
 sol:`def twos(n, width):
    return format(n & ((1 << width) - 1), "0" + str(width) + "b")`,
 why:["Python integers are unbounded, so `-20 & 0xFF` is 236, exactly the 8-bit pattern of −20. Useful for building test vectors and decoding register dumps."],
 run:{fn:'twos', tests:[[[-20, 8], "11101100"], [[5, 4], "0101"], [[-1, 4], "1111"], [[-8, 4], "1000"], [[0, 3], "000"], [[255, 8], "11111111"]]}},
{id:'py-03', d:'E', lang:'python', area:'Python and MATLAB', title:'Count errors per module in a log',
 p:["Simulation log lines look like `ERROR [fifo] overflow at 120ns` or `INFO [alu] done`. Write `count_errors(lines)` returning a dict mapping each module name to its number of ERROR lines."],
 ex:`count_errors(["ERROR [fifo] x", "INFO [fifo] y", "ERROR [alu] z", "ERROR [fifo] w"])
  -> {"fifo": 2, "alu": 1}`,
 starter:`def count_errors(lines):
    # your code
    pass`,
 hints:["A regular expression `^ERROR \\[(\\w+)\\]` captures the module name.", "`collections.Counter` or a plain dict with `get` both work."],
 sol:`import re

def count_errors(lines):
    counts = {}
    for line in lines:
        m = re.match(r"ERROR \\[(\\w+)\\]", line)
        if m:
            counts[m.group(1)] = counts.get(m.group(1), 0) + 1
    return counts`,
 why:["Regression triage is mostly this: group thousands of failures by signature so you debug each root cause once."],
 run:{fn:'count_errors', tests:[[[["ERROR [fifo] x", "INFO [fifo] y", "ERROR [alu] z", "ERROR [fifo] w"]], {"fifo": 2, "alu": 1}], [[[]], {}], [[["WARNING [a] b"]], {}], [[["ERROR [dma_ctrl] timeout", "ERROR [dma_ctrl] bad id"]], {"dma_ctrl": 2}]]}},
{id:'py-04', d:'E', lang:'python', area:'Python and MATLAB', title:'Gray code sequence',
 p:["Write `gray_codes(n)` returning the list of all n-bit Gray codes as integers, in order, starting from 0."],
 ex:`gray_codes(2) -> [0, 1, 3, 2]`,
 starter:`def gray_codes(n):
    # your code
    pass`,
 hints:["The i-th Gray code is i XOR (i >> 1)."],
 sol:`def gray_codes(n):
    return [i ^ (i >> 1) for i in range(1 << n)]`,
 why:["Each value differs from the next in exactly one bit, the property that makes Gray-coded FIFO pointers safe to synchronize."],
 run:{fn:'gray_codes', tests:[[[1], [0, 1]], [[2], [0, 1, 3, 2]], [[3], [0, 1, 3, 2, 6, 7, 5, 4]], [[0], [0]]]}},
{id:'py-05', d:'M', lang:'python', area:'Python and MATLAB', title:'Recover an array from its prefix XORs',
 p:["`p[i]` is the XOR of `a[0]` through `a[i]`. Write `from_prefix_xor(p)` that returns the original array `a`. (Reported Ignite coding pattern.)"],
 ex:`from_prefix_xor([5, 7, 2]) -> [5, 2, 5]`,
 starter:`def from_prefix_xor(p):
    # your code
    pass`,
 hints:["XOR is its own inverse: p[i] XOR p[i−1] cancels everything before i."],
 sol:`def from_prefix_xor(p):
    return [p[i] ^ p[i - 1] if i else p[0] for i in range(len(p))]`,
 why:["Because x ⊕ x = 0, the shared prefix cancels and only a[i] remains. The same identity powers the next problem."],
 run:{fn:'from_prefix_xor', tests:[[[[5, 7, 2]], [5, 2, 5]], [[[]], []], [[[0, 0]], [0, 0]], [[[1, 3, 0, 4]], [1, 2, 3, 4]]]}},
{id:'py-06', d:'M', lang:'python', area:'Python and MATLAB', title:'Count subarrays with a given XOR',
 p:["Write `count_xor_subarrays(a, k)` returning how many contiguous subarrays of `a` have XOR equal to `k`, in O(n) time. (A 'bitwise XOR subarray' problem was reported on the Ignite coding section.)"],
 ex:`count_xor_subarrays([4, 2, 2, 6, 4], 6) -> 4`,
 starter:`def count_xor_subarrays(a, k):
    # your code
    pass`,
 hints:["Subarray (i..j) XOR = prefix[j] XOR prefix[i−1].", "Walk once, keeping a dictionary of how many times each prefix XOR has appeared.", "At each position, the number of earlier prefixes equal to (current XOR k) is the number of subarrays ending here."],
 sol:`def count_xor_subarrays(a, k):
    seen = {0: 1}          # the empty prefix
    x = 0
    count = 0
    for v in a:
        x ^= v
        count += seen.get(x ^ k, 0)
        seen[x] = seen.get(x, 0) + 1
    return count`,
 why:["Brute force is O(n²). With prefix XORs, a subarray XOR equals k exactly when two prefixes differ by k, so counting earlier prefixes in a hash map gives O(n)."],
 run:{fn:'count_xor_subarrays', tests:[[[[4, 2, 2, 6, 4], 6], 4], [[[5, 6, 7, 8, 9], 5], 2], [[[1, 1, 1], 0], 2], [[[], 3], 0], [[[3], 3], 1]]}},
{id:'py-07', d:'M', lang:'python', area:'Python and MATLAB', title:'FIFO depth calculator',
 p:["Write `fifo_depth(burst, f_write, f_read, read_every)` returning the minimum FIFO depth (an integer) for a burst of `burst` words written one per cycle at `f_write` MHz, while the reader at `f_read` MHz takes one word every `read_every` cycles. Return 0 if the reader keeps up."],
 ex:`fifo_depth(120, 100, 50, 1)  -> 60
fifo_depth(100, 200, 100, 2) -> 75`,
 starter:`def fifo_depth(burst, f_write, f_read, read_every):
    # your code
    pass`,
 hints:["Words read during the burst = burst × (f_read / read_every) / f_write.", "Avoid floating-point rounding surprises: use `fractions.Fraction`, then round up with `math.ceil`."],
 sol:`from fractions import Fraction
from math import ceil

def fifo_depth(burst, f_write, f_read, read_every):
    read_during = Fraction(burst) * Fraction(f_read, read_every) / f_write
    return max(0, ceil(burst - read_during))`,
 why:["Depth = B(1 − r_r/r_w) from Chapter 19. Exact fractions matter: 120 − 59.99999999999999 rounds up to 61 if you are unlucky with floats."],
 run:{fn:'fifo_depth', tests:[[[120, 100, 50, 1], 60], [[100, 200, 100, 2], 75], [[300, 150, 100, 1], 100], [[64, 50, 100, 4], 32], [[10, 100, 200, 1], 0], [[7, 100, 30, 1], 5]]}},
{id:'py-08', d:'M', lang:'python', area:'Python and MATLAB', title:'Parse a Verilog port list',
 p:["Write `parse_ports(src)` for an ANSI-style module header (one line). Return a list of `[direction, width, name]`, where width comes from `[msb:lsb]` (1 if absent). A name without its own direction inherits the previous one."],
 ex:`parse_ports("module m(input wire clk, rst_n, input wire [7:0] a, b, output reg [3:0] q);")
  -> [["input", 1, "clk"], ["input", 1, "rst_n"], ["input", 8, "a"], ["input", 8, "b"], ["output", 4, "q"]]`,
 starter:`def parse_ports(src):
    # your code
    pass`,
 hints:["Take the text between the first '(' and the last ')' and split on commas.", "If a piece starts with input/output/inout, update the current direction and width.", "The name is the last word of each piece."],
 sol:`import re

def parse_ports(src):
    body = src[src.index("(") + 1 : src.rindex(")")]
    ports, direction, width = [], None, 1
    for piece in body.split(","):
        piece = piece.strip()
        m = re.match(r"(input|output|inout)\\b", piece)
        if m:
            direction = m.group(1)
            r = re.search(r"\\[(\\d+)\\s*:\\s*(\\d+)\\]", piece)
            width = abs(int(r.group(1)) - int(r.group(2))) + 1 if r else 1
        ports.append([direction, width, piece.split()[-1]])
    return ports`,
 why:["Hardware teams write small parsers like this to generate testbench wrappers, register maps and documentation from RTL. Real code should use a proper parser (for example pyslang) for full Verilog."],
 run:{fn:'parse_ports', tests:[[["module m(input wire clk, rst_n, input wire [7:0] a, b, output reg [3:0] q);"], [["input", 1, "clk"], ["input", 1, "rst_n"], ["input", 8, "a"], ["input", 8, "b"], ["output", 4, "q"]]], [["module n(output logic done);"], [["output", 1, "done"]]], [["module p(inout wire [15:0] bus, input en);"], [["inout", 16, "bus"], ["input", 1, "en"]]]]}},
{id:'py-09', d:'M', lang:'python', area:'Python and MATLAB', title:'Branch predictor accuracy',
 p:["Simulate one 2-bit saturating counter (0 and 1 predict not taken, 2 and 3 predict taken), starting at 1. For a trace of outcomes (`True` = taken), write `predictor_hits(trace)` returning how many predictions were correct."],
 ex:`predictor_hits([True, True, True, True]) -> 3`,
 starter:`def predictor_hits(trace):
    # your code
    pass`,
 hints:["Predict first, then update: taken → counter + 1 (max 3), not taken → counter − 1 (min 0)."],
 sol:`def predictor_hits(trace):
    counter, hits = 1, 0
    for taken in trace:
        if (counter >= 2) == taken:
            hits += 1
        counter = min(3, counter + 1) if taken else max(0, counter - 1)
    return hits`,
 why:["Architecture teams evaluate ideas exactly this way: run a trace through a model before building hardware. Note how alternating branches defeat this simple predictor."],
 run:{fn:'predictor_hits', tests:[[[[true, true, true, true]], 3], [[[true, false, true, false, true, false]], 0], [[[false, false, true, false]], 3], [[[]], 0]]}},
{id:'py-10', d:'H', lang:'python', area:'Python and MATLAB', title:'Direct-mapped cache simulator',
 p:["Write `direct_mapped(addresses, cache_bytes, line_bytes)` returning `[hits, misses]` for a direct-mapped cache that starts empty. Sizes are powers of two."],
 ex:`direct_mapped([0, 4, 64, 0], 64, 16) -> [1, 3]`,
 starter:`def direct_mapped(addresses, cache_bytes, line_bytes):
    # your code
    pass`,
 hints:["line number = address // line_bytes; index = line % number_of_lines; tag = line // number_of_lines.", "Keep a list of stored tags per index (None when empty)."],
 sol:`def direct_mapped(addresses, cache_bytes, line_bytes):
    lines = cache_bytes // line_bytes
    tags = [None] * lines
    hits = misses = 0
    for addr in addresses:
        line = addr // line_bytes
        index, tag = line % lines, line // lines
        if tags[index] == tag:
            hits += 1
        else:
            misses += 1
            tags[index] = tag
    return [hits, misses]`,
 why:["Addresses 0 and 64 map to the same index in a 64-byte cache, so they evict each other: a conflict miss. Adding associativity fixes that. Extend this to set-associative with LRU for practice."],
 run:{fn:'direct_mapped', tests:[[[[0, 4, 64, 0], 64, 16], [1, 3]], [[[0, 16, 32, 48, 0, 16], 64, 16], [2, 4]], [[[], 64, 16], [0, 0]], [[[0, 128, 0, 128], 128, 32], [0, 4]], [[[0, 1, 2, 3, 32, 33], 64, 32], [4, 2]]]}},
{id:'py-11', d:'H', lang:'python', area:'Python and MATLAB', title:'Find a combinational loop',
 p:["A netlist is a dict mapping each gate name to the list of its input names (names not in the dict are primary inputs). Write `has_loop(gates)` returning True if there is a combinational cycle. Lint and timing tools must find these."],
 ex:`has_loop({"a": ["x"], "b": ["a"]}) -> False
has_loop({"a": ["b"], "b": ["a"]}) -> True`,
 starter:`def has_loop(gates):
    # your code
    pass`,
 hints:["Depth-first search with three colours: unvisited, on the current path, finished.", "Reaching a gate that is on the current path means a cycle."],
 sol:`def has_loop(gates):
    state = {}                      # missing = unvisited, 1 = on path, 2 = done
    def visit(g):
        if g not in gates or state.get(g) == 2:
            return False
        if state.get(g) == 1:
            return True
        state[g] = 1
        if any(visit(i) for i in gates[g]):
            return True
        state[g] = 2
        return False
    return any(visit(g) for g in gates)`,
 why:["A combinational loop has no stable timing and can oscillate (a ring oscillator is one on purpose). Static timing analysis requires an acyclic graph, which is why tools report and break loops first."],
 run:{fn:'has_loop', tests:[[[{"a": ["x"], "b": ["a"]}], false], [[{"a": ["b"], "b": ["a"]}], true], [[{"g1": ["in1", "g3"], "g2": ["g1"], "g3": ["g2"]}], true], [[{}], false], [[{"a": ["a"]}], true], [[{"a": ["i"], "b": ["a", "i"], "c": ["a", "b"]}], false]]}},
{id:'py-12', d:'H', lang:'python', area:'Python and MATLAB', title:'Longest path: static timing on a netlist',
 p:["Given `gates` (name → list of inputs; non-gate names are primary inputs arriving at time 0) and `delays` (name → gate delay), write `latest_arrival(gates, delays)` returning the latest output arrival time of any gate: the critical path delay."],
 ex:`latest_arrival({"g1": ["a", "b"], "g2": ["g1", "c"], "g3": ["g1"]}, {"g1": 2, "g2": 3, "g3": 1}) -> 5`,
 starter:`def latest_arrival(gates, delays):
    # your code
    pass`,
 hints:["arrival(g) = max(arrival of its inputs) + delay(g); primary inputs are 0.", "Memoize so each gate is computed once (a topological order works too)."],
 sol:`from functools import lru_cache

def latest_arrival(gates, delays):
    @lru_cache(maxsize=None)
    def arrival(name):
        if name not in gates:
            return 0
        return max((arrival(i) for i in gates[name]), default=0) + delays[name]
    return max((arrival(g) for g in gates), default=0)`,
 why:["This is the core of static timing analysis: arrival times propagate forward through the graph, and the latest arrival at a flip-flop compared with the clock period gives the slack."],
 run:{fn:'latest_arrival', tests:[[[{"g1": ["a", "b"], "g2": ["g1", "c"], "g3": ["g1"]}, {"g1": 2, "g2": 3, "g3": 1}], 5], [[{"x": ["i"]}, {"x": 7}], 7], [[{"n1": ["i1"], "n2": ["i2"], "n3": ["n1", "n2"], "n4": ["n3", "n1"]}, {"n1": 1, "n2": 4, "n3": 2, "n4": 3}], 9], [[{}, {}], 0]]}},

// ---------------- Linux and scripting ----------------
{id:'sh-01', d:'E', lang:'bash', area:'Linux and scripting', title:'Count lines of SystemVerilog',
 p:["From the top of a project, print the total number of lines in all `.sv` files in every subdirectory."],
 starter:`# your command`,
 hints:["`find . -name '*.sv'` lists the files.", "`wc -l` counts lines; pass all files at once with `-exec ... +` or `xargs`."],
 sol:`find . -name '*.sv' -exec cat {} + | wc -l

# or, per file plus a total:
find . -name '*.sv' -print0 | xargs -0 wc -l`,
 why:["`-exec ... +` passes many files per command, much faster than one process per file. `-print0` with `xargs -0` handles file names containing spaces."]},
{id:'sh-02', d:'E', lang:'bash', area:'Linux and scripting', title:'Failing tests in a regression log',
 p:["`regress.log` contains lines like `TEST fifo_basic PASSED` and `TEST arb_random FAILED seed=42`. Print the unique names of failing tests, sorted, and then how many there are."],
 starter:`# your commands`,
 hints:["`grep FAILED` selects the lines; `awk '{print $2}'` takes the second field.", "`sort -u` removes duplicates; `wc -l` counts."],
 sol:`grep 'FAILED' regress.log | awk '{print $2}' | sort -u
grep 'FAILED' regress.log | awk '{print $2}' | sort -u | wc -l`,
 why:["Pipes connect small tools into a query. The same test can fail with many seeds, so `sort -u` shows each test once."]},
{id:'sh-03', d:'E', lang:'bash', area:'Linux and scripting', title:'A daily git workflow',
 p:["Write the commands to: create and switch to a branch `fix-fifo-full`; stage and commit your changes with a message; push the branch to `origin` for the first time; and undo the last commit while keeping its changes in your working tree."],
 starter:`# your commands`,
 hints:["`git switch -c` (or `git checkout -b`) creates a branch.", "`git push -u origin branch` sets the upstream.", "`git reset --soft HEAD~1` moves the branch back but keeps changes."],
 sol:`git switch -c fix-fifo-full
git add -A
git commit -m "Fix FIFO full flag when reading and writing while full"
git push -u origin fix-fifo-full
git reset --soft HEAD~1      # undo the commit, keep the changes staged`,
 why:["Hardware RTL lives in git (or Perforce) like software. Small, well-described commits on branches, reviewed before merging, are how chip teams keep thousands of engineers from breaking each other's work."]},
{id:'sh-04', d:'M', lang:'bash', area:'Linux and scripting', title:'Negative-slack paths with awk',
 p:["`report.txt` has lines `startpoint endpoint slack`. Print only paths with negative slack, most negative first, then print `TNS` (sum of negative slacks) on its own line."],
 starter:`# your commands`,
 hints:["`awk '$3 < 0'` filters; `sort -k3,3n` sorts numerically on the third field.", "In awk, accumulate in a variable and print it in an `END` block."],
 sol:`awk '$3 < 0' report.txt | sort -k3,3n
awk '$3 < 0 { tns += $3 } END { printf "TNS %.3f\\n", tns }' report.txt`,
 why:["awk treats each line as fields ($1, $2, ...) and is perfect for column reports. `-k3,3n` restricts the sort key to field 3 and compares numerically, so −0.5 sorts before −0.05."]},
{id:'sh-05', d:'M', lang:'bash', area:'Linux and scripting', title:'Rename a signal across RTL files',
 p:["Rename the signal `data_in` to `din` in every `.sv` file under `rtl/`, matching whole words only (do not touch `data_in_valid`), keeping a `.bak` backup of each file."],
 starter:`# your command`,
 hints:["Word boundaries: `\\b` in Perl regular expressions.", "`perl -pi.bak -e 's/old/new/g' files` edits in place with a backup and works the same on Linux and macOS."],
 sol:`perl -pi.bak -e 's/\\bdata_in\\b/din/g' $(find rtl -name '*.sv')

# GNU sed (Linux only) equivalent:
# sed -i.bak 's/\\bdata_in\\b/din/g' $(find rtl -name '*.sv')`,
 why:["`\\b` stops the match at word edges, so `data_in_valid` survives. Always diff before deleting backups, or better, rely on git: `git diff` shows exactly what changed."]},
{id:'sh-06', d:'M', lang:'bash', area:'Linux and scripting', title:'Run a simulation over many seeds',
 p:["Write a Bash script that runs `./simv +ntb_random_seed=SEED` for seeds 1 to 20, saving each log in `logs/`. A run passes if the simulator exits with status 0 and its log contains `0 errors`. Print each failing seed and a final pass/fail count."],
 starter:`#!/usr/bin/env bash
# your script`,
 hints:["`mkdir -p logs` first.", "Redirect both stdout and stderr: `> file 2>&1`.", "Combine the exit status and `grep -q` with `&&`."],
 sol:`#!/usr/bin/env bash
set -u
mkdir -p logs
pass=0
fail=0
for seed in $(seq 1 20); do
  log="logs/seed_$seed.log"
  if ./simv +ntb_random_seed="$seed" > "$log" 2>&1 && grep -q "0 errors" "$log"; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    echo "seed $seed FAILED (see $log)"
  fi
done
echo "passed $pass, failed $fail"
[ "$fail" -eq 0 ]          # script exit status: success only if all passed`,
 why:["This is a tiny regression runner. Checking the log as well as the exit code catches tests that end 'successfully' but report errors. The final test sets the script's own exit status, so a CI system can use it."]},
{id:'sh-07', d:'M', lang:'bash', area:'Linux and scripting', title:'A Makefile for simulation',
 p:["Write a Makefile with targets `sim` (compile `rtl/*.sv` and `tb/*.sv` with Icarus Verilog into `build/sim.vvp` and run it), `lint` (run Verilator lint on the RTL) and `clean`. `sim` should recompile only when a source file changed."],
 starter:`# your Makefile`,
 hints:["A rule is `target: prerequisites` followed by recipe lines that start with a TAB.", "`$(wildcard rtl/*.sv)` lists files; `$@` is the target and `$^` all prerequisites.", "Mark targets that are not files as `.PHONY`."],
 sol:`SRC := $(wildcard rtl/*.sv) $(wildcard tb/*.sv)

.PHONY: sim lint clean

sim: build/sim.vvp
\tvvp build/sim.vvp

build/sim.vvp: $(SRC)
\tmkdir -p build
\tiverilog -g2012 -o $@ $^

lint:
\tverilator --lint-only -Wall $(wildcard rtl/*.sv)

clean:
\trm -rf build`,
 why:["make compares timestamps: `build/sim.vvp` is rebuilt only if a source is newer. Recipe lines must start with a real TAB character. Chip projects use make (or similar) to tie together lint, simulation, synthesis and reports."]},
{id:'tcl-01', d:'E', lang:'tcl', area:'Physical design', title:'Tcl basics: a utilization proc',
 p:["Write a Tcl procedure `utilization` that takes a list of cell areas and the core area, and returns the utilization percentage. Print it for areas {12.5 30 7.5} and core area 100 as `50.0%`."],
 starter:`proc utilization {areas core_area} {
    # your code
}`,
 hints:["`set` assigns, `$name` reads, `foreach` loops over a list.", "Arithmetic goes inside `expr {...}` (the braces make it fast and safe)."],
 sol:`proc utilization {areas core_area} {
    set total 0.0
    foreach a $areas {
        set total [expr {$total + $a}]
    }
    return [expr {100.0 * $total / $core_area}]
}
puts [format "%.1f%%" [utilization {12.5 30 7.5} 100]]`,
 why:["Tcl is the scripting language of most EDA tools (synthesis, place and route, timing). Everything is a string; square brackets run a command and substitute its result."]},
{id:'tcl-02', d:'M', lang:'tcl', area:'Physical design', title:'Timing constraints in SDC',
 p:["Write SDC constraints: a 1 GHz clock `clk` on port `clk`; 0.2 ns input delay on every input except the clock and 0.2 ns output delay on every output; a second clock `clk_b` at 400 MHz that is asynchronous to `clk`; and a 2-cycle multicycle path from cells `u_slow/*` to `u_acc/*` (with the matching hold adjustment)."],
 starter:`# your SDC`,
 hints:["`create_clock -period` takes nanoseconds.", "`set_clock_groups -asynchronous` stops timing between unrelated clocks.", "A setup multicycle of 2 normally needs a hold multicycle of 1."],
 sol:`create_clock -name clk   -period 1.0 [get_ports clk]
create_clock -name clk_b -period 2.5 [get_ports clk_b]

set_input_delay  0.2 -clock clk [remove_from_collection [all_inputs] [get_ports {clk clk_b}]]
set_output_delay 0.2 -clock clk [all_outputs]

set_clock_groups -asynchronous -group {clk} -group {clk_b}

set_multicycle_path 2 -setup -from [get_cells u_slow/*] -to [get_cells u_acc/*]
set_multicycle_path 1 -hold  -from [get_cells u_slow/*] -to [get_cells u_acc/*]`,
 why:["SDC (Synopsys Design Constraints, a Tcl dialect) tells synthesis and timing tools what 'fast enough' means. Wrong constraints are a top cause of silicon bugs: an unconstrained path is never checked, and a missing clock-group hides real CDC problems. The hold multicycle of 1 moves the hold check back to the usual edge."]},
{id:'tcl-03', d:'M', lang:'tcl', area:'Physical design', title:'Report the worst paths in a timing tool',
 p:["In a PrimeTime-style Tcl shell, write a loop that prints the startpoint, endpoint and slack of the 100 worst paths with negative slack, one per line in aligned columns."],
 starter:`# your script`,
 hints:["`get_timing_paths -max_paths 100 -slack_lesser_than 0` returns a collection.", "Iterate collections with `foreach_in_collection`, and read attributes with `get_attribute`."],
 sol:`set paths [get_timing_paths -max_paths 100 -slack_lesser_than 0]
foreach_in_collection p $paths {
    set sp [get_object_name [get_attribute $p startpoint]]
    set ep [get_object_name [get_attribute $p endpoint]]
    set sl [get_attribute $p slack]
    puts [format "%-40s %-40s %8.3f" $sp $ep $sl]
}`,
 why:["Engineers script reports like this to sort failures by block, find common startpoints, and track progress across runs. Command names differ slightly between tools (OpenSTA, Tempus), but the pattern is the same."]},
{id:'pl-01', d:'M', lang:'perl', area:'Linux and scripting', title:'Perl: errors per module',
 p:["Write a Perl script that reads a log from standard input (or files given on the command line), counts lines starting with `ERROR [module]` per module, and prints each module and count, largest first."],
 starter:`#!/usr/bin/env perl
use strict;
use warnings;
# your code`,
 hints:["`while (my $line = <>)` reads every input line.", "A regex capture `/^ERROR\\s+\\[(\\w+)\\]/` puts the module in `$1`.", "Hashes count things: `$count{$1}++`."],
 sol:`#!/usr/bin/env perl
use strict;
use warnings;

my %count;
while (my $line = <>) {
    $count{$1}++ if $line =~ /^ERROR\\s+\\[(\\w+)\\]/;
}
for my $mod (sort { $count{$b} <=> $count{$a} } keys %count) {
    printf "%-16s %d\\n", $mod, $count{$mod};
}`,
 why:["Many older chip flows are glued together with Perl, and the posting lists it. The same task in Python or awk is just as common today; knowing one regex-heavy scripting language well transfers to the others."]},
// ---------------- GPU and CUDA ----------------
{id:'cu-01', d:'E', lang:'cuda', area:'GPU and CUDA', title:'Vector add kernel',
 p:["Write a CUDA kernel `vadd` computing `c[i] = a[i] + b[i]` for n elements, and the launch configuration using 256 threads per block."],
 starter:`__global__ void vadd(const float *a, const float *b, float *c, int n) {
    // your code
}

// launch:`,
 hints:["Global index = blockIdx.x × blockDim.x + threadIdx.x.", "Round the block count up and guard with `if (i < n)`."],
 sol:`__global__ void vadd(const float *a, const float *b, float *c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) c[i] = a[i] + b[i];
}

// launch: one thread per element
int threads = 256;
int blocks  = (n + threads - 1) / threads;
vadd<<<blocks, threads>>>(d_a, d_b, d_c, n);`,
 why:["Consecutive threads touch consecutive addresses, so loads coalesce. The kernel is memory-bound: about 1 FLOP per 12 bytes (Chapter 21)."]},
{id:'cu-02', d:'M', lang:'cuda', area:'GPU and CUDA', title:'Parallel sum with shared memory',
 p:["Write a kernel `block_sum` (256 threads per block) where each block sums 512 input elements and writes one partial sum to `out[blockIdx.x]`, using a tree reduction in shared memory."],
 starter:`__global__ void block_sum(const float *in, float *out, int n) {
    __shared__ float s[256];
    // your code
}`,
 hints:["Each thread first adds two elements, one blockDim.x apart.", "Halve the active threads each step: s[tid] += s[tid + stride].", "Call __syncthreads() after every step."],
 sol:`__global__ void block_sum(const float *in, float *out, int n) {
    __shared__ float s[256];
    int tid = threadIdx.x;
    int i   = blockIdx.x * blockDim.x * 2 + tid;
    float v = 0.0f;
    if (i < n)              v  = in[i];
    if (i + blockDim.x < n) v += in[i + blockDim.x];
    s[tid] = v;
    __syncthreads();
    for (int stride = blockDim.x / 2; stride > 0; stride >>= 1) {
        if (tid < stride) s[tid] += s[tid + stride];
        __syncthreads();
    }
    if (tid == 0) out[blockIdx.x] = s[0];
}`,
 why:["log₂ 256 = 8 steps instead of 255 sequential additions. A second launch (or atomics) combines the partial sums. Because floating-point addition is not associative (Chapter 22), the result can differ in the last bits from a CPU loop."]},
{id:'cu-03', d:'H', lang:'cuda', area:'GPU and CUDA', title:'Tiled matrix multiply',
 p:["Write `matmul` for N×N row-major matrices (C = A × B) using 16×16 tiles in shared memory, launched with 16×16 thread blocks. Handle N not divisible by 16."],
 starter:`#define TILE 16
__global__ void matmul(const float *A, const float *B, float *C, int N) {
    // your code
}`,
 hints:["Each block computes one 16×16 tile of C, looping over tiles of A's row band and B's column band.", "Load one A tile and one B tile into shared memory, sync, multiply, sync again.", "Pad out-of-range loads with 0."],
 sol:`#define TILE 16
__global__ void matmul(const float *A, const float *B, float *C, int N) {
    __shared__ float As[TILE][TILE], Bs[TILE][TILE];
    int row = blockIdx.y * TILE + threadIdx.y;
    int col = blockIdx.x * TILE + threadIdx.x;
    float acc = 0.0f;
    for (int t = 0; t < (N + TILE - 1) / TILE; ++t) {
        int ac = t * TILE + threadIdx.x;
        int br = t * TILE + threadIdx.y;
        As[threadIdx.y][threadIdx.x] = (row < N && ac < N) ? A[row * N + ac] : 0.0f;
        Bs[threadIdx.y][threadIdx.x] = (br < N && col < N) ? B[br * N + col] : 0.0f;
        __syncthreads();
        for (int k = 0; k < TILE; ++k)
            acc += As[threadIdx.y][k] * Bs[k][threadIdx.x];
        __syncthreads();
    }
    if (row < N && col < N) C[row * N + col] = acc;
}`,
 why:["Each value loaded from global memory is reused 16 times from shared memory, raising arithmetic intensity 16-fold. Tensor-core kernels (cuBLAS, CUTLASS) push the same idea much further."]},
{id:'ml-01', d:'E', lang:'matlab', area:'Python and MATLAB', title:'RC step response and rise time (MATLAB)',
 p:["In MATLAB (or Octave), plot the step response of an RC circuit with R = 1 kΩ and C = 1 pF, and measure its 10%–90% rise time. Compare with 2.2RC."],
 starter:`% your script`,
 hints:["v(t) = 1 − e^(−t/RC).", "`find(v >= 0.1, 1)` returns the first index where v reaches 10%."],
 sol:`R = 1e3; C = 1e-12; tau = R*C;
t = linspace(0, 5*tau, 1000);
v = 1 - exp(-t/tau);
t10 = t(find(v >= 0.1, 1));
t90 = t(find(v >= 0.9, 1));
fprintf('rise time = %.3g s (2.2 RC = %.3g s)\\n', t90 - t10, 2.2*tau);
plot(t*1e9, v); xlabel('time (ns)'); ylabel('V_{out} / V_s'); grid on;`,
 why:["The posting lists MATLAB; power, signal-integrity and analog teams use it for quick analysis. The measured rise time comes out at about 2.2 ns, matching 2.2RC from Chapter 2."]}
];
