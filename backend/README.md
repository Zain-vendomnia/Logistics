## Project Setting
Modules:
- typescript
- express
- jsonwebtoken

Dev Modules:
- ts-node-dev
- morgan
- mysql2
- bcryptjs
- @types/bcryptjs
- @types/Express
- @types/jsonwebtoken
- @types/morgan


## API Reference

#### Get USERS

```http
  GET /api/users
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `user_id` | `number` | id **automatically**|
| `username` | `string` | username UNIQUE|
| `email` | `string` |email UNIQUE |
| `password` | `string` | excrypted password |
| `created_at` | `TIMESTAMP` | current_timestamp **automatically**|



