import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({
  collection: 'audit_logs',
  timestamps: { createdAt: 'createdAt', updatedAt: false },
  versionKey: false,
})
export class AuditLog {
  @Prop({ required: true, index: true })
  declare requestId: string;

  @Prop({ index: true })
  declare actorId?: string;

  @Prop()
  declare actorEmail?: string;

  @Prop()
  declare actorRole?: string;

  @Prop({ required: true, index: true })
  declare action: string;

  @Prop({ required: true })
  declare method: string;

  @Prop({ required: true })
  declare path: string;

  @Prop({ required: true })
  declare statusCode: number;

  @Prop({ required: true, index: true })
  declare success: boolean;

  @Prop()
  declare ip?: string;

  @Prop()
  declare userAgent?: string;

  @Prop({ required: true })
  declare durationMs: number;

  @Prop({ type: SchemaTypes.Mixed })
  declare metadata?: Record<string, unknown>;

  @Prop()
  declare errorName?: string;

  @Prop()
  declare errorMessage?: string;

  @Prop({ required: true, default: Date.now, index: true })
  declare occurredAt: Date;
  declare createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ actorId: 1, occurredAt: -1 });
AuditLogSchema.index({ action: 1, occurredAt: -1 });
AuditLogSchema.index({ success: 1, occurredAt: -1 });
