import { RepositoryPort } from '@libs/ddd';
import { TournamentEntity } from '../../domain/tournament.entity';

export const TOURNAMENT_REPOSITORY = Symbol('TOURNAMENT_REPOSITORY');

export type TournamentRepositoryPort = RepositoryPort<TournamentEntity>;
