export interface User {
  username: { type: string; required: true };
  email: { type: string; required: true };
  password: String;
  role : String;
}


