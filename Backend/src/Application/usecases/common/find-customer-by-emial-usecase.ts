import { inject, injectable } from "inversify";
import IUserRepository from "../../../domain/Repository/i-user-repository";
import { TYPES } from "../../../types";
import { IFindCustomerByEmailUsecaseDto } from "../../../domain/dtos/complaint-usecase/find-customer-by-email-usecase-interface";
import IFindCustomerByEmailUseCase from "../../interface/common/find-customer-by-email-usecase-interface";
import { CustomerResponseDTO } from "../../../domain/dtos/user-usecase/customer-response-usecase-interface";



@injectable()
export class FindCustomerByEmailUseCase implements IFindCustomerByEmailUseCase {
  constructor(
    @inject(TYPES.IUserRepository) private customerRepo: IUserRepository
  ) {}
  async execute(email: string): Promise<IFindCustomerByEmailUsecaseDto> {
    if (!email) {
      throw new Error("Email is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }
    const customer = await this.customerRepo.findByEmail(email);
    if (!customer) {
      return {
        exists: false,
        data: null
      };
    }
    const responseData: CustomerResponseDTO = {
      id: customer.id,
      name: customer.clientName,
      email: customer.email,
      address: customer.address,
      status: customer.status,
      productName: customer.products?.[0]?.productName || null,
      model: customer.products?.[0]?.model || null,
      warrantyDate: customer.products?.[0]?.warrantyDate || null,
      guaranteeDate: customer.products?.[0]?.guaranteeDate || null,
      products: customer.products || []
    };
    return {
      exists: true,
      data: responseData
    };
  }
}
