import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, Types } from 'mongoose';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { AuditLog } from './schemas/audit-log.schema';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLog>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<void> {
    await this.auditLogModel.create(dto);
  }

  async list(query: ListAuditLogsQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const filter: QueryFilter<AuditLog> = {};

    if (query.actorId) filter.actorId = query.actorId;
    if (query.action) filter.action = query.action;
    if (query.success !== undefined) filter.success = query.success;

    if (query.from || query.to) {
      const occurredAt: { $gte?: Date; $lte?: Date } = {};
      if (query.from) occurredAt.$gte = new Date(query.from);
      if (query.to) occurredAt.$lte = new Date(query.to);
      filter.occurredAt = occurredAt;
    }

    const [items, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ occurredAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Không tìm thấy audit log');
    }

    const auditLog = await this.auditLogModel.findById(id).lean().exec();
    if (!auditLog) {
      throw new NotFoundException('Không tìm thấy audit log');
    }
    return auditLog;
  }
}
