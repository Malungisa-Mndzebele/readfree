# FreeRead - Paywall Bypass Web Application

A web application designed to help users access content behind paywalls using various techniques and services.

## ⚠️ Legal Disclaimer

This project is for educational and research purposes. Bypassing paywalls may violate:
- Terms of Service of websites
- Copyright laws
- DMCA regulations

Users are responsible for ensuring their usage complies with applicable laws and terms of service. The developers of this project do not condone or facilitate illegal access to copyrighted content.

## Target Sites

This project is designed with **The New York Times** and **The Wall Street Journal** as primary targets.

**Important:** See `SITE_SPECIFIC_ANALYSIS.md` for realistic success expectations:
- **NYT:** ~65-75% success rate (with cookie clearing + search referrer)
- **WSJ:** ~15-25% success rate (Wayback Machine only, older articles)

## Project Overview

FreeRead aims to provide a user-friendly interface for accessing paywalled content through multiple methods:
1. **Cookie Clearing** (Primary for NYT)
2. **Wayback Machine Archive** (Primary for WSJ)
3. **Search Engine Referrer** (Secondary for NYT)
4. **Direct Access** (Fallback)

## Project Structure

```
FreeRead/
├── README.md                      # This file
├── DESIGN.md                      # Complete design specification
├── MVP.md                         # Minimum Viable Product plan
├── RESEARCH.md                    # Research on existing tools and techniques
├── ARCHITECTURE.md                # Technical architecture details
├── SITE_SPECIFIC_ANALYSIS.md      # NYT & WSJ specific analysis ⭐
├── QUICKSTART.md                  # Step-by-step setup guide
├── IMPLEMENTATION_CHECKLIST.md    # Development tracking checklist
└── PROJECT_SUMMARY.md             # Quick reference guide
```

## Getting Started

1. **Read:** `SITE_SPECIFIC_ANALYSIS.md` for target site expectations
2. **Review:** `MVP.md` for the 4-week implementation plan
3. **Follow:** `QUICKSTART.md` for immediate setup steps
4. **Track:** Use `IMPLEMENTATION_CHECKLIST.md` to track progress

## Key Features (MVP)

- Cookie-based paywall bypass (NYT focus)
- Wayback Machine integration (WSJ focus)
- Search engine referrer method (NYT secondary)
- Clean article reader view
- Site-specific method routing
- Graceful error handling

## Success Expectations

Based on research and testing:

| Site | Primary Method | Expected Success Rate |
|------|---------------|---------------------|
| NYT  | Cookie Clearing | 60-70% |
| NYT  | Search Referrer | 40-50% (5/day limit) |
| NYT  | Combined       | **65-75%** |
| WSJ  | Wayback Archive| **15-25%** (old articles only) |
| WSJ  | Other Methods  | ~0% (hard paywall) |

## License

TBD - Requires legal review before publication.
