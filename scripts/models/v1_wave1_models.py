from decimal import Decimal as D, ROUND_HALF_UP
def r(x, step): return int((D(x)/step).quantize(D('1'), rounding=ROUND_HALF_UP)*step)
def disp(lo, hi):
    lo_d = r(lo, D(1000)) if lo < 5000 else r(lo, D(5000)); hi_d = r(hi, D(1000)) if hi < 5000 else r(hi, D(5000))
    return lo_d, hi_d
# QUINTON: per 100 call-offs. All ASSUMED unless noted. DSP wage $16 OBSERVED (Indeed posting, QRL).
sup_h = (D('0.75'), D('1.5')); sup_rate = (D(25), D(35))
ot_share = (D('0.40'), D('0.70')); ot_prem = D('0.5')*D(16)*D(8)   # $64 per overtime shift
q_lo = 100*sup_h[0]*sup_rate[0] + 100*ot_share[0]*ot_prem
q_hi = 100*sup_h[1]*sup_rate[1] + 100*ot_share[1]*ot_prem
# ARROW: per 100 applicants. Recruiter $17-19/h OBSERVED. Hires 13% BENCHMARK.
rec_h = (D('0.5'), D('1.0')); rec_rate = (D(17), D(19)); booked = (D(30), D(40)); noshow = D('0.5'); pd_rate = D(55000)/D(2080)
a_lo = 100*rec_h[0]*rec_rate[0] + booked[0]*noshow*pd_rate
a_hi = 100*rec_h[1]*rec_rate[1] + booked[1]*noshow*pd_rate
# DAY AFTER DAY: per 100 waiver intakes.
early = (D('0.20'), D('0.40')); days = (D(3), D(10)); perday = (D(80), D(120))
d_lo = 100*early[0]*days[0]*perday[0]; d_hi = 100*early[1]*days[1]*perday[1]
# INTEGRITY: per 1,000 visits.
den = (D('0.02'), D('0.06')); visit_val = (D(60), D(120)); rework_h = (D('0.5'), D('1')); off_rate = (D(20), D(25))
i_lo = 1000*den[0]*visit_val[0] + 1000*den[0]*rework_h[0]*off_rate[0]
i_hi = 1000*den[1]*visit_val[1] + 1000*den[1]*rework_h[1]*off_rate[1]
for n,(lo,hi) in {'Quinton per 100 call-offs':(q_lo,q_hi),'Arrow per 100 applicants':(a_lo,a_hi),'DayAfterDay per 100 intakes':(d_lo,d_hi),'Integrity per 1,000 visits':(i_lo,i_hi)}.items():
    print(n, 'exact', lo.quantize(D('1'),rounding=ROUND_HALF_UP), hi.quantize(D('1'),rounding=ROUND_HALF_UP), 'display', disp(lo,hi))
