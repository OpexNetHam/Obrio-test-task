
import { Injectable } from "@nestjs/common";
import { File } from '../entities/file.entity';
import { EntityManager, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { AbstractRepository } from "../abstract.repository";

@Injectable()
export class FilesRepository extends AbstractRepository<File>{
    constructor(
        @InjectRepository(File)
        entityRepository: Repository<File>,
        entityManager: EntityManager,
    ){
        super(entityRepository, entityManager);
    }
}