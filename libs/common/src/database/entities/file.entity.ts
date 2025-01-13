
import { Column, Entity } from "typeorm";
import { AbstractEntity } from "../abstract.entity";
import { UPLOAD_STATUS } from "@app/common/enums";

@Entity()
export class File extends AbstractEntity<File> {
    @Column({
        name: 'original_url',
        type: 'text',
        nullable: false,
        unique: true,
      })
      originalUrl: string;
    
      @Column({
        name: 'drive_url',
        type: 'text',
        nullable: true
      })
      destUrl?: string;

      @Column({
        name: 'name',
        type: 'text',
        nullable: true
      })
      name?: string;
    
      @Column({
        name: 'status',
        type: 'enum',
        enum: UPLOAD_STATUS,
        default: UPLOAD_STATUS.QUEUED,
      })
      status: UPLOAD_STATUS;
    
      @Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false,
      })
      created_at: Date;
    
      @Column({
        name: 'uploaded_at',
        type: 'timestamp',
        nullable: true,
      })
      uploaded_at: Date;
}