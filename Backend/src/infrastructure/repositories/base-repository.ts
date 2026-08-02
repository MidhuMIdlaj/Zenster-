import { FilterQuery, Model, UpdateQuery } from "mongoose";

export abstract class BaseRepository<T = any> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    return (await this.model.create(data as T)) as T;
  }

  async findById(id: string): Promise<T | null> {
    const item = await this.model.findById(id).lean();
    return item as T | null;
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    const item = await this.model.findOne(filter).lean();
    return item as T | null;
  }

  async findAll(filter: FilterQuery<T> = {}, sort: Record<string, 1 | -1> = {}): Promise<T[]> {
    const items = await this.model.find(filter).sort(sort).lean();
    return items as T[];
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    const item = await this.model.findByIdAndUpdate(id, data, { new: true }).lean();
    return item as T | null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return !!result;
  }
}
