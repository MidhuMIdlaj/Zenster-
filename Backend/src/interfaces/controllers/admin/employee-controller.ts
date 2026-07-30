// controllers/admin/EmployeeController.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import { StatusCode } from "../../../shared/enums/statusCode";
import { sendError, sendResponse, sendSuccess } from "../../../shared/response";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../types";
import { ResponseDTO } from "../../../domain/dtos/Response";
import { IAddEmployeeUseCase } from "../../../Application/interface/admin/employee/add-employee-usecase-interface";
import { ISoftDeleteEmployeeUseCase } from "../../../Application/interface/admin/employee/delete-employee-usecase-interface";
import { IEditEmployee } from "../../../Application/interface/admin/employee/edit-employee-usecase-interface";
import { IGetAllEmployeesUseCase } from "../../../Application/interface/admin/employee/get-all-employee-usecase-interface";
import IGetEmployeeProfileUseCase from "../../../Application/interface/admin/employee/get-employee-profile-usecase-interface";
import IEmployeeRepository from '../../../domain/Repository/i-employee-repository';
import { IUpdateEmployeeProfileUseCase } from "../../../Application/interface/admin/employee/update-employee-profile-usecase-interface";
import ISearchEmployeesUseCase from "../../../Application/interface/admin/employee/search-employee-usecase-interface";

@injectable()
export default class EmployeeController {
  constructor(
    @inject(TYPES.addEmployeeUsecases) private addEmployeeUseCase : IAddEmployeeUseCase,
    @inject(TYPES.getEmployeesUsecases) private getAllEmployeesUseCase : IGetAllEmployeesUseCase,
    @inject(TYPES.updateEmployeeProfileUsecases) private UpdateEmployeeProfileUseCase : IUpdateEmployeeProfileUseCase,
    @inject(TYPES.editEmployeeUsecases) private editEmployeeUsecases : IEditEmployee,
    @inject(TYPES.dleEmployeeUsecases) private SoftDeleteEmployeeUseCase : ISoftDeleteEmployeeUseCase,
    @inject(TYPES.searchEmployeeUsecases) private searchEmployeeUsecases : ISearchEmployeesUseCase,
    @inject(TYPES.getEmployeeProfileUsecases) private getEmployeeProfileUsecases : IGetEmployeeProfileUseCase,
    @inject(TYPES.IEmployeeRepository) private employeeRepository: IEmployeeRepository,
  ){}

  addEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const  {
        employeeName,
        emailId: emailId,
        joinDate,
        contactNumber,
        address, 
        currentSalary,
        age,
        position,
        previousJob: previousJob,
        experience,
        fieldOfMechanic
      } = req.body;

      const parsedJoinDate = new Date(joinDate);
      const parsedSalary = Number(currentSalary);
      const parsedAge = Number(age);
      const parsedExperience = Number(experience);
      let mechanicFields = fieldOfMechanic;
      if (typeof fieldOfMechanic === 'string') {
        mechanicFields = [fieldOfMechanic];
      } else if (!Array.isArray(fieldOfMechanic)) {
        mechanicFields = [];
      }

      const result = await this.addEmployeeUseCase.execute({
        employeeName,
        emailId,
        joinDate: parsedJoinDate,
        contactNumber,
        address,
        currentSalary: parsedSalary,
        age: parsedAge,
        position,
        previousJob,
        fieldOfMechanic: mechanicFields,
        experience: parsedExperience
      });

       if (result.success) {
      sendSuccess(res, { employee: result.data }, result.message, StatusCode.CREATED);
    } else {
      sendResponse(res, { success: false, statusCode: result.statusCode || StatusCode.BAD_REQUEST, message: result.message, data: null });
    }
    return;
    } catch (err: unknown) {
      next(err);
    }
  };

 getAllEmployees: RequestHandler = async (req, res) => {
   try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (isNaN(page)) throw new Error("Invalid page number");
    if (isNaN(limit)) throw new Error("Invalid limit");
    
    const result: ResponseDTO = await this.getAllEmployeesUseCase.execute(page, limit);
    sendResponse(res, { ...result, statusCode: result.statusCode || StatusCode.OK });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error while fetching employees";
    sendError(res, message, StatusCode.INTERNAL_SERVER_ERROR);
  }
};

editEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.params.employeeId

      if(!employeeId){
        throw new Error("the emplyee is not found")
      }
    const updatedData = req.body;

    const updatedEmployee = await this.editEmployeeUsecases.execute(employeeId, updatedData);

     if (!updatedEmployee) {
       sendError(res, "Employee not found", StatusCode.NOT_FOUND);
       return;
     }

     sendSuccess(res, { employee: updatedEmployee }, "Employee updated successfully", StatusCode.OK);
     return 
  } catch (err) {
    next(err);
  }
};

  
  SoftDeleteUser = async(req : Request , res : Response, next: NextFunction) =>{
    try {
      const employeeId = req.params.employeeId
      if(!employeeId){
        throw new Error("the emplyee is not found")
      }
      const result = await this.SoftDeleteEmployeeUseCase.execute(employeeId);
      if (!result) {
        sendError(res, "User not found or already deleted", StatusCode.NOT_FOUND);
        return;
      }
      sendSuccess(res, null, "User soft deleted successfully", StatusCode.OK);
    } catch (error: unknown) {
     const errorMessage = error instanceof Error ? error.message : "Internal server error";
     console.error("Error soft deleting user:", errorMessage);
     sendError(res, errorMessage, StatusCode.INTERNAL_SERVER_ERROR);
   }
  };
   
  
  searchEmployees: RequestHandler = async (req, res) => {
    try {
      const { searchTerm, status, position } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { employees, total } = await this.searchEmployeeUsecases.execute({
        searchTerm: searchTerm as string,
        status: status as string,
        position: position as string,
        page,
        limit
      });
      sendSuccess(res, { employees, total, totalPages: Math.ceil(total / limit), currentPage: page }, "Searched employees successfully", StatusCode.OK);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error searching employees:", errorMessage);
      sendError(res, "Server error while searching employees", StatusCode.INTERNAL_SERVER_ERROR);
   }
 };

 getEmployeeProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user?.userId;
       if (!employeeId) {
          sendError(res, "Employee ID is required", StatusCode.BAD_REQUEST);
          return;
        }

      const employee = await this.getEmployeeProfileUsecases.execute(employeeId);

      if (!employee) {
        sendError(res, "Employee not found", StatusCode.NOT_FOUND);
        return;
      }
      sendSuccess(res, employee, "Employee profile retrieved successfully", StatusCode.OK);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error getting employee profile:", errorMessage);
      sendError(res, "Failed to get employee profile", StatusCode.INTERNAL_SERVER_ERROR);
    }
  };


  updateEmployeeProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
       const employeeId = req.user?.userId;
      const { employeeName, contactNumber, address, age } = req.body;
      if (!employeeId) {
        sendError(res, "Employee ID is required", StatusCode.BAD_REQUEST);
        return;
      }

      if (!employeeName || !contactNumber || !address || !age) {
        sendError(res, "All fields are required", StatusCode.BAD_REQUEST);
        return;
      }

      const updatedEmployee = await this.UpdateEmployeeProfileUseCase.execute(
        employeeId,
        { employeeName, contactNumber, address, age: Number(age) }
      );

      if (!updatedEmployee) {
        sendError(res, "Employee not found", StatusCode.NOT_FOUND);
        return;
      }
      sendSuccess(res, updatedEmployee, "Profile updated successfully", StatusCode.OK);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating employee profile:", errorMessage);
      sendError(res, "Failed to update employee profile", StatusCode.INTERNAL_SERVER_ERROR);
    }
  };

  updateStatus: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const { status } = req.body;

      if (!employeeId) {
        sendError(res, 'Employee ID is required', StatusCode.BAD_REQUEST);
        return;
      }

      if (status !== 'active' && status !== 'inactive') {
        sendError(res, 'Invalid status value', StatusCode.BAD_REQUEST);
        return;
      }

      try {
        await this.employeeRepository.updateStatus(employeeId, status);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        sendError(res, message, StatusCode.NOT_FOUND);
        return;
      }

      sendSuccess(res, null, 'Employee status updated', StatusCode.OK);
      return;
    } catch (err: unknown) {
      next(err);
    }
  };
}
