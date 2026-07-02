import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BUDGET_REPOSITORY } from './application/ports/budget.repository.port';
import { CreateBudgetService } from './commands/create-budget/create-budget.service';
import { CreateBudgetHttpController } from './commands/create-budget/create-budget.http.controller';
import { AddBudgetItemService } from './commands/add-budget-item/add-budget-item.service';
import { AddBudgetItemHttpController } from './commands/add-budget-item/add-budget-item.http.controller';
import { RecordActualService } from './commands/record-actual/record-actual.service';
import { RecordActualHttpController } from './commands/record-actual/record-actual.http.controller';
import { FinalizeBudgetService } from './commands/finalize-budget/finalize-budget.service';
import { FinalizeBudgetHttpController } from './commands/finalize-budget/finalize-budget.http.controller';
import { GetBudgetSummaryQueryHandler } from './queries/get-budget-summary/get-budget-summary.query-handler';
import { GetBudgetSummaryHttpController } from './queries/get-budget-summary/get-budget-summary.http.controller';
import { GetEventBudgetSummaryQueryHandler } from './queries/event-budget-summary/event-budget-summary.query-handler';
import { BudgetRepository } from './database/budget.repository';
import { BudgetMapper } from './database/budget.mapper';

@Module({
  imports: [CqrsModule],
  controllers: [
    CreateBudgetHttpController,
    AddBudgetItemHttpController,
    RecordActualHttpController,
    FinalizeBudgetHttpController,
    GetBudgetSummaryHttpController,
  ],
  providers: [
    BudgetMapper,
    CreateBudgetService,
    AddBudgetItemService,
    RecordActualService,
    FinalizeBudgetService,
    GetBudgetSummaryQueryHandler,
    GetEventBudgetSummaryQueryHandler,
    { provide: BUDGET_REPOSITORY, useClass: BudgetRepository },
  ],
})
export class BudgetModule {}
