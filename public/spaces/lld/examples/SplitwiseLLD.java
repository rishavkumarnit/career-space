import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class SplitwiseLLD {
    private static final int MONEY_SCALE = 2;

    enum SplitType { EQUAL, EXACT, PERCENT }

    record User(String id, String name) {
        User {
            if (id == null || id.isBlank() || name == null || name.isBlank()) {
                throw new IllegalArgumentException("User id and name are required");
            }
        }
    }

    record Split(String userId, BigDecimal amount) {}

    record Expense(
        String description,
        String paidBy,
        BigDecimal total,
        SplitType splitType,
        List<Split> splits
    ) {}

    interface SplitStrategy {
        List<Split> calculate(
            BigDecimal total,
            List<String> participantIds,
            List<BigDecimal> values
        );
    }

    static final class EqualSplitStrategy implements SplitStrategy {
        public List<Split> calculate(
            BigDecimal total,
            List<String> participants,
            List<BigDecimal> ignored
        ) {
            int count = participants.size();
            BigDecimal each = total.divide(
                BigDecimal.valueOf(count), MONEY_SCALE, RoundingMode.DOWN
            );
            List<Split> splits = new ArrayList<>();
            BigDecimal allocated = BigDecimal.ZERO;

            for (int i = 0; i < count; i++) {
                BigDecimal amount = i == count - 1
                    ? total.subtract(allocated)
                    : each;
                splits.add(new Split(participants.get(i), money(amount)));
                allocated = allocated.add(amount);
            }
            return splits;
        }
    }

    static final class ExactSplitStrategy implements SplitStrategy {
        public List<Split> calculate(
            BigDecimal total,
            List<String> participants,
            List<BigDecimal> values
        ) {
            requireValueCount(participants, values);
            BigDecimal sum = values.stream()
                .map(SplitwiseLLD::money)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (sum.compareTo(total) != 0) {
                throw new IllegalArgumentException("Exact amounts must equal the total");
            }

            List<Split> splits = new ArrayList<>();
            for (int i = 0; i < participants.size(); i++) {
                splits.add(new Split(participants.get(i), money(values.get(i))));
            }
            return splits;
        }
    }

    static final class PercentSplitStrategy implements SplitStrategy {
        public List<Split> calculate(
            BigDecimal total,
            List<String> participants,
            List<BigDecimal> percentages
        ) {
            requireValueCount(participants, percentages);
            BigDecimal percentSum = percentages.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (percentSum.compareTo(new BigDecimal("100")) != 0) {
                throw new IllegalArgumentException("Percentages must add up to 100");
            }

            List<Split> splits = new ArrayList<>();
            BigDecimal allocated = BigDecimal.ZERO;
            for (int i = 0; i < participants.size(); i++) {
                BigDecimal amount = i == participants.size() - 1
                    ? total.subtract(allocated)
                    : total.multiply(percentages.get(i))
                        .divide(new BigDecimal("100"), MONEY_SCALE, RoundingMode.HALF_UP);
                splits.add(new Split(participants.get(i), money(amount)));
                allocated = allocated.add(amount);
            }
            return splits;
        }
    }

    static final class SplitStrategyFactory {
        static SplitStrategy forType(SplitType type) {
            return switch (type) {
                case EQUAL -> new EqualSplitStrategy();
                case EXACT -> new ExactSplitStrategy();
                case PERCENT -> new PercentSplitStrategy();
            };
        }
    }

    static final class BalanceSheet {
        // balances[creditor][debtor] = amount the debtor owes the creditor
        private final Map<String, Map<String, BigDecimal>> balances =
            new LinkedHashMap<>();

        void addDebt(String creditor, String debtor, BigDecimal amount) {
            if (creditor.equals(debtor) || amount.signum() == 0) return;

            BigDecimal reverse = get(debtor, creditor);
            if (reverse.compareTo(amount) >= 0) {
                put(debtor, creditor, reverse.subtract(amount));
            } else {
                put(debtor, creditor, BigDecimal.ZERO);
                put(creditor, debtor, amount.subtract(reverse));
            }
        }

        void settle(String debtor, String creditor, BigDecimal amount) {
            BigDecimal current = get(creditor, debtor);
            if (amount.signum() <= 0 || amount.compareTo(current) > 0) {
                throw new IllegalArgumentException("Invalid settlement amount");
            }
            put(creditor, debtor, current.subtract(amount));
        }

        void print(Map<String, User> users) {
            boolean empty = true;
            for (var creditorEntry : balances.entrySet()) {
                for (var debtorEntry : creditorEntry.getValue().entrySet()) {
                    if (debtorEntry.getValue().signum() > 0) {
                        empty = false;
                        User creditor = users.get(creditorEntry.getKey());
                        User debtor = users.get(debtorEntry.getKey());
                        System.out.printf(
                            "%s owes %s: %s%n",
                            debtor.name(), creditor.name(), debtorEntry.getValue()
                        );
                    }
                }
            }
            if (empty) System.out.println("No balances");
        }

        private BigDecimal get(String creditor, String debtor) {
            return balances.getOrDefault(creditor, Map.of())
                .getOrDefault(debtor, BigDecimal.ZERO);
        }

        private void put(String creditor, String debtor, BigDecimal amount) {
            Map<String, BigDecimal> debts = balances.computeIfAbsent(
                creditor, ignored -> new LinkedHashMap<>()
            );
            if (amount.signum() == 0) debts.remove(debtor);
            else debts.put(debtor, money(amount));
        }
    }

    static final class SplitwiseService {
        private final Map<String, User> users = new LinkedHashMap<>();
        private final List<Expense> expenses = new ArrayList<>();
        private final BalanceSheet balanceSheet = new BalanceSheet();

        void addUser(String id, String name) {
            if (users.putIfAbsent(id, new User(id, name)) != null) {
                throw new IllegalArgumentException("Duplicate user id: " + id);
            }
        }

        void addExpense(
            String description,
            String paidBy,
            BigDecimal rawTotal,
            List<String> participants,
            SplitType type,
            List<BigDecimal> values
        ) {
            requireUser(paidBy);
            validateParticipants(participants);
            BigDecimal total = money(rawTotal);
            if (total.signum() <= 0) {
                throw new IllegalArgumentException("Expense total must be positive");
            }

            List<Split> splits = SplitStrategyFactory.forType(type)
                .calculate(total, participants, values == null ? List.of() : values);

            for (Split split : splits) {
                if (!split.userId().equals(paidBy)) {
                    balanceSheet.addDebt(paidBy, split.userId(), split.amount());
                }
            }
            expenses.add(new Expense(description, paidBy, total, type, List.copyOf(splits)));
        }

        void settle(String debtor, String creditor, BigDecimal amount) {
            requireUser(debtor);
            requireUser(creditor);
            balanceSheet.settle(debtor, creditor, money(amount));
        }

        void showBalances() {
            balanceSheet.print(users);
        }

        private void validateParticipants(List<String> participants) {
            if (participants == null || participants.isEmpty()) {
                throw new IllegalArgumentException("At least one participant is required");
            }
            Set<String> unique = new LinkedHashSet<>(participants);
            if (unique.size() != participants.size()) {
                throw new IllegalArgumentException("Participants must be unique");
            }
            participants.forEach(this::requireUser);
        }

        private void requireUser(String userId) {
            if (!users.containsKey(userId)) {
                throw new IllegalArgumentException("Unknown user: " + userId);
            }
        }
    }

    private static void requireValueCount(
        List<String> participants,
        List<BigDecimal> values
    ) {
        if (values == null || participants.size() != values.size()) {
            throw new IllegalArgumentException("One value is required per participant");
        }
    }

    private static BigDecimal money(BigDecimal value) {
        if (value == null) throw new IllegalArgumentException("Amount is required");
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private static BigDecimal amount(String value) {
        return new BigDecimal(value);
    }

    public static void main(String[] args) {
        SplitwiseService app = new SplitwiseService();
        app.addUser("u1", "Rishav");
        app.addUser("u2", "Aman");
        app.addUser("u3", "Neha");

        app.addExpense(
            "Dinner", "u1", amount("1200"),
            List.of("u1", "u2", "u3"), SplitType.EQUAL, List.of()
        );
        app.addExpense(
            "Cab", "u2", amount("600"),
            List.of("u1", "u2", "u3"), SplitType.EXACT,
            List.of(amount("100"), amount("200"), amount("300"))
        );
        app.addExpense(
            "Hotel", "u3", amount("2000"),
            List.of("u1", "u2", "u3"), SplitType.PERCENT,
            List.of(amount("50"), amount("30"), amount("20"))
        );

        app.showBalances();
        app.settle("u2", "u1", amount("100"));
        System.out.println("After settlement:");
        app.showBalances();
    }
}
