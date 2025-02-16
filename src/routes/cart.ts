import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { z } from 'zod';

export const cartRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string;
        JWT_SECRET : string;
    }, 
    Variables : {
        userId : string;
    }
}>();

cartRouter.use('/*', async (c, next) => {
    try{    
        const auth = await c.req.header("Authorization");
        if(!auth || !auth.startsWith('Bearer')){
            throw new Error("invalid/missing token");
        }
        const token = auth.split(' ')[1];
        const decoded = await verify(token, c.env.JWT_SECRET);
        if(!decoded){
            throw new Error("unauthorized!");
        }

        c.set("userId", decoded.id as string);
        await next();
    } catch (err) {
        c.status(411);
        return c.json({
            message : `${err}`
        });
    }
});


cartRouter.post('/create', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const userId = c.get('userId');
        const cart = await prisma.cart.create({
            data : { userId },
        });
        return c.json({
            message : "cart created!",
            cart
        }); 
    } catch (err) {
        c.status(403);
        return c.json({
            message : `${err}`
        });
    }
});

async function getorCreateCart(userId : string, DATABASE_URL: string){
    const prisma = new PrismaClient({
        datasourceUrl : DATABASE_URL
    }).$extends(withAccelerate());

    let cart = await prisma.cart.findFirst({
        where : {userId}
    });
    if(!cart){
        cart = await prisma.cart.create({
            data : { userId }
        });
    }

    return cart;
}

async function getOrCreateCartItem(productId: string, cartId: string, DATABASE_URL: string){
    const prisma = new PrismaClient({
        datasourceUrl : DATABASE_URL
    }).$extends(withAccelerate());

    let cartitem = await prisma.cartItem.findFirst({
        where : {
            productId,
            cartId
        }
    });
    if(!cartitem){
        cartitem = await prisma.cartItem.create({
            data : {
                cartId,
                productId
            }
        }); 
    }

    return cartitem;
}

const addProductSchema = z.object({
    productId : z.string(),
    quantity : z.number()
});

cartRouter.post('/add-product', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const userId = c.get('userId');
        const body = await c.req.json();
        const { success } = addProductSchema.safeParse(body);
        if(!success){
            throw new Error("invalid inputs");
        }

        let product = await prisma.product.findFirst({
            where : {id : body.productId}
        });
        if(!product || product.stock<body.quantity){
            throw new Error("Insufficient Stock / Product does not exits");
        }
        await prisma.product.update({
            where : {id : body.productId},
            data : {
                stock : product.stock - body.quantity
            }
        });

        let cart = await getorCreateCart(userId, c.env.DATABASE_URL);

        const cartitem = await getOrCreateCartItem(body.productId, cart.id, c.env.DATABASE_URL);

        await prisma.cartItem.update({
            where : {
                id : cartitem.id
            },
            data : {
                quantity : cartitem.quantity + body.quantity
            }
        });

        return c.json({
            message : "product added to cart successfully!"
        });
    } catch (err) {
        c.status(403);
        return c.json({
            message : `${err}`
        });
    }
});

cartRouter.get('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const userId = c.get('userId');
        const cart = await prisma.cart.findFirst({
            where : { userId },
            include : {
                items : {
                    include : {
                        product : {
                            select : {
                                name : true,
                                price : true
                            }
                        }
                    }
                }
            }
        });
        if(!cart){
            throw new Error("Cart is Empty!");
        }
        const formattedCart = {
            id : cart.id,
            userId : cart.userId,
            createdAt : cart.createdAt,
            items : cart.items.map(item => ({
                name: item.product.name,
                quantity : item.quantity,
                price : item.product.price
            }))
        };

        return c.json({
            cart : formattedCart
        });
    } catch (err) {
        c.status(403);
        return c.json({
            message : `${err}`
        });
    }
});