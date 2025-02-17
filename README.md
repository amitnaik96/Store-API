# Store API 

## **Overview** 
A modern serverless Store API for e-commerce, optimized with Hono, Prisma, and Cloudflare Workers

## **Features**
**User Authentication** - Signup & JWT-based Login
**Cart Management** Add Products , View Cart
**Order Processing** - (Place Order with Existing Cart, View Orders)
**Product Listing** -  Fetch, Add Products

## **Tech Stack**
- **Backend**: Hono (Fast, Edge-ready framework)
- **Database**: PostgreSQL (AivenDB, Connection pool url generated by Prisma Accelerate)
- **ORM**: Prisma with @prisma/client/edge
- **Hosting**: Cloudflare Workers
- **Authentication**: JWT

![Architecture](https://github.com/amitnaik96/Store-API/blob/master/Design.png)  

## **API Endpoints**  
Below are the available API endpoints for Store:

| Method  | Endpoint       | Description                        |
|---------|---------------|------------------------------------|
| `POST`  | `/api/v1/user/signin`   | Authentication    |
| `POST`  | `/api/v1/user/signup`   | Register a user    |
| `POST`  | `/api/v1/product`   | Add a product    |
| `GET`  | `/api/v1/product/bulk`   | Fectch products list   |
| `GET`  | `/api/v1/product/:id`   | Get a specific product   |
| `POST`  | `/api/v1/cart/add-product`   | Add product to cart   |
| `GET`  | `/api/v1/cart`   | Get your cart  |
| `POST`  | `/api/v1/order`   | Place order with existing cart  |
| `POST`  | `/api/v1/order`   | Place order with existing cart  |
| `GET`  | `/api/v1/order`   | Fetch your orders |
| `GET`  | `/api/v1/order`   | Fetch your orders |
| `POST`  | `/api/v1/order/status`   | Update order status |

Some more API endpoints will be added soon.

## **Setup Instructions** 
### **1. Clone the Repository**  
```bash
    git clone https://github.com/amitnaik96/Store-API
    cd Store-API
```

### **2. Install Dependencies**  
```bash
    npm install
```

### **3. Add .env File(Environment Variables)**  
```bash
    DATABASE_URL="Connection pool url(eg: generated from Prisma Accelerate)"
    DIRECT_URL="PostgreSQL Link"
```

### **4. Add wrangler.json file**  
```bash
    {
        "$schema": "node_modules/wrangler/config-schema.json",
        "name": "store-api",
        "main": "src/index.ts",
        "compatibility_date": "2025-02-16",
        "vars": {
            "DATABASE_URL":"Connection Pool Url",
            "JWT_SECRET":"your-jwt-secret-key"
        }
    }
```

### **5. Run the Backend**  
```bash
    npm run dev
```

## **API Documentation** 

 **Register a User**
```http
    POST /api/v1/user/signin
    body : {
        "name" : "your-name",
        "email" : "your-email",
        "password" : "your-password"
    }
```