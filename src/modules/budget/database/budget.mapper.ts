import { Injectable } from '@nestjs/common';
import { Mapper } from '@libs/ddd';
import { BudgetEntity } from '../domain/budget.entity';
import { BudgetItem } from '../domain/budget-item';
import { Money } from '../domain/value-objects/money.value-object';
import { BudgetOrmEntity } from './budget.persistence.model';
import { BudgetResponseDto } from '../dtos/budget.response.dto';

@Injectable()
export class BudgetMapper implements Mapper<BudgetEntity, BudgetOrmEntity, BudgetResponseDto> {
  toDomain(record: BudgetOrmEntity): BudgetEntity {
    return new BudgetEntity({
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        eventId: record.eventId,
        ownerId: record.ownerId,
        currency: record.currency,
        status: record.status,
        items: record.items.map(
          (row) =>
            new BudgetItem(
              row.itemId,
              row.name,
              row.category,
              Money.create(row.plannedAmount, record.currency),
              Money.create(row.actualAmount, record.currency),
              row.invoiceUrl,
            ),
        ),
      },
    });
  }

  toPersistence(entity: BudgetEntity): BudgetOrmEntity {
    const props = entity.getProps();
    const row = new BudgetOrmEntity();
    row.id = props.id;
    row.eventId = props.eventId;
    row.ownerId = props.ownerId;
    row.currency = props.currency;
    row.status = props.status;
    row.items = props.items.map((item) => ({
      itemId: item.itemId,
      name: item.name,
      category: item.category,
      plannedAmount: item.planned.amount,
      actualAmount: item.actual.amount,
      invoiceUrl: item.invoiceUrl,
    }));
    row.createdAt = props.createdAt;
    row.updatedAt = props.updatedAt;
    return row;
  }

  toResponse(entity: BudgetEntity): BudgetResponseDto {
    const props = entity.getProps();
    const dto = new BudgetResponseDto();
    dto.id = props.id;
    dto.eventId = props.eventId;
    dto.currency = props.currency;
    dto.status = props.status;
    dto.totalPlanned = entity.totalPlanned();
    dto.totalActual = entity.totalActual();
    return dto;
  }
}
