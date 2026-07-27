// =========================================
// 1. GENERIC INTERFACE
// =========================================



interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
}

interface User {
  id: string;
  name: string;
}

interface Goal {
  id: string;
  title: string;
}

const users: PaginatedResult<User> = {
  data: [{ id: "1", name: "John" }],
  total: 1,
  page: 1,
};

const goals: PaginatedResult<Goal> = {
  data: [{ id: "1", title: "Save Money" }],
  total: 1,
  page: 1,
};

// =========================================
// 2. GENERIC FUNCTION
// =========================================



function identity<T>(value: T): T {
  return value;
}

const user = identity<User>({
  id: "1",
  name: "John",
});

const number = identity<number>(100);

// =========================================
// 3. MULTIPLE GENERIC TYPES
// =========================================



interface ApiResponse<TData, TError> {
  success: boolean;
  data?: TData;
  error?: TError;
}

const loginResponse: ApiResponse<User, string> = {
  success: true,
  data: {
    id: "1",
    name: "John",
  },
};

// =========================================
// 4. GENERIC CONSTRAINTS
// =========================================



function getId<T extends { id: string }>(
  obj: T
): string {
  return obj.id;
}

getId({
  id: "123",
  name: "John",
});

// Works because object has id.

// =========================================
// 5. keyof + GENERICS
// =========================================

// Use for dynamic property access safely.

function getProperty<
  T,
  K extends keyof T
>(
  obj: T,
  key: K
): T[K] {
  return obj[key];
}

const person = {
  name: "John",
  age: 25,
};

const name = getProperty(person, "name");
const age = getProperty(person, "age");

// getProperty(person, "salary")


// =========================================
// 6. GENERIC TYPE ALIAS
// =========================================



type Nullable<T> = T | null;

const userName: Nullable<string> = "John";
const deletedUser: Nullable<User> = null;

// =========================================
// 7. ARRAY<T>
// =========================================

// Same as string[]

const names: Array<string> = [
  "John",
  "Mary",
];

const userList: Array<User> = [
  {
    id: "1",
    name: "John",
  },
];

// =========================================
// 8. RECORD<K,V>
// =========================================

// Use for dynamic objects.

const usersMap: Record<
  string,
  User
> = {
  user1: {
    id: "1",
    name: "John",
  },
  user2: {
    id: "2",
    name: "Mary",
  },
};

// =========================================
// 9. PROMISE<T>
// =========================================

// Use for async return types.

async function findUser(): Promise<User> {
  return {
    id: "1",
    name: "John",
  };
}

async function getCount(): Promise<number> {
  return 100;
}

// =========================================
// 10. EXPRESS REQUEST GENERICS
// =========================================

import { Request } from "express";

interface SignInInput {
  email: string;
  password: string;
}

type SignInRequest = Request<
  {},            // Params
  {},            // Response Body
  SignInInput,   // Request Body
  {}             // Query
>;

function login(req: SignInRequest) {
  req.body.email;
  req.body.password;
}

// =========================================
// 11. EXPRESS RESPONSE GENERICS
// =========================================

import { Response } from "express";

function getProfile(
  res: Response<User>
) {
  res.json({
    id: "1",
    name: "John",
  });
}

// =========================================
// 12. GENERIC REPOSITORY
// =========================================
// []: K: V
// Real-world backend pattern.

class Repository<T extends { id: string }> {
  private items: T[] = [];

  create(item: T) {
    this.items.push(item);
  }

  findById(id: string): T | undefined {
    return this.items.find(
      item => item.id === id
    );
  }

  findAll(): T[] {
    return this.items;
  }
}

const userRepo =
  new Repository<User>();

userRepo.create({
  id: "1",
  name: "John",
});

console.log(
  userRepo.findById("1")
);
const car = {
  model: "Wranger",
  manufacturer: "Jeep",
}
// =========================================
// 13. GENERIC SERVICE RESULT
// =========================================

type ServiceResult<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

async function getUserService(
  id: string
): Promise<ServiceResult<User>> {
  return {
    success: true,
    data: {
      id,
      name: "John",
    },
  };
}