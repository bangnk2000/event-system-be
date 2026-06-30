import { ExceptionBase } from '@libs/exceptions';

export class BudgetEventNotFoundError extends ExceptionBase {
  readonly code = 'BUDGET.EVENT_NOT_FOUND';
  constructor() {
    super('Event not found for this budget');
  }
}

export class NotEventOrganizerError extends ExceptionBase {
  readonly code = 'BUDGET.NOT_EVENT_ORGANIZER';
  constructor() {
    super('Only an organizer of the event can manage its budget');
  }
}

export class BudgetAlreadyExistsError extends ExceptionBase {
  readonly code = 'BUDGET.ALREADY_EXISTS';
  constructor() {
    super('A budget already exists for this event');
  }
}

export class BudgetNotFoundError extends ExceptionBase {
  readonly code = 'BUDGET.NOT_FOUND';
  constructor() {
    super('Budget not found');
  }
}

export class NotBudgetOwnerError extends ExceptionBase {
  readonly code = 'BUDGET.NOT_OWNER';
  constructor() {
    super('Only the budget owner can perform this action');
  }
}

export class BudgetFinalizedError extends ExceptionBase {
  readonly code = 'BUDGET.FINALIZED';
  constructor(action = 'modify') {
    super(`Cannot ${action} a finalized budget`);
  }
}

export class BudgetItemNotFoundError extends ExceptionBase {
  readonly code = 'BUDGET.ITEM_NOT_FOUND';
  constructor() {
    super('Budget item not found');
  }
}
