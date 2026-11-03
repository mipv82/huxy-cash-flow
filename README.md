# Huxy Home Cash Flow

This is the code behind Mari's home cash flow app. The app itself still opens the
same way as always, as a page on claude.ai. This repo is where the code is kept
and checked before any change reaches that page.

## What's in here

- `index.html` - the app, in one file. This matches what is published to the live page.
- `tests/` - automated tests that open the app in a browser and click around it,
  the same way a person would, to check that saving, deleting, and dates all work.
- `.github/workflows/test.yml` - tells GitHub to run those tests by itself every
  time this code changes, with no one needing to remember to run them.

## What the tests check

- The app loads with no errors.
- Removing a single payment and then saving a new amount over it does not keep
  the payment hidden. (This was a real bug, fixed once already.)
- Typing an amount on an empty day lands on that exact day, not on the Friday
  that starts that week. (This was also a real bug, fixed once already.)
- Deleting one month's payment does not touch the rest of the recurring schedule.

## Running the tests yourself (optional)

You don't need to do this for day to day use. If you ever want to check it
yourself:

```
npm install
npx playwright install chromium
npm test
```

## How changes get made

1. A change is made to `index.html` here.
2. The tests run, either automatically (if pushed to GitHub) or by hand.
3. Only once the tests pass does the change get published to the live page you
   actually use.
