import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

public class SplitwiseLLD {

    // ================= USER =================

    static class User {
        final String id;
        final String name;

        User(String id, String name) {
            this.id = Objects.requireNonNull(id);
            this.name = Objects.requireNonNull(name);
        }

        @Override
        public String toString() {
            return name;
        }
    }

    // ================= GROUP =================

    static class Group {
        final String id;
        final String name;
        final Set<String> memberIds = new HashSet<>();
        final List<Expense> expenses = new ArrayList<>();

        Group(String id, String name) {
            this.id = id;
            this.name = name;
        }

        void addMember(User user) {
            memberIds.add(user.id);
        }
    }

    // ================= SPLIT =================

    static class Split {
        final User user;
        final long amount; // Stored in paise

        Split(User user, long amount) {
            this.user = user;
            this.amount = amount;
        }
    }

    // ================= EXPENSE =================

    static class Expense {
        final String id;
        final String description;
        final User paidBy;
        final long amount;
        final List<Split> splits;

        Expense(String id, String description,
                User paidBy, long amount, List<Split> splits) {
            this.id = id;
            this.description = description;
            this.paidBy = paidBy;
            this.amount = amount;
            this.splits = List.copyOf(splits);
        }
    }

    // ================= STRATEGY =================

    interface SplitStrategy {
        List<Split> calculate(
                long total,
                List<User> users,
                List<BigDecimal> values
        );
    }

    static class EqualSplitStrategy implements SplitStrategy {

        @Override
        public List<Split> calculate(
                long total,
                List<User> users,
                List<BigDecimal> values) {

            if (users.isEmpty())
                throw new IllegalArgumentException("No participants");

            long base = total / users.size();
            long remainder = total % users.size();

            List<Split> result = new ArrayList<>();

            for (int i = 0; i < users.size(); i++) {
                long share = base + (i < remainder ? 1 : 0);
                result.add(new Split(users.get(i), share));
            }

            return result;
        }
    }

    static class ExactSplitStrategy implements SplitStrategy {

        @Override
        public List<Split> calculate(
                long total,
                List<User> users,
                List<BigDecimal> values) {

            if (values == null || values.size() != users.size())
                throw new IllegalArgumentException("Invalid exact shares");

            List<Split> result = new ArrayList<>();
            long sum = 0;

            for (int i = 0; i < users.size(); i++) {
                long share = toPaise(values.get(i));

                if (share < 0)
                    throw new IllegalArgumentException("Negative share");

                sum = Math.addExact(sum, share);
                result.add(new Split(users.get(i), share));
            }

            if (sum != total)
                throw new IllegalArgumentException(
                        "Exact shares must equal total");

            return result;
        }
    }

    static class PercentageSplitStrategy implements SplitStrategy {

        @Override
        public List<Split> calculate(
                long total,
                List<User> users,
                List<BigDecimal> values) {

            if (values == null || values.size() != users.size())
                throw new IllegalArgumentException("Invalid percentages");

            BigDecimal sum = BigDecimal.ZERO;

            for (BigDecimal percent : values) {
                if (percent == null || percent.signum() < 0)
                    throw new IllegalArgumentException("Invalid percentage");
                sum = sum.add(percent);
            }

            if (sum.compareTo(new BigDecimal("100")) != 0)
                throw new IllegalArgumentException(
                        "Percentages must total 100");

            // Largest remainder method:
            // ensures shares add up to the exact total.
            List<Long> shares = new ArrayList<>();
            List<BigDecimal> fractions = new ArrayList<>();
            long allocated = 0;

            for (BigDecimal percent : values) {
                BigDecimal raw = BigDecimal.valueOf(total)
                        .multiply(percent)
                        .divide(new BigDecimal("100"), 12,
                                RoundingMode.HALF_UP);

                long floor = raw.setScale(0, RoundingMode.DOWN)
                        .longValueExact();

                shares.add(floor);
                fractions.add(raw.subtract(BigDecimal.valueOf(floor)));
                allocated = Math.addExact(allocated, floor);
            }

            List<Integer> order = new ArrayList<>();
            for (int i = 0; i < users.size(); i++) order.add(i);

            order.sort((a, b) -> {
                int cmp = fractions.get(b).compareTo(fractions.get(a));
                return cmp != 0 ? cmp : Integer.compare(a, b);
            });

            long remaining = total - allocated;
            for (int i = 0; i < remaining; i++) {
                int index = order.get(i);
                shares.set(index, shares.get(index) + 1);
            }

            List<Split> result = new ArrayList<>();
            for (int i = 0; i < users.size(); i++)
                result.add(new Split(users.get(i), shares.get(i)));

            return result;
        }
    }

    // ================= BALANCE SHEET =================

    static class BalanceSheet {

        // debts[debtor][creditor] = amount in paise
        private final Map<String, Map<String, Long>> debts =
                new HashMap<>();

        long getDebt(String from, String to) {
            return debts.getOrDefault(from, Collections.emptyMap())
                    .getOrDefault(to, 0L);
        }

        private void setDebt(String from, String to, long amount) {
            if (amount == 0) {
                Map<String, Long> row = debts.get(from);
                if (row != null) {
                    row.remove(to);
                    if (row.isEmpty()) debts.remove(from);
                }
            } else {
                debts.computeIfAbsent(from, k -> new HashMap<>())
                        .put(to, amount);
            }
        }

        // Automatically nets opposite debts.
        void addDebt(String debtor, String creditor, long amount) {
            if (amount < 0)
                throw new IllegalArgumentException("Negative debt");

            if (debtor.equals(creditor) || amount == 0) return;

            long reverse = getDebt(creditor, debtor);

            if (reverse >= amount) {
                setDebt(creditor, debtor, reverse - amount);
            } else {
                setDebt(creditor, debtor, 0);
                long forward = getDebt(debtor, creditor);
                setDebt(debtor, creditor,
                        Math.addExact(forward, amount - reverse));
            }
        }

        void settle(String debtor, String creditor, long amount) {
            if (amount <= 0)
                throw new IllegalArgumentException("Invalid settlement");

            long outstanding = getDebt(debtor, creditor);

            if (amount > outstanding)
                throw new IllegalArgumentException(
                        "Settlement exceeds outstanding debt");

            setDebt(debtor, creditor, outstanding - amount);
        }

        void showBalances(Map<String, User> users) {
            boolean found = false;

            for (String debtor : new TreeSet<>(debts.keySet())) {
                Map<String, Long> creditors = debts.get(debtor);

                for (String creditor : new TreeSet<>(creditors.keySet())) {
                    long amount = creditors.get(creditor);
                    if (amount > 0) {
                        found = true;
                        System.out.println(
                                users.get(debtor).name + " owes " +
                                users.get(creditor).name + " Rs " +
                                format(amount));
                    }
                }
            }

            if (!found) System.out.println("All settled up!");
        }
    }

    // ================= SERVICE =================

    static class SplitwiseService {

        private final Map<String, User> users = new HashMap<>();
        private final Map<String, Group> groups = new HashMap<>();

        private final BalanceSheet balances = new BalanceSheet();

        private final Map<String, SplitStrategy> strategies = Map.of(
                "EQUAL", new EqualSplitStrategy(),
                "EXACT", new ExactSplitStrategy(),
                "PERCENT", new PercentageSplitStrategy()
        );

        void addUser(String id, String name) {
            if (users.containsKey(id))
                throw new IllegalArgumentException("Duplicate user");

            users.put(id, new User(id, name));
        }

        void createGroup(String id, String name) {
            if (groups.containsKey(id))
                throw new IllegalArgumentException("Duplicate group");

            groups.put(id, new Group(id, name));
        }

        void addUserToGroup(String groupId, String userId) {
            Group group = requireGroup(groupId);
            group.addMember(requireUser(userId));
        }

        private User requireUser(String id) {
            User user = users.get(id);
            if (user == null)
                throw new IllegalArgumentException("Unknown user: " + id);
            return user;
        }

        private Group requireGroup(String id) {
            Group group = groups.get(id);
            if (group == null)
                throw new IllegalArgumentException("Unknown group: " + id);
            return group;
        }

        void addExpense(
                String groupId,
                String paidById,
                String description,
                String totalRupees,
                List<String> participantIds,
                String splitType,
                List<BigDecimal> values) {

            Group group = requireGroup(groupId);
            User payer = requireUser(paidById);

            if (!group.memberIds.contains(paidById))
                throw new IllegalArgumentException("Payer not in group");

            if (participantIds == null || participantIds.isEmpty()
                    || new HashSet<>(participantIds).size()
                       != participantIds.size())
                throw new IllegalArgumentException(
                        "Invalid or duplicate participants");

            List<User> participants = new ArrayList<>();

            for (String id : participantIds) {
                if (!group.memberIds.contains(id))
                    throw new IllegalArgumentException(
                            "Participant not in group: " + id);
                participants.add(requireUser(id));
            }

            long total = toPaise(new BigDecimal(totalRupees));
            if (total <= 0)
                throw new IllegalArgumentException("Amount must be positive");

            SplitStrategy strategy = strategies.get(splitType);
            if (strategy == null)
                throw new IllegalArgumentException("Unknown split type");

            List<Split> splits =
                    strategy.calculate(total, participants, values);

            // Validate before modifying balances.
            long sum = 0;
            for (Split split : splits)
                sum = Math.addExact(sum, split.amount);

            if (sum != total)
                throw new IllegalStateException("Invalid split total");

            Expense expense = new Expense(
                    UUID.randomUUID().toString(),
                    description, payer, total, splits);

            for (Split split : splits) {
                if (!split.user.id.equals(payer.id))
                    balances.addDebt(
                            split.user.id, payer.id, split.amount);
            }

            group.expenses.add(expense);
            System.out.println("Expense added: " + description);
        }

        void settle(String debtorId, String creditorId, String amount) {
            requireUser(debtorId);
            requireUser(creditorId);
            balances.settle(debtorId, creditorId,
                    toPaise(new BigDecimal(amount)));
            System.out.println("Settlement recorded");
        }

        void showBalances() {
            balances.showBalances(users);
        }

        void showGroupExpenses(String groupId) {
            Group group = requireGroup(groupId);
            System.out.println("Expenses for " + group.name);

            for (Expense expense : group.expenses) {
                System.out.println(expense.description +
                        " | Paid by " + expense.paidBy.name +
                        " | Rs " + format(expense.amount));
            }
        }
    }

    // ================= MONEY HELPERS =================

    static long toPaise(BigDecimal rupees) {
        return rupees.movePointRight(2)
                .setScale(0, RoundingMode.UNNECESSARY)
                .longValueExact();
    }

    static String format(long paise) {
        return BigDecimal.valueOf(paise, 2)
                .setScale(2).toPlainString();
    }

    // ================= MAIN =================

    public static void main(String[] args) {

        SplitwiseService app = new SplitwiseService();

        app.addUser("U1", "A");
        app.addUser("U2", "B");
        app.addUser("U3", "C");

        app.createGroup("G1", "Goa Trip");

        app.addUserToGroup("G1", "U1");
        app.addUserToGroup("G1", "U2");
        app.addUserToGroup("G1", "U3");

        List<String> participants =
                List.of("U1", "U2", "U3");

        // 1. Equal split: A pays Rs 900.
        app.addExpense(
                "G1", "U1", "Dinner", "900",
                participants, "EQUAL", null);

        // 2. Exact split: B pays Rs 600.
        app.addExpense(
                "G1", "U2", "Taxi", "600",
                participants, "EXACT",
                List.of(
                        new BigDecimal("200"),
                        new BigDecimal("200"),
                        new BigDecimal("200")));

        // 3. Percentage split: C pays Rs 1000.
        app.addExpense(
                "G1", "U3", "Hotel", "1000",
                participants, "PERCENT",
                List.of(
                        new BigDecimal("50"),
                        new BigDecimal("30"),
                        new BigDecimal("20")));

        System.out.println("\n--- BALANCES ---");
        app.showBalances();

        // B pays A Rs 100.
        app.settle("U2", "U1", "100");

        System.out.println("\n--- AFTER SETTLEMENT ---");
        app.showBalances();

        System.out.println();
        app.showGroupExpenses("G1");
    }
}