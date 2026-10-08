# The Economic Time Machine

Which past year does 2026 most resemble, and what happened next? A law-school class
project comparing the 2026 U.S. economy with every year since 1950.

**Educational project, not financial advice.** It compares 2026 with history; nothing
here is a forecast or a recommendation to buy or sell anything.

Live site: https://ben-sampson.github.io/economic-time-machine/

This repository holds only the built static site (plain HTML/CSS/JS, no build step).
No raw data files or data downloads are included.

## Data sources (full credits and links in the site footer)
- **FRED, Federal Reserve Bank of St. Louis**: public-domain series cited as requested:
  CPI and unemployment (U.S. Bureau of Labor Statistics); Fed funds, 10-year yield,
  dollar index, M2, monetary base and Fed balance sheet (Board of Governors of the
  Federal Reserve System); federal debt (U.S. Treasury, Fiscal Service); deficit,
  receipts and interest (OMB); households and median household income (U.S. Census
  Bureau); population (BEA). The 10Y-2Y spread, recession dates and WTI oil are cited
  to the Federal Reserve Bank of St. Louis and shown only as charts or % changes.
- **IRS, Statistics of Income**: individual income tax returns filed and taxable returns.
- **OMB Historical Tables**, Table 2.1: individual income tax receipts.
- **U.S. Treasury, Fiscal Data, Debt to the Penny**: latest daily total public debt.
- **World Bank**, Commodity Price Data (The Pink Sheet): monthly gold price,
  licensed CC BY 4.0.
- **Robert J. Shiller**, Irrational Exuberance data (shillerdata.com): CAPE shown as
  annual values only, real S&P 500 as 12- and 24-month % changes only. The S&P 500 is a
  product of S&P Dow Jones Indices LLC.
- **S&P CoreLogic Case-Shiller U.S. National Home Price Index** (S&P Dow Jones Indices
  LLC, via FRED): shown only as yearly % change.
- **Long history (1900+)**: Census Historical Statistics of the United States (pre-1948
  unemployment and related series); NBER short-rate chart only; World Bank Pink Sheet
  agricultural commodities and copper (CC BY 4.0) where used. A separate 9-feature
  long-history score and monetary-era filters sit alongside the unchanged 1950+ core
  score of 13 features.
- **Compare library (public domain / CC BY, cited)**: BLS CPI/PPI/earnings/beef/rent;
  Fed Board revolving credit, delinquencies, industrial production; BEA saving rate
  and real GDP; OMB debt/deficit/interest-to-GDP; World Bank Pink Sheet silver and
  copper (CC BY 4.0).
- **Compare library (citation required, chart + FRED link only)**: Freddie Mac 30-year
  mortgage rate; NAR housing affordability index (short window). The Russell 2000 is
  omitted (FTSE Russell license; no public FRED series).

- **Printing-press cards & Expansion #2/#3 (public domain / CC BY, cited)**: BLS CPI-U NSA and
  purchasing power (dollar since 1913); OMB Historical Tables 2.1 & 3.1 with IRS returns (interest vs
  defense, outlays per taxpayer); Treasury/Fed debt holders; Fed H.4.1 plumbing (reserves, ON RRP,
  discount window, BTFP); Treasury Fiscal Data gold reserve; International Monetary Fund,
  International Financial Statistics official reserve gold (accessed via DBnomics; tonnes and net
  flows are our calculation; reported holdings only); CMS National Health Expenditure
  Accounts; AHRQ MEPS-IC; DOL Women's Bureau National Database of Childcare Prices; BLS
  health-insurance (method break ~late 2022) and daycare CPI; Fed Distributional Financial Accounts.
- **Link-only, no charts of their data**: KFF Employer Health Benefits Survey (CC BY-NC-ND);
  World Gold Council central-bank statistics (no redistribution).

No government agency, data provider or index owner endorses this project. No agency
seals or logos are used.
