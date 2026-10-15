
import java.util.*;

class Main {

    // ========== USER ==========
    static class User {
        final String id;
        final String name;

        User(String id, String name) {
            this.id = id;
            this.name = name;
        }

    }

    // ========== GROUP ==========
    static class Group {
        final String id;
        final String name;
        final List<Expense> expenses = new ArrayList<>();
        final Set<User> members = new HashSet<>();

        Group(String id, String name) {
            this.id = id;
            this.name = name;
        }

        void addMember(User user) {
            members.add(user);
        }
    }

    // ========== SPLIT ==========
    static class Split {
        final User user;
        final long amount;

        Split(User user, long amount) {
            this.user = user;
            this.amount = amount;
        }
    }

    // ========== EXPENSE ==========
    static class Expense {
        final String id;
        final String desc;
        final User paidBy;
        final long amount;
        final List<Split> splits;

        Expense(String id, String desc, User paidBy,
                long amount, List<Split> splits) {
            this.id = id;
            this.desc = desc;
            this.paidBy = paidBy;
            this.amount = amount;
            this.splits = splits;
        }
    }

    // ========== STRATEGY ==========
    interface SplitStrategy {
        List<Split> calculate(
            long total,
            List<User> users,
            List<Long> values
        );
    }

    // ========== EQUAL SPLIT ==========
    static class EqualSplitStrategy implements SplitStrategy {

        public List<Split> calculate(
                long total,
                List<User> users,
                List<Long> values) {

            long base = total / users.size();
            long remainder = total % users.size();

            List<Split> splits = new ArrayList<>();

            for (int i = 0; i < users.size(); i++) {
                long share = base + (i < remainder ? 1 : 0);
                splits.add(new Split(users.get(i), share));
            }

            return splits;
        }
    }


    // ========== BALANCE SHEET ==========
    static class BalanceSheet {

        // debts[A][B] = amount A owes B
        private final Map<User, Map<User, Long>> debts = new HashMap<>();

        long getDebt(User from, User to) {
            return debts.getOrDefault(from, Collections.emptyMap())
                        .getOrDefault(to, 0L);
        }

        private void setDebt(User from, User to, long amount) {
            if (amount == 0) {
                Map<User, Long> row = debts.get(from);
                if (row != null) {
                    row.remove(to);
                    if (row.isEmpty()) {
                        debts.remove(from);
                    }
                }
            } else {
                debts.computeIfAbsent(from, k -> new HashMap<>())
                     .put(to, amount);
            }
        }

        void addDebt(User from, User to, long amount) {

            // Check reverse debt
            long reverse = getDebt(to, from);

            if (reverse >= amount) {
                setDebt(to, from, reverse - amount);
            } else {
                setDebt(to, from, 0);
                long remaining = amount - reverse;
                setDebt(from, to, getDebt(from, to) + remaining);
            }
        }

        void settle(User from, User to, long amount) {

            setDebt(from, to, getDebt(from, to) - amount);
        }

        void showBalances() {
            boolean found = false;

            for (User from : debts.keySet()) {
                for (Map.Entry<User, Long> entry :
                        debts.get(from).entrySet()) {

                    System.out.println(
                        from.name + " owes " +
                        entry.getKey().name + " : " +
                        entry.getValue()
                    );
                    found = true;
                }
            }

            if (!found) {
                System.out.println("All settled!");
            }
        }
    }

    // ========== SPLITWISE SERVICE ==========
    static class SplitwiseService {

        private final Map<String, User> users = new HashMap<>();
        private final Map<String, Group> groups = new HashMap<>();
        private final BalanceSheet balanceSheet = new BalanceSheet();

        private int expenseCounter = 1;

        User createUser(String id, String name) {

            User user = new User(id, name);
            users.put(id, user);
            return user;
        }

        Group createGroup(String id, String name) {

            Group group = new Group(id, name);
            groups.put(id, group);
            return group;
        }

        void addExpense(
                Group group,
                String desc,
                User paidBy,
                long total,
                List<User> participants,
                SplitStrategy strategy,
                List<Long> values) {


            List<Split> splits =
                    strategy.calculate(total, participants, values);

            long sum = 0;
            for (Split split : splits) {
                sum += split.amount;
            }

            Expense expense = new Expense(
                "E" + expenseCounter++,
                desc,
                paidBy,
                total,
                splits
            );

            group.expenses.add(expense);

            for (Split split : splits) {
                if (!split.user.equals(paidBy)) {
                    balanceSheet.addDebt(
                        split.user,
                        paidBy,
                        split.amount
                    );
                }
            }

            System.out.println("Expense added: " + desc);
        }

        void settle(User from, User to, long amount) {
            balanceSheet.settle(from, to, amount);
            System.out.println("Payment settled: " + amount);
        }

        void showBalances() {
            balanceSheet.showBalances();
        }
    }

    // ========== MAIN ==========
    public static void main(String[] args) {

        SplitwiseService service = new SplitwiseService();

        User alice = service.createUser("U1", "Alice");
        User bob = service.createUser("U2", "Bob");
        User charlie = service.createUser("U3", "Charlie");

        Group trip = service.createGroup("G1", "Goa Trip");

        trip.addMember(alice);
        trip.addMember(bob);
        trip.addMember(charlie);

        List<User> participants =
                Arrays.asList(alice, bob, charlie);

        // Alice pays 900, equally divided
        service.addExpense(
            trip, "Dinner", alice, 900,
            participants,
            new EqualSplitStrategy(),
            null
        );

        System.out.println("\nBalances:");
        service.showBalances();

        // Charlie pays Alice 300
        service.settle(charlie, alice, 300);

        System.out.println("\nAfter settlement:");
        service.showBalances();
    }
}
