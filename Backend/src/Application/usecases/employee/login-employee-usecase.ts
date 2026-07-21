import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import IEmployeeRepository from '../../../infrastructure/repositories/employee-repository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../types';
import { ILoginEmployeeResult } from '../../../domain/dtos/Employee-usecase/login-employee-usecase-interface';
import ILoginEmployeeUseCase from '../../interface/employee/login-employee-usecase-interface';


@injectable()
export default class LoginEmployeeUseCase implements ILoginEmployeeUseCase {
  constructor(
    @inject(TYPES.IEmployeeRepository) private employeeRepo: IEmployeeRepository
  ) {}

  async execute(email: string, password: string | null): Promise<ILoginEmployeeResult> {  
    const employee = await this.employeeRepo.findByEmail(email);
    if(employee?.isDeleted) throw new Error('Currently  the Employee is Blocked you can contact Admin')
    if(employee?.status == 'inactive') throw new Error("Your Account is Inactivate you can contact admin")
    if (!employee) throw new Error("Employee not found");
    if (password === null) {
      throw new Error("Password has not been set. Please set your password.");
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) throw new Error("Invalid credentials");
    const token = jwt.sign(
      { userId: employee.id, role: employee.position, email: employee.emailId || employee.employeeName },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    return{
      position: employee.position,
      token: token,
      id  : employee.id,
      employeeName  : employee.employeeName,
      isDeleted : employee.isDeleted
    }
  }
}
 