import { EntityManager, FindOptionsWhere, Repository, UpdateOneModel } from "typeorm";
import { AbstractEntity } from "./abstract.entity";
import { NotFoundException } from "@nestjs/common";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

export abstract class AbstractRepository< T extends AbstractEntity<T>> {
    constructor(
        private readonly entityRepository: Repository<T>,
        private readonly entityManager: EntityManager,
    ) {}

    async create(entityOrEntities: T | T[]): Promise<T | T[]> {
        return this.entityManager.save(entityOrEntities);
      }

    async findOne( where: FindOptionsWhere<T>): Promise<T>{
        const entity = this.entityRepository.findOne({where});
        if(!entity) {
            throw new NotFoundException('Entity not found!');
        }
        return entity;
    }

    async findOneAndUpdate(
        where: FindOptionsWhere<T>,
        partialEntity: QueryDeepPartialEntity<T>
    ){
        const updateResult = await this.entityRepository.update(where, partialEntity);
        if(!updateResult.affected) {
            throw new NotFoundException('Entity not found!');
        }
        return this.findOne(where);
    }

    async find(
        where?: FindOptionsWhere<T>,
    ){
        const result = this.entityRepository.find({where});
        if(!result) {
            throw new NotFoundException('Entity not found!');
        }
        return result
    }

    async findOneAndDelete(
        where: FindOptionsWhere<T>,
    ){
        await this.entityRepository.delete(where);
    }

}