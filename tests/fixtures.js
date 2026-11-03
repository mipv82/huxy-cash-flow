// A small, synthetic data set used only by the automated tests.
// It is not Mari's real financial data - just enough to exercise the app's logic.
const FIXTURE = {
  seeded: false,
  version: 27,
  updatedAt: 0,
  asOf: "2024-01-01",
  historyStart: "2024-01-01",
  settings: {
    weeks: 16,
    through: "2024-06",
    floor: 500,
    weekday: 5,
    view: "daily",
    uplift: 0,
    cushion: 0,
    confirmFrom: "2024-01-01",
    showPast: true
  },
  accounts: [
    { id: "a1", name: "Test Checking", balance: 5000 }
  ],
  items: [
    { id: "b1", kind: "bill", name: "Rent", amount: 1000, account: "a1", sched: { type: "monthly", day: 1 } },
    { id: "b2", kind: "bill", name: "Phone", amount: 50, account: "a1", sched: { type: "monthly", day: 10 } },
    // These three exist only so the day-column they share with another item
    // stays on the grid after that item's own occurrence is removed - the
    // app hides a whole day's column once nothing at all happens that day.
    { id: "b3", kind: "bill", name: "Insurance", amount: 80, account: "a1", sched: { type: "monthly", day: 10 } },
    { id: "b4", kind: "bill", name: "Water", amount: 40, account: "a1", sched: { type: "monthly", day: 1 } },
    { id: "b5", kind: "bill", name: "Extra Expense", amount: 15, account: "a1", sched: { type: "once", date: "2024-01-17" } },
    { id: "i1", kind: "income", name: "Paycheck", amount: 2000, account: "a1", sched: { type: "twice", day: 15, day2: 30 } }
  ],
  overrides: {},
  loans: [],
  loansDate: "2024-01-01"
};

// Injects a mocked window.claude.use("db") before the app's own script runs,
// so the app loads this fixture instead of talking to the real cloud document.
function installMockDb(remote) {
  window.__remote = JSON.parse(JSON.stringify(remote));
  window.claude = {
    use: async (name) => {
      if (name !== "db") return null;
      return {
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => JSON.parse(JSON.stringify(window.__remote))
          }),
          set: async (d) => {
            window.__remote = JSON.parse(JSON.stringify(d));
          },
          onSnapshot: () => () => {}
        })
      };
    }
  };
}

module.exports = { FIXTURE, installMockDb };
