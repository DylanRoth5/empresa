#!/usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import gradient from "gradient-string";
import chalkAnimation from "chalk-animation";
import figlet from "figlet";
import { createSpinner } from "nanospinner";

const sleep = (ms: number = 1000) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Queremos realizar un sistema para administrar los empleados de una compañía.
// Todos los empleados deben poder calcular su salario. Además, queremos poder calcular el costo total de la nómina de la compañía al final de un mes.
// Todos los empleados tienen la capacidad de registrar sus horas trabajadas, y el sistema puede calcular la cantidad de horas trabajadas en total en la compañía.

// Implementar las clases, interfaces y métodos necesarios para que el sistema funcione correctamente.

// Hay 2 tipos de empleados:
// los que trabajan por hora
// Los empleados que trabajan por hora tienen una cantidad de horas trabajadas y una tarifa por hora.
interface hourly_type {
  rate: number;
  hours: number;
}
// y los que trabajan por mes.
// Los empleados que trabajan por mes tienen un sueldo fijo mensual.
interface monthly_type {
  salary: number;
}

// Circunstancialmente, un empleado puede cambiar de categoría
// (de mensual a por hora o viceversa).
class Contract {
  constructor(public type: monthly_type | hourly_type) {}
}

interface LogEntry {
  timestamp: Date;
  action: string;
  details: string;
}
function isHourlyContract(
  contract: Contract
): contract is Contract & { type: hourly_type } {
  return "rate" in contract.type && "hours" in contract.type;
}

class Employee {
  name: string;
  contracts: Contract[] = [];
  logs: LogEntry[] = [];

  constructor(name: string, contracts: Contract[] = []) {
    this.name = name;
    this.contracts = contracts;
    this.logAddition(); // Log when the employee is created
  }

  private logAddition() {
    // Build contract details for the log entry
    const contractDetails = this.contracts
      .map((c, index) => {
        if ("salary" in c.type) {
          return `Contract ${index + 1}: Monthly, Salary = ${c.type.salary}`;
        } else if ("rate" in c.type && "hours" in c.type) {
          return `Contract ${index + 1}: Hourly, Rate = ${
            c.type.rate
          }, Hours = ${c.type.hours}`;
        }
        return `Contract ${index + 1}: Unknown type`;
      })
      .join(", ");

    const logEntry: LogEntry = {
      timestamp: new Date(),
      action: "Employee Added",
      details: `Employee ${this.name} with contracts: ${contractDetails} added.`,
    };
    this.logs.push(logEntry);
  }

  // Create a contract (monthly or hourly) and log the action
  createContract(con: monthly_type | hourly_type) {
    let contract = new Contract(con);
    this.contracts.push(contract);

    // Log the contract creation
    this.logContractChange(contract);
  }

  // Log a contract creation or update
  logContractChange(contract: Contract) {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      action: "Contract Created",
      details: `Created ${
        "salary" in contract.type ? "Monthly" : "Hourly"
      } contract with details: ${JSON.stringify(contract.type)}`,
    };
    this.logs.push(logEntry);
  }

  logWork(hoursWorked: number, contractIndex: number) {
    if (contractIndex < 0 || contractIndex >= this.contracts.length) {
      console.log(chalk.red("Invalid contract index."));
      return;
    }

    const contract = this.contracts[contractIndex];
    if ("rate" in contract.type) {
      // It's an hourly contract
      contract.type.hours += hoursWorked;

      const logEntry: LogEntry = {
        timestamp: new Date(),
        action: "Work Logged",
        details: `${hoursWorked} hours worked on Contract ${
          contractIndex + 1
        }.`,
      };
      this.logs.push(logEntry);
    } else {
      console.log(chalk.red("Selected contract is not an hourly contract."));
    }
  }

  // Return logs of work hours only
  getWorkLogs(): LogEntry[] {
    return this.logs.filter((log) => log.action === "Work Hours Logged");
  }

  // Get the total salary from all contracts
  getSalary(): number {
    let totalSalary = 0;
    this.contracts.forEach((contract) => {
      if ("salary" in contract.type) {
        // Monthly contract
        totalSalary += contract.type.salary;
      } else if ("rate" in contract.type && "hours" in contract.type) {
        // Hourly contract
        totalSalary += contract.type.rate * contract.type.hours;
      }
    });
    return totalSalary;
  }

  // Return logs of the employee's actions
  getLog(): LogEntry[] {
    return this.logs;
  }
  // Method to cancel a contract
  cancelContract(index: number) {
    if (index < 0 || index >= this.contracts.length) {
      console.log(chalk.red("Invalid contract index."));
      return;
    }

    const removedContract = this.contracts.splice(index, 1)[0];
    const logEntry: LogEntry = {
      timestamp: new Date(),
      action: "Contract Cancelled",
      details: `Contract with details: ${this.contractDetails(
        removedContract
      )} has been cancelled.`,
    };
    this.logs.push(logEntry);
  }

  // Helper method to get contract details
  private contractDetails(contract: Contract): string {
    if ("salary" in contract.type) {
      return `Monthly, Salary = ${contract.type.salary}`;
    } else if ("rate" in contract.type && "hours" in contract.type) {
      return `Hourly, Rate = ${contract.type.rate}, Hours = ${contract.type.hours}`;
    }
    return "Unknown type";
  }
}

class Company {
  static #instance: Company;
  public name: string = "";
  public employees: Employee[] = [];

  constructor() {}

  public static get_instance(): Company {
    if (!Company.#instance) {
      Company.#instance = new Company();
    }

    return Company.#instance;
  }

  addEmployee(emp: Employee) {
    this.employees.push(emp);
  }
  getEmployees() {
    return this.employees;
  }
  findEmployeeByName(name: string) {
    return this.employees.find((e) => {
      return e.name === name;
    });
  }
}
// El sistema debe tener un módulo de reportes, donde genera reportes de salarios o de horas trabajadas. Para que el código sea mantenible, cada tipo de reporte debe ser generado por una clase diferente.
// Pero las funcionalidades en común, como
// un encabezado conteniendo la fecha y la hora del reporte no deberían duplicarse entre ambas clases.
const timestamp = Date.now();
const date = new Date(timestamp);

// Custom formatting options for date and time
function formattedDate() {
  return new Date(Date.now()).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formattedTime() {
  return new Date(Date.now()).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

class reportSalary {
  constructor() {
    let cp = Company.get_instance();
    let total = 0;
    let lines = chalk.green(
      `This is the ${chalk.bgGreen.black(
        "salary report"
      )} of ${formattedDate()} ${formattedTime()}:\n`
    );
    cp.employees.forEach((employee) => {
      let employeeTotal = 0;
      lines += chalk.bold(`${employee.name}:\n`);

      // Loop through each contract and calculate its total
      employee.contracts.forEach((contract, index) => {
        let contractTotal = 0;
        if ("salary" in contract.type) {
          // For monthly contracts
          contractTotal = contract.type.salary;
          lines += `  Contract ${index + 1} (Monthly): ${contractTotal}\n`;
        } else if ("rate" in contract.type && "hours" in contract.type) {
          // For hourly contracts
          contractTotal = contract.type.rate * contract.type.hours;
          lines += `  Contract ${index + 1} (Hourly): ${contractTotal}\n`;
        }
        employeeTotal += contractTotal;
      });

      // Add the total salary for the employee
      lines += chalk.green(`  Employee Total: ${employeeTotal}\n\n`);
      total += employeeTotal;
    });

    lines += chalk.bold(`Overall Total: ${total}\n`);
    console.log(lines);
  }
}
class reportLog {
  constructor() {
    let cp = Company.get_instance();
    let totalWorkedHours = 0;

    let lines = chalk.green(
      `This is the ${chalk.bgGreen.black(
        "log report"
      )} of ${formattedDate()} ${formattedTime()}:\n`
    );

    cp.employees.forEach((employee) => {
      lines += chalk.bold(`Employee: ${employee.name}\n`);

      let logEntries = employee.getLog();
      if (logEntries.length > 0) {
        logEntries.forEach((log, index) => {
          lines += `  Log ${index + 1}: [${log.timestamp.toLocaleString()}] ${
            log.action
          } - ${log.details}\n`;
        });
      } else {
        lines += chalk.yellow("  No logs available for this employee.\n");
      }

      // Calculate total worked hours if there are hourly contracts
      employee.contracts.forEach((contract) => {
        if ("hours" in contract.type) {
          totalWorkedHours += contract.type.hours;
        }
      });

      lines += "\n"; // Spacing between employees
    });

    lines += chalk.bold(`Total Worked Hours: ${totalWorkedHours}\n`);
    console.log(lines);
  }
}

interface AbstractFactory {
  reportSalary(): reportSalary;

  reportLog(): reportLog;
}

class reportFabric implements AbstractFactory {
  public reportSalary(): reportSalary {
    return new reportSalary();
  }

  public reportLog(): reportLog {
    return new reportLog();
  }
}

function clientCode(factory: AbstractFactory) {
  const reportSalary = factory.reportSalary();
  const reportLog = factory.reportLog();
}

async function answer(msg: string, def: string = "") {
  return await inquirer.prompt({
    name: "result",
    type: "input",
    message: msg,
    default() {
      return def;
    },
  });
}

async function choose(msg: string, choices: string[]) {
  return await inquirer.prompt({
    name: "result",
    type: "list",
    message: `${msg}\n`,
    choices: choices,
  });
}

async function start() {
  let cp = Company.get_instance();
  let emp = new Employee("juyan", [new Contract({ salary: 1000 })]);
  emp.createContract({ rate: 5, hours: 10 });
  cp.addEmployee(emp);

  while (true) {
    // let r = await answer("this is an input trial: ");
    console.clear();
    let r = await choose("Choose an action", [
      "Add Employee",
      "List Employees",
      "Create Contract",
      "Cancel Contract",
      "Log Work Hours",
      "View Reports",
      "Exit",
    ]);

    switch (r.result) {
      case "Add Employee":
        let name = await answer("Enter employee name: ");
        let contractType = await choose("Select contract type", [
          "Hourly",
          "Monthly",
        ]);
        let newContract;
        if (contractType.result === "Hourly") {
          let rate = await answer("Enter hourly rate: ");
          let hours = await answer("Enter hours worked: ");
          newContract = new Contract({
            rate: parseFloat(rate.result),
            hours: parseFloat(hours.result),
          } as hourly_type);
        } else {
          let salary = await answer("Enter monthly salary: ");
          newContract = new Contract({
            salary: parseFloat(salary.result),
          } as monthly_type);
        }
        let newEmp = new Employee(name.result, [newContract]);
        cp.addEmployee(newEmp);
        console.log(
          chalk.green(
            `Employee ${name} with a ${contractType.result} contract added successfully!`
          )
        );
        break;

      case "List Employees":
        let employees = cp.getEmployees(); // Assuming this method exists
        if (employees.length === 0) {
          console.log(chalk.red("No employees found."));
        } else {
          employees.forEach((emp, index) => {
            console.log(chalk.green(`${index + 1}. ${emp.name}`));
          });
        }
        await choose("Press enter to return", ["return"]);
        break;

      case "Create Contract":
        let empName = await choose(
          "Select employee",
          cp.getEmployees().map((emp) => emp.name)
        );
        let employee = cp.findEmployeeByName(empName.result); // Assuming a method to find an employee by name
        if (!employee) {
          console.log(chalk.red("Employee not found!"));
          break;
        }
        let contractChoice = await choose("Select contract type", [
          "Hourly",
          "Monthly",
        ]);
        if (contractChoice.result === "Hourly") {
          let rate = await answer("Enter hourly rate: ");
          let hours = await answer("Enter hours worked: ");
          employee.createContract({
            rate: parseFloat(rate.result),
            hours: parseFloat(hours.result),
          } as hourly_type);
          console.log(
            chalk.green(`Hourly contract created for ${employee.name}`)
          );
        } else {
          let salary = await answer("Enter monthly salary: ");
          employee.createContract({
            salary: parseFloat(salary.result),
          } as monthly_type);
          console.log(
            chalk.green(`Monthly contract created for ${employee.name}`)
          );
        }
        break;

      case "Cancel Contract":
        let employeeNames2 = cp.getEmployees().map((emp) => emp.name);
        let name3 = await choose("Select employee", employeeNames2);
        let employee1 = cp.findEmployeeByName(name3.result);
        if (!employee1) {
          console.log(chalk.red("Employee not found."));
          return;
        }

        if (employee1.contracts.length === 0) {
          console.log(chalk.red("No contracts to cancel."));
          return;
        }
        let contractDetails = employee1.contracts.map((c, index) => {
          if ("salary" in c.type) {
            return `Contract ${index + 1}: Monthly, Salary = ${c.type.salary}`;
          } else if ("rate" in c.type && "hours" in c.type) {
            return `Contract ${index + 1}: Hourly, Rate = ${
              c.type.rate
            }, Hours = ${c.type.hours}`;
          }
          return `Contract ${index + 1}: Unknown type`;
        });

        let contractChoice2 = await choose(
          "Select contract to cancel",
          contractDetails
        );
        let index = parseInt(contractChoice2.result.split(" ")[1]) - 1;

        employee1.cancelContract(index);
        console.log(
          chalk.green(`Contract ${index + 1} cancelled for ${employee1.name}.`)
        );
        break;

      case "Log Work Hours":
        let employeeNames = cp.getEmployees().map((emp) => emp.name);
        let name2 = await choose("Select employee", employeeNames);
        let employee2 = cp.findEmployeeByName(name2.result);
        if (!employee2) {
          console.log(chalk.red("Employee not found."));
          return;
        }

        let hourlyContracts = employee2.contracts
          .map((c, index) => ({ index, contract: c }))
          .filter((c) => "rate" in c.contract.type); // Filter hourly contracts

        if (hourlyContracts.length === 0) {
          console.log(
            chalk.red("No hourly contracts found for this employee.")
          );
          return;
        }

        let contractChoices = hourlyContracts.map(
          (c) => `Contract ${c.index + 1}`
        );
        let contractIndex = await choose(
          "Select hourly contract",
          contractChoices
        );
        let index2 = parseInt(contractIndex.result.split(" ")[1]) - 1;

        let hours = await answer("Enter hours worked: ");
        employee2.logWork(parseFloat(hours.result), index2);
        console.log(
          chalk.green(
            `Logged ${hours.result} hours to Contract ${index2 + 1} for ${
              employee2.name
            }.`
          )
        );
        break;

      case "View Reports":
        let reportChoice = await choose("Select a report to view", [
          "Log Report",
          "Salary Report",
          "Back",
        ]);

        switch (reportChoice.result) {
          case "Log Report":
            let repLog = new reportFabric();
            repLog.reportLog(); // Assuming this shows logs of actions
            await choose("Press enter to return", ["return"]);
            break;

          case "Salary Report":
            let repSalary = new reportFabric();
            repSalary.reportSalary(); // Assuming this shows salary info
            await choose("Press enter to return", ["return"]);
            break;

          case "Back":
            console.log(chalk.yellow("Going back to the main menu."));
            break;

          default:
            console.log(chalk.red("Invalid choice, please try again."));
        }
        break;

      case "Exit":
        console.log(chalk.red("Goodbye!"));
        process.exit(0);

      default:
        console.log(chalk.red("Invalid choice, please try again."));
    }
  }
}

await start();
