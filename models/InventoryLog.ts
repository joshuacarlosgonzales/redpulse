// models/InventoryLog.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export type InventoryLogType = 'add' | 'remove' | 'release' | 'donation' | 'sync' | 'expired'
export type InventoryLogSource = 'manual' | 'donation' | 'release' | 'sync' | 'system'

export interface IInventoryLog extends Document {
  hospitalId: mongoose.Types.ObjectId
  bloodType: string
  type: InventoryLogType
  source: InventoryLogSource
  units: number
  balanceBefore: number
  balanceAfter: number
  actorName: string
  actorId?: mongoose.Types.ObjectId
  donorName?: string
  donorEmail?: string
  donorPhone?: string
  patientName?: string
  doctorName?: string
  hospitalWard?: string
  reason?: string
  notes: string
  expiryDate?: Date
  receiptNumber?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const InventoryLogSchema = new Schema<IInventoryLog>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bloodType: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['add', 'remove', 'release', 'donation', 'sync', 'expired'],
      required: true,
    },
    source: {
      type: String,
      enum: ['manual', 'donation', 'release', 'sync', 'system'],
      default: 'manual',
    },
    units: { type: Number, required: true },
    balanceBefore: { type: Number, default: 0 },
    balanceAfter: { type: Number, default: 0 },
    actorName: { type: String, default: 'Hospital Staff' },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    donorName: { type: String, default: '' },
    donorEmail: { type: String, default: '' },
    donorPhone: { type: String, default: '' },
    patientName: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    hospitalWard: { type: String, default: '' },
    reason: { type: String, default: '' },
    notes: { type: String, default: '' },
    expiryDate: { type: Date },
    receiptNumber: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

InventoryLogSchema.index({ hospitalId: 1, createdAt: -1 })
InventoryLogSchema.index({ hospitalId: 1, type: 1, createdAt: -1 })
InventoryLogSchema.index({ hospitalId: 1, bloodType: 1, createdAt: -1 })

const InventoryLog: Model<IInventoryLog> =
  mongoose.models.InventoryLog ||
  mongoose.model<IInventoryLog>('InventoryLog', InventoryLogSchema)

export default InventoryLog