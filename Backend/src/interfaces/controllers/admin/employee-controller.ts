// controllers/admin/EmployeeController.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import { StatusCode } from "../../../shared/enums/statusCode";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../types";
import { ResponseDTO } from "../../../domain/dtos/Response";
import { IAddEmployeeUseCase } from "../../../Application/interface/admin/employee/add-employee-usecase-interface";
import { ISoftDeleteEmployeeUseCase } from "../../../Application/interface/admin/employee/delete-employee-usecase-interface";
import { IEditEmployee } from "../../../Application/interface/admin/employee/edit-employee-usecase-interface";
import { IGetAllEmployeesUseCase } from "../../../Application/interface/admin/employee/get-all-employee-usecase-interface";
import IGetEmployeeProfileUseCase from "../../../Application/interface/admin/employee/get-employee-profile-usecase-interface";
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
      res.status(StatusCode.CREATED).json({
        message: result.message,
        employee: result.data,
      });
    } else {
      res.status(result.statusCode).json({
        message: result.message,
        employee: null,
      });
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
    res.status(result.statusCode || StatusCode.OK).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error while fetching employees";

    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message,
      data: null,
      statusCode: StatusCode.INTERNAL_SERVER_ERROR
    } satisfies ResponseDTO); 
  }
};

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
       const employeeId = req.params.employeeId;
      if(!employeeId){
        throw new Error("the emplyee is not found")
      }
      const { status } = req.body;
      await this.editEmployeeUsecases.execute(employeeId, status);
      res.status(StatusCode.OK).json({ success: true, message: "Status updated" });
    } catch (err) {
      next(err);
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
       res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Employee not found" });
       return
    }

     res.status(StatusCode.OK).json({ success: true, employee: updatedEmployee });
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
        res.status(StatusCode.NOT_FOUND).json({ message: "User not found or already deleted" });
        return;
      }
      res.status(StatusCode.OK).json({ message: "User soft deleted successfully" });
    } catch (error: unknown) {
     const errorMessage = error instanceof Error ? error.message : "Internal server error";
     console.error("Error soft deleting user:", errorMessage);
     res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: errorMessage });
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
      res.status(StatusCode.OK).json({
        success: true,
        message: "Searched employees successfully",
        employees,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error searching employees:", errorMessage);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
    success: false,
    message: "Server error while searching employees"
    });
   }
 };

 getEmployeeProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user?.userId;
      if (!employeeId) {
         res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Employee ID is required"
        });
        return
      }

      const employee = await this.getEmployeeProfileUsecases.execute(employeeId);

      if (!employee) {
         res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Employee not found"
        });
        return
      }
      res.status(StatusCode.OK).json({
        success: true,
        message: "Employee profile retrieved successfully",
        data: employee
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error getting employee profile:", errorMessage);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to get employee profile"
      });
    }
  };


  updateEmployeeProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
       const employeeId = req.user?.userId;
      const { employeeName, contactNumber, address, age } = req.body;
      if (!employeeId) {
         res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Employee ID is required"
        });
        return
      }

      if (!employeeName || !contactNumber || !address || !age) {
         res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "All fields are required"
        });
        return
      }

      const updatedEmployee = await this.UpdateEmployeeProfileUseCase.execute(
        employeeId,
        { employeeName, contactNumber, address, age: Number(age) }
      );

      if (!updatedEmployee) {
         res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Employee not found"
        });
        return
      }
      res.status(StatusCode.OK).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedEmployee
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating employee profile:", errorMessage);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to update employee profile"
      });
    }
  };
}
