import UserModel from "../db/models/employee.model";
import User, { Product } from "../../domain/entities/User";
import IUserRepository from "../../domain/Repository/i-user-repository";
import bcrypt from "bcrypt";
import ClientModel from "../db/models/Admin/client.model";
import Client from "../../domain/entities/User";

export default class UserRepoImpl implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const client = await ClientModel.findOne({ email });
    if (!client) return null;
    
    return new User(
      client._id.toString(),
      client.email,
      client.clientName,
      client.attendedDate,
      client.contactNumber,
      client.address,
      client.products, 
      client.status,
      client.isDeleted
    );
  }

  async createUser(
    email: string,
    clientName: string,
    attendedDate: Date,
    contactNumber: string,
    address: string,
    products: Product[]
  ): Promise<User | null> {
    const user = await ClientModel.create({
      email,
      clientName,
      attendedDate,
      contactNumber,
      address,
      products
    });
    
    return new User(
      user._id.toString(),
      user.email,
      user.clientName,
      user.attendedDate,
      user.contactNumber,
      user.address,
      user.products,
      user.status,
      user.isDeleted
    );
  }

  async getCustomerEmails(): Promise<{ email: string; name: string }[]> {
    const users = await ClientModel.find({ isDeleted: false }, 'email clientName').lean();
    return users.map((user: Record<string, unknown>) => ({
      email: String(user.email ?? ''),
      name: String(user.clientName ?? '')
    }));
  }
  async addProductsToClient(
    email: string,
    products: Product[]
  ): Promise<User | null> {
    const user = await ClientModel.findOneAndUpdate(
      { email },
      { $push: { products: { $each: products } } },
      { new: true }
    );
    
    if (!user) return null;
    
    return new User(
      user._id.toString(),
      user.email,
      user.clientName,
      user.attendedDate,
      user.contactNumber,
      user.address,
      user.products,
      user.status,
      user.isDeleted
    );
  }

  async comparePassword(input: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(input, hashed);
  }

  async softDeleteUser(id: string): Promise<boolean> {
    const result = await ClientModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    return !!result;
  }

    async getClientById(id: string): Promise<Client | null> {
    const clientDoc = await ClientModel.findOne({_id : id});
    if (!clientDoc) return null;
    const products: Product[] = (clientDoc.products as unknown[]).map((p) => {
      const prod = p as Record<string, unknown>;
      return {
        id: String(prod._id ?? ''),
        productName: String(prod.productName ?? ''),
        quantity: String(prod.quantity ?? ''),
        brand: String(prod.brand ?? ''),
        model: String(prod.model ?? ''),
        warrantyDate: prod.warrantyDate ? new Date(prod.warrantyDate as string) : new Date(0),
        guaranteeDate: prod.guaranteeDate ? new Date(prod.guaranteeDate as string) : new Date(0),
      } as Product;
    });

    return new Client(
      clientDoc._id.toString(),
      clientDoc.email,
      clientDoc.clientName,
      clientDoc.attendedDate,
      clientDoc.contactNumber,
      clientDoc.address,
      products,
      clientDoc.status,
      clientDoc.isDeleted,
      clientDoc._id.toString()
    );
  }

  async getProductClientById(id: string): Promise<Client | null> {
    const clientDoc = await ClientModel.findOne({"products._id" : id});
    if (!clientDoc) return null;
    const products: Product[] = (clientDoc.products as unknown[]).map((p) => {
      const prod = p as Record<string, unknown>;
      return {
        id: String(prod._id ?? ''),
        productName: String(prod.productName ?? ''),
        quantity: String(prod.quantity ?? ''),
        brand: String(prod.brand ?? ''),
        model: String(prod.model ?? ''),
        warrantyDate: prod.warrantyDate ? new Date(prod.warrantyDate as string) : new Date(0),
        guaranteeDate: prod.guaranteeDate ? new Date(prod.guaranteeDate as string) : new Date(0),
      } as Product;
    });

    return new Client(
      clientDoc._id.toString(),
      clientDoc.email,
      clientDoc.clientName,
      clientDoc.attendedDate,
      clientDoc.contactNumber,
      clientDoc.address,
      products,
      clientDoc.status,
      clientDoc.isDeleted,
      clientDoc._id.toString()
    );
  }


  async getAllClients(
    page: number = 1, 
    limit: number = 10
  ): Promise<{ clients: User[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const [clients, total] = await Promise.all([
      ClientModel.find({ isDeleted: false })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ClientModel.countDocuments({ isDeleted: false })
    ]);

    return {
      clients: clients.map(client => new User(
        client._id.toString(),
        client.email,
        client.clientName,
        client.attendedDate,
        client.contactNumber,
        client.address,
        client.products, // Now using products array
        client.status,
        client.isDeleted
      )),
      total
    };
  }

  async updateClient(
    id: string,
    data: Partial<Omit<User, "id">>
  ): Promise<User | null> {
    const updated = await ClientModel.findByIdAndUpdate(
      id, 
      { $set: data },
      { new: true }
    );
    
    if (!updated) return null;
    
    return new User(
      updated._id.toString(),
      updated.email,
      updated.clientName,
      updated.attendedDate,
      updated.contactNumber,
      updated.address,
      updated.products,
      updated.status,
      updated.isDeleted
    );
  }

  async updateClientStatus(id: string, status: string): Promise<boolean> {
    const result = await ClientModel.updateOne(
      { _id: id },
      { $set: { status } }
    );
    return result.modifiedCount > 0;
  }

  async searchClients(
  searchTerm: string,
  status: string,
  page: number,
  limit: number
): Promise<{ clients: Client[]; total: number }> {
  const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { isDeleted: false };

  if (searchTerm) {
    const searchRegex = new RegExp(searchTerm, "i");
    query.$or = [
      { clientName: searchRegex },
      { email: searchRegex },
      { contactNumber: searchRegex },
      { address: searchRegex },
      { "products.productName": searchRegex },
      { "products.brand": searchRegex },
      { "products.model": searchRegex },
    ];
  }

  if (status && status !== "all") {
    query.status = status;
  }

  const [clients, total] = await Promise.all([
    ClientModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    ClientModel.countDocuments(query),
  ]);

  return {
    clients: clients.map(
      (client) =>
        new Client(
          client._id.toString(),
          client.email,
          client.clientName,
          client.attendedDate,
          client.contactNumber,
          client.address,
          client.products,
          client.status,
          client.isDeleted
        )
    ),
    total,
  };
}

}
