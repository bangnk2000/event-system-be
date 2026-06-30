import { BudgetEntity } from './budget.entity';
import { Money } from './value-objects/money.value-object';
import { BudgetStatus } from './budget.types';

const NOW = new Date('2026-06-30T00:00:00Z');
const money = (n: number): Money => Money.create(n, 'VND');

function draftBudget(): BudgetEntity {
  return BudgetEntity.create('evt-1', 'owner-1', 'VND', 'bud-1', NOW);
}

describe('BudgetEntity', () => {
  it('adds items and sums planned vs actual', () => {
    const budget = draftBudget();
    budget.addItem('i1', 'Thuê hội trường', 'VENUE', money(5_000_000), NOW);
    budget.addItem('i2', 'Ăn uống', 'CATERING', money(3_000_000), NOW);
    expect(budget.totalPlanned()).toBe(8_000_000);
    expect(budget.totalActual()).toBe(0);

    expect(budget.recordActual('i1', money(5_500_000), 'https://drive/inv1', NOW).isOk()).toBe(true);
    expect(budget.totalActual()).toBe(5_500_000);
  });

  it('errors recording an actual on a missing item', () => {
    const budget = draftBudget();
    expect(budget.recordActual('nope', money(1), null, NOW).isErr()).toBe(true);
  });

  it('locks edits after finalize', () => {
    const budget = draftBudget();
    budget.addItem('i1', 'Thuê hội trường', 'VENUE', money(1_000_000), NOW);
    expect(budget.finalize(NOW).isOk()).toBe(true);
    expect(budget.status).toBe(BudgetStatus.FINALIZED);
    expect(budget.addItem('i2', 'x', 'MISC', money(1), NOW).isErr()).toBe(true);
    expect(budget.finalize(NOW).isErr()).toBe(true);
  });
});
