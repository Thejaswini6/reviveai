# ReviveAI – Claude API Budget Tracking

## Budget Overview

| Category | Amount | Status |
|----------|--------|--------|
| **Total Promotional Credits** | $50 USD | Active |
| **Estimated MVP Cost** | ~$8–12 | Within budget |
| **Buffer** | 60–75% | Recommended |
| **Current Spend** | $0 | (In mock mode) |

---

## Cost Model

### Claude Haiku 4.5 Pricing
- **Input tokens:** $0.80 per 1M tokens
- **Output tokens:** $4.00 per 1M tokens

### Per-Request Estimate

**Typical analysis request:**
- Input: ~800 tokens (lead context + system prompt + tools)
- Output: ~400 tokens (structured JSON analysis)
- **Cost per request:** ~($0.80 × 0.0008) + ($4.00 × 0.0004) = ~$0.0023 USD

**Per 100 analyses:** ~$0.23 USD

---

## MVP Token Budget

| Task | Input Tokens | Output Tokens | Requests | Est. Cost |
|------|--------------|---------------|----------|-----------|
| **Analyze 10 demo leads** | 8,000 | 4,000 | 10 | $0.023 |
| **Re-analyze if needed** | 8,000 | 4,000 | 5 | $0.011 |
| **Testing (edge cases)** | 4,000 | 2,000 | 3 | $0.007 |
| **Final verification** | 8,000 | 4,000 | 2 | $0.005 |
| **Total MVP** | **28,000** | **14,000** | **20** | **~$0.05** |

**Conclusion:** MVP uses ~0.1% of available budget in real mode.

---

## Development Strategy

### Phase 1: Mock Mode (Days 1–4)
- ✅ **All development in mock mode** (zero API cost)
- ✅ Implement agent orchestrator with mock provider
- ✅ Test all workflows without calling Claude
- ✅ Create deterministic outputs for 10 demo leads

### Phase 2: Real Mode Testing (Day 5)
- ✅ Enable real Claude with API key
- ✅ Analyze all 10 demo leads once (cost: ~$0.023)
- ✅ Verify real outputs match expected behavior
- ✅ Test edge cases (opted-out, declined, duplicates)

### Phase 3: Verification (Day 6)
- ✅ Re-analyze 2–3 challenging leads if needed
- ✅ Test caching (ensure no duplicate analyses)
- ✅ Demo to hackathon judges

### Phase 4: Post-MVP (If time permits)
- ✅ Fine-tune prompts for better results
- ✅ Test error recovery
- ✅ Additional edge case coverage

---

## Token Usage Log

**Format:** Date | Request Type | Lead ID | Input | Output | Cost | Cumulative

| Date | Request | Lead | Input | Output | Cost USD | Total USD |
|------|---------|------|-------|--------|----------|-----------|
| TBD | Mock analysis | demo_01 | 800 | 400 | $0.0000 | $0.0000 |
| TBD | Mock analysis | demo_02 | 800 | 400 | $0.0000 | $0.0000 |
| — | — | — | — | — | — | — |

**To be populated during development.**

---

## Conservation Rules

### DO:
- ✅ Use mock mode by default
- ✅ Cache analysis results (don't re-analyze unchanged leads)
- ✅ Limit output to 500 tokens max
- ✅ Batch similar requests
- ✅ Use structured prompts (reusable, tested)
- ✅ Test prompts in mock mode first

### DON'T:
- ❌ Make API calls during scaffolding
- ❌ Re-analyze same lead without changes
- ❌ Use expensive models (Sonnet, Opus)
- ❌ Debug via Claude API (use logging instead)
- ❌ Experiment with different prompts in real mode
- ❌ Leave API calls in error handling paths

---

## Cost Control Checklist

Before each real Claude request:
- [ ] Is mock mode adequate for this task?
- [ ] Have we tested this workflow in mock mode?
- [ ] Will this analysis be cached or reused?
- [ ] Is the output token limit set to 500 or less?
- [ ] Have we checked the input token count?
- [ ] Is this a necessary production test or debugging?

---

## Mock Mode Provider

**File:** `packages/server/src/agent/mock.ts`

Deterministic outputs for 10 demo leads (no randomness):

```typescript
// Mock outputs
{
  'demo_01': {
    priority: 'high',
    customer_intent: 'Price-sensitive cooling solution',
    likely_reason: 'Waiting for competitor quotes',
    // ... full structured output
  },
  'demo_02': { /* ... */ },
  // ... 10 leads total
}

// When MOCK_MODE=true, return these instead of calling Claude
```

**Validation:** Mock outputs must match the same Zod schema as real Claude output.

---

## Budget Alerts

| Usage | Action |
|-------|--------|
| 0–10% ($5) | ✅ Safe, proceed normally |
| 10–25% ($12.50) | 📊 Monitor usage, log carefully |
| 25–50% ($25) | ⚠️ Switch to mock mode, batch requests |
| 50–75% ($37.50) | 🛑 Real mode off, mock only |
| 75%+ ($37.50+) | 🔴 Pause all API calls, use mock exclusively |

---

## Post-MVP Analysis

After hackathon submission, review:
- Total tokens used (input + output)
- Cost per lead analyzed
- Cost per successful recovery (if tracked)
- Optimization opportunities for next phase
- Estimate cost for 1,000 leads

---

## Anthropic Pricing Reference

**Current (as of Nov 2026):**
- Claude Haiku 4.5 Input: $0.80 / 1M tokens
- Claude Haiku 4.5 Output: $4.00 / 1M tokens

**Why Haiku?**
- 10x cheaper than Sonnet
- 50x cheaper than Opus
- Sufficient for lead analysis and recommendation
- Fast (ideal for interactive workflows)

**Model Comparison:**

| Model | Input Cost | Output Cost | Speed | Reasoning |
|-------|-----------|-----------|-------|-----------|
| **Haiku 4.5** | $0.80/1M | $4.00/1M | Fastest | **Chosen** |
| Sonnet 4 | $3/1M | $15/1M | Moderate | Too expensive |
| Opus 4 | $15/1M | $75/1M | Slowest | Way too expensive |

---

## FAQ

**Q: Why mock mode by default?**
A: Development without API risk. Easier to test, debug, and iterate. Mock outputs are deterministic and validated against real schema.

**Q: Can I cache Claude results?**
A: Yes! Store analysis in `agent_actions` table with `analysis_json` field. Before calling Claude, check if the lead was analyzed in the past 24 hours.

**Q: What if Claude returns invalid output?**
A: Zod validation catches malformed JSON. Log error, return "Analysis unavailable" to user, allow manual message creation.

**Q: How do I track costs in real mode?**
A: Each API call logs `input_tokens`, `output_tokens`, timestamp. Sum them in this file's token log.

**Q: What's the budget for 1,000 leads?**
A: 1,000 analyses × $0.0023/request = ~$2.30. Very affordable for larger scale.

---

## Resource Links

- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Claude API Documentation](https://docs.anthropic.com/)
- [Token Counter](https://docs.anthropic.com/tokens/basic-functionality) (estimate tokens before sending)

---

Last Updated: November 19, 2026
